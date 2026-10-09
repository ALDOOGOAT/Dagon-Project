package com.dagon.backend.service.io;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.Map;
import java.util.LinkedHashMap;
import static org.assertj.core.api.Assertions.*;

/** Enunciados de hasta 12000 caracteres, incluidos los patológicos para regex, deben interpretarse en menos de 50 ms por llamada. */
class IoParserRendimientoTest {
    private final IoParserLocal parser = new IoParserLocal();

    private static String repetir(String trozo) { return trozo.repeat(12000 / trozo.length() + 1).substring(0, 12000); }
    /** Mediana de 5 llamadas tras calentar el intérprete (la clase y las regex ya cargadas); evita falsos positivos por GC. */
    private long medianaMs(String texto) {
        long[] t = new long[5];
        for (int i = 0; i < t.length; i++) { long ini = System.nanoTime(); parser.interpretar(texto); t[i] = (System.nanoTime() - ini) / 1_000_000; }
        Arrays.sort(t);
        return t[t.length / 2];
    }

    @Test void corridasLargasDeDigitosPuntosYEspaciosNoTienenTiempoCuadratico() {
        parser.interpretar("Llegan 10 clientes por hora y se atienden 15 clientes por hora en un servidor.");
        Map<String, String> patologicos = new LinkedHashMap<>();
        patologicos.put("11900 dígitos", "1".repeat(11900));
        patologicos.put("12000 puntos", ".".repeat(12000));
        patologicos.put("12000 espacios", " ".repeat(12000));
        patologicos.put("dígitos y barra", "1".repeat(5000) + " / " + "1".repeat(5000));
        patologicos.put("dígito, punto y espacio", repetir("1. "));
        patologicos.put("dígito y coma", repetir("1,2,"));
        patologicos.put("espacios y cifra final", " ".repeat(11990) + "5 mesas");
        patologicos.put("espacios entre cifras", "1" + " ".repeat(5990) + "2" + " ".repeat(5990) + "mil");
        patologicos.forEach((nombre, texto) -> assertThat(medianaMs(texto)).as(nombre).isLessThan(50));
    }
    @Test void textosLargosYAdversariosNoSuperanElPresupuesto() {
        parser.interpretar("Llegan 10 clientes por hora y se atienden 15 clientes por hora en un servidor.");
        String pl = "Cada unidad de A requiere 2 horas de corte y 1 hora de ensamble; se dispone de 40 horas de corte. La utilidad es de $5 por unidad de A. ";
        String tabla = "Producto | Corte (h) | Ensamble (h) | Utilidad ($)\nP1 | 2 | 1 | 5\n";
        String[] textos = {repetir(pl), repetir(tabla), repetir("cada "), repetir("1 "), repetir("a "), repetir("de la de la de "), repetir("A: 1, 2, 3; "),
                repetir("x1+x2+x3-"), repetir("al menos 5 horas de "), repetir("hay 3 kg de acero y "), repetir("de A a B 7, "), repetir("llegan 10 clientes por hora "),
                repetir("0,5 % de los clientes de A permanece en A "), repetir("maximizar "), repetir("A y B 3 A "), repetir("a: 1 2 "), repetir("| 1 | a | "),
                "maximizar z = x " + repetir("sujeto a x + y <= "), "(".repeat(6000) + ")".repeat(6000), "$".repeat(12000), "x".repeat(12000)};
        for (String t : textos) assertThat(medianaMs(t)).as(t.substring(0, Math.min(40, t.length()))).isLessThan(50);
    }
    @Test void textoRealistaLargoSeInterpretaEnTiempo() {
        String base = "Una empresa fabrica dos productos, A y B. Cada unidad de A requiere 2 horas de corte y 1 hora de ensamble; cada unidad de B requiere 1 hora de corte y 3 horas de ensamble. Se dispone de 40 horas de corte y 45 de ensamble a la semana. La utilidad es de $5 por unidad de A y $4 por unidad de B. Maximizar la utilidad. ";
        String relleno = "Este enunciado incluye una descripción larga del contexto de la empresa, sus clientes y su historia, sin cifras relevantes. ";
        String texto = (base + relleno.repeat(100)).substring(0, 12000);
        assertThat(medianaMs(texto)).isLessThan(50);
        assertThat(new IoModeloValidator().validar(parser.interpretar(texto), texto).estado()).isEqualTo("listo");
    }
    @Test void unaExcepcionInternaNuncaEscapaDelInterprete() {
        // Incluso con entradas degeneradas el resultado es siempre un estado válido del contrato.
        for (String t : new String[]{null, "", "   ", "\u0000".repeat(50), "".repeat(100), "(".repeat(5000)})
            assertThat(parser.interpretar(t).estado()).isIn("listo", "incompleto", "no_soportado");
    }
}
