package com.dagon.backend.service.io;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class IoParserTextoTest {
    private static List<IoParserTexto.Tok> tokens(String s) { return new IoParserTexto(s).nums; }

    @Test void normalizacionConservaLongitudYPosiciones() {
        String s = "Producción ÁÉÍÓÚ ñandú: cuesta $5, ¿cuántas mesas?";
        var t = new IoParserTexto(s);
        assertThat(t.n).hasSameSizeAs(t.original).contains("produccion").contains("nandu").contains("cuantas");
    }
    @Test void separadoresInequivocosYAmbiguos() {
        assertThat(tokens("1,200,000").get(0).valor()).isEqualTo(1200000);
        assertThat(tokens("1.200.000").get(0).valor()).isEqualTo(1200000);
        assertThat(tokens("1,200.50").get(0).valor()).isEqualTo(1200.5);
        assertThat(tokens("1.200,50").get(0).valor()).isEqualTo(1200.5);
        assertThat(tokens("0,500").get(0).valor()).isEqualTo(0.5);
        assertThat(tokens("2,5").get(0).valor()).isEqualTo(2.5);
        assertThat(tokens("1.5").get(0).valor()).isEqualTo(1.5);
        assertThat(tokens("1,200").get(0).ambiguo()).isTrue();
        assertThat(tokens("12.345").get(0).ambiguo()).isTrue();
        assertThat(tokens("4,6,8").get(0).ambiguo()).isTrue();
    }
    @Test void numerosEscritosConPalabras() {
        assertThat(tokens("tres horas").get(0).valor()).isEqualTo(3);
        assertThat(tokens("doce piezas").get(0).valor()).isEqualTo(12);
        assertThat(tokens("treinta y cinco pesos").get(0).valor()).isEqualTo(35);
        assertThat(tokens("veinte kilos").get(0).valor()).isEqualTo(20);
        assertThat(tokens("5 mil pesos").get(0).valor()).isEqualTo(5000);
        assertThat(tokens("cuesta una hora de trabajo").get(0).valor()).isEqualTo(1);
        assertThat(tokens("Tres plantas").get(0).palabra()).isTrue();
        // "un" suelto y "una unidad" no son cifras; "mitad", "doble" tampoco.
        assertThat(tokens("una fábrica produce un artículo")).isEmpty();
    }
    @Test void identificadoresNoSonCifrasPendientes() {
        var t = new IoParserTexto("El producto P1 usa x2 y la tubería m3 cuesta 7");
        assertThat(t.pendientes()).hasSize(1).first().asString().contains("7");
    }
    @Test void cifrasConsumidasDejanDePreguntarse() {
        var t = new IoParserTexto("Hay 18 horas y 25 piezas");
        t.marcar(t.nums.get(0).ini(), t.nums.get(0).fin());
        assertThat(t.pendientes()).hasSize(1).first().asString().contains("25");
    }
    @Test void evidenciasSonCitasLiteralesDelEnunciado() {
        String s = "Cada mesa deja $3 de ganancia. No hay datos aquí.\nLa silla deja $5 de ganancia. Otra frase sin cifras.";
        var t = new IoParserTexto(s);
        t.marcar(t.nums.get(0).ini(), t.nums.get(0).fin()); t.marcar(t.nums.get(1).ini(), t.nums.get(1).fin());
        var citas = t.evidencias();
        assertThat(citas).hasSize(2);
        citas.forEach(c -> assertThat(IoModeloValidator.normalizarCita(s)).contains(IoModeloValidator.normalizarCita(c)));
    }
    @Test void codigosEnMayusculaSeDistinguenDeLasPreposiciones() {
        var t = new IoParserTexto("Cada unidad de A requiere 2 horas; llegan a B.");
        assertThat(t.n).doesNotContain("de a ").contains("de  requiere");
    }
    @Test void exigeBinariasYEnterosSonTextualesYConservadores() {
        assertThat(IoParserLocal.exigeBinarias("Cada proyecto se acepta o no (variables binarias).")).isTrue();
        assertThat(IoParserLocal.exigeBinarias("La decisión es de sí o no para cada proyecto.")).isTrue();
        assertThat(IoParserLocal.exigeBinarias("Las cantidades deben ser enteras.")).isFalse();
        assertThat(IoParserLocal.exigeEnteros("Las cantidades deben ser enteras.")).isTrue();
        assertThat(IoParserLocal.exigeEnteros("Las cantidades son continuas.")).isFalse();
        assertThat(IoParserLocal.exigeEnteros("Las variables son binarias.")).isTrue();
    }
}
