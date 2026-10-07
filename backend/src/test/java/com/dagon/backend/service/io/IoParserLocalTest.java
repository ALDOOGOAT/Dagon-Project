package com.dagon.backend.service.io;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class IoParserLocalTest {
    static final String PL = "Una fábrica produce mesas y sillas. Cada mesa aporta una ganancia de 3 euros y cada silla de 5 euros. Se pueden fabricar como máximo 4 mesas y 6 sillas. Cada mesa consume 3 horas de acabado y cada silla 2 horas; hay 18 horas de acabado disponibles. ¿Cuántas mesas y sillas debe producir para maximizar la ganancia? Las cantidades son continuas y no negativas.";
    static final String EOQ = "La demanda anual es de 1200 unidades, el costo por pedido es de 50 pesos y el costo de mantener una unidad al año es de 2 pesos. Calcular el lote económico.";
    static final String COLAS = "Llegan 10 clientes por hora y se atienden 15 clientes por hora en un servidor.";
    private final IoParserLocal parser = new IoParserLocal();
    private final IoModeloValidator validador = new IoModeloValidator();
    private IoInterpretacion extraer(String enunciado) { return validador.validar(parser.interpretar(enunciado), enunciado); }

    @Test void wyndorSeFormulaSinResolverNiInventarCoeficientes() {
        var r = extraer(PL);
        assertThat(r.estado()).isEqualTo("listo"); assertThat(r.fuente()).isEqualTo("local");
        assertThat(r.modelo().path("datos").path("objetivo").asText()).isEqualTo("max z=3.0x1+5.0x2");
        assertThat(r.modelo().path("datos").path("restricciones").toString()).contains("x1<=4.0", "x2<=6.0", "3.0x1+2.0x2<=18.0", "x1,x2>=0");
        assertThat(r.modelo().has("solucion")).isFalse();
    }
    @Test void extraeEoqConUnidadAnualDeclarada() {
        var r = extraer(EOQ); assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("datos").path("D").asInt()).isEqualTo(1200);
        assertThat(r.modelo().path("datos").path("S").asInt()).isEqualTo(50);
        assertThat(r.modelo().path("datos").path("H").asInt()).isEqualTo(2);
    }
    @Test void colasMm1NoIncluyeSIncompatibleConAdaptador() {
        var r = extraer(COLAS); assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("datos").has("s")).isFalse(); assertThat(r.supuestos()).isNotEmpty();
    }
    @Test void preguntaPorParametrosFaltantesYUnidadesIncompatibles() {
        assertThat(extraer("Inventario con demanda anual de 1200 unidades. Calcular EOQ.").estado()).isEqualTo("incompleto");
        assertThat(extraer(COLAS.replace("15 clientes por hora", "15 clientes por minuto")).estado()).isEqualTo("incompleto");
        assertThat(extraer(COLAS.replace("un servidor", "1.5 servidores")).estado()).isEqualTo("incompleto");
    }
    @Test void nuncaDescartaRestriccionesNiProductosAdicionales() {
        assertThat(extraer(PL + " Se deben fabricar al menos 3 mesas.").estado()).isEqualTo("incompleto");
        assertThat(extraer(PL + " Hay un presupuesto de 100 pesos.").estado()).isEqualTo("incompleto");
        assertThat(extraer(PL + " Se necesitan 25 unidades de material.").estado()).isEqualTo("incompleto");
        assertThat(extraer(PL.replace("produce mesas y sillas", "produce mesas, sillas y bancos")).estado()).isEqualTo("incompleto");
    }
    @Test void enterasSeModelanConBranchAndBoundSinRedondear() {
        var r = extraer(PL.replace(" Las cantidades son continuas y no negativas.", "") + " Las cantidades deben ser enteras.");
        assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("metodo").asText()).isEqualTo("branch_bound");
        assertThat(r.modelo().path("datos").path("restricciones").toString()).contains("x1,x2 enteras");
    }
    @Test void noAfirmaInterpretacionUniversalLocal() {
        assertThat(extraer("Resuelve este problema de transporte entre varias ciudades.").estado()).isEqualTo("no_soportado");
    }
}
