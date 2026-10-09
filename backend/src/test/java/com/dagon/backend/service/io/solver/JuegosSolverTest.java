package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class JuegosSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();

    private static ObjectNode datos(double[][] pagos, String[] filas, String[] columnas) {
        ObjectNode d = JSON.createObjectNode(); ArrayNode p = d.putArray("pagos");
        for (double[] fila : pagos) { ArrayNode f = p.addArray(); for (double v : fila) f.add(v); }
        if (filas != null) { ArrayNode a = d.putArray("filas"); for (String s : filas) a.add(s); }
        if (columnas != null) { ArrayNode a = d.putArray("columnas"); for (String s : columnas) a.add(s); }
        return d;
    }
    private static IoSolucion resolver(double[][] pagos) { return JuegosSolver.resolver("suma_cero", datos(pagos, null, null)); }
    @SuppressWarnings("unchecked") private static Map<String, Object> m(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") private static List<Object> l(Object o) { return (List<Object>) o; }
    private static double d(Object o) { return ((Number) o).doubleValue(); }
    private static double valor(IoSolucion s) { return d(s.resultado().get("valor")); }
    private static double pA(IoSolucion s, String k) { return d(m(s.resultado().get("estrategiaFilas")).get(k)); }
    private static double pB(IoSolucion s, String k) { return d(m(s.resultado().get("estrategiaColumnas")).get(k)); }
    private static void soloTiposSimples(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double v) { assertThat(v.isNaN() || v.isInfinite()).as("Double no finito").isFalse(); return; }
        if (o instanceof Map<?, ?> mapa) { mapa.forEach((k, v) -> { assertThat(k).isInstanceOf(String.class); soloTiposSimples(v); }); return; }
        if (o instanceof List<?> lista) { lista.forEach(JuegosSolverTest::soloTiposSimples); return; }
        fail("Tipo no permitido en la solución: " + o.getClass());
    }

    @Test void piedraPapelTijeraTieneValorCeroYEstrategiaUniforme() {
        String[] n = {"Piedra", "Papel", "Tijera"};
        var s = JuegosSolver.resolver("suma_cero", datos(new double[][]{{0, -1, 1}, {1, 0, -1}, {-1, 1, 0}}, n, n));
        assertThat(s.tipo()).isEqualTo("juegos"); assertThat(s.metodo()).isEqualTo("suma_cero"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(s.resultado().get("puntoSilla")).isEqualTo(false);
        assertThat(valor(s)).isCloseTo(0, within(1e-9));
        assertThat(d(s.resultado().get("maximin"))).isEqualTo(-1); assertThat(d(s.resultado().get("minimax"))).isEqualTo(1);
        for (String k : n) { assertThat(pA(s, k)).isCloseTo(1.0 / 3, within(1e-9)); assertThat(pB(s, k)).isCloseTo(1.0 / 3, within(1e-9)); }
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).contains("Valor del juego", "Jugador A: Piedra", "Jugador B: Tijera");
        assertThat(s.advertencias()).anyMatch(a -> a.contains("jugador A"));
        soloTiposSimples(s.resultado()); s.pasos().forEach(p -> soloTiposSimples(p.tabla())); s.metricas().forEach(mt -> soloTiposSimples(mt.valor()));
    }

    @Test void puntoSillaDaEstrategiasPuras() {
        // minimos de fila (2,0) -> maximin 2; maximos de columna (3,2,5) -> minimax 2: silla en (A1, B2).
        var s = resolver(new double[][]{{3, 2, 4}, {1, 0, 5}});
        assertThat(s.resultado().get("puntoSilla")).isEqualTo(true); assertThat(valor(s)).isEqualTo(2);
        assertThat(pA(s, "A1")).isEqualTo(1); assertThat(pA(s, "A2")).isZero();
        assertThat(pB(s, "B1")).isZero(); assertThat(pB(s, "B2")).isEqualTo(1); assertThat(pB(s, "B3")).isZero();
        assertThat(l(s.resultado().get("puntosSilla"))).hasSize(1);
        assertThat(s.pasos().get(s.pasos().size() - 1).texto()).contains("punto silla");
    }

    @Test void variosPuntosSillaSeListanTodos() {
        var s = resolver(new double[][]{{1, 1}, {1, 1}});
        assertThat(s.resultado().get("puntoSilla")).isEqualTo(true); assertThat(valor(s)).isEqualTo(1); assertThat(l(s.resultado().get("puntosSilla"))).hasSize(4);
    }

    @Test void juegoDosPorDosConFormulaCerrada() {
        // v=(ad-bc)/(a+d-b-c); p1=(d-c)/(a+d-b-c); q1=(d-b)/(a+d-b-c). Para [[2,-3],[-3,4]]: v=-1/12, p=q=(7/12, 5/12).
        var s = resolver(new double[][]{{2, -3}, {-3, 4}});
        assertThat(valor(s)).isCloseTo(-1.0 / 12, within(1e-9));
        assertThat(pA(s, "A1")).isCloseTo(7.0 / 12, within(1e-9)); assertThat(pA(s, "A2")).isCloseTo(5.0 / 12, within(1e-9));
        assertThat(pB(s, "B1")).isCloseTo(7.0 / 12, within(1e-9)); assertThat(pB(s, "B2")).isCloseTo(5.0 / 12, within(1e-9));
        // Todos los pagos negativos exigen desplazar la matriz: [[-1,-3],[-2,-1]] -> v=-5/3, p=(1/3,2/3), q=(2/3,1/3).
        var n = resolver(new double[][]{{-1, -3}, {-2, -1}});
        assertThat(valor(n)).isCloseTo(-5.0 / 3, within(1e-9));
        assertThat(pA(n, "A1")).isCloseTo(1.0 / 3, within(1e-9)); assertThat(pB(n, "B1")).isCloseTo(2.0 / 3, within(1e-9));
    }

    @Test void valoresDeReferenciaDelOraculo() {
        // [[2,3,11],[7,5,2]]: A mezcla (3/11, 8/11) (cruce de las columnas 2 y 3: 5-2p = 2+9p) y el valor es 49/11. [[3,-1],[-2,1]]: valor 1/7.
        var s = resolver(new double[][]{{2, 3, 11}, {7, 5, 2}});
        assertThat(valor(s)).isCloseTo(49.0 / 11, within(1e-9)); assertThat(pA(s, "A1")).isCloseTo(3.0 / 11, within(1e-9)); assertThat(pA(s, "A2")).isCloseTo(8.0 / 11, within(1e-9));
        assertThat(valor(resolver(new double[][]{{3, -1}, {-2, 1}}))).isCloseTo(1.0 / 7, within(1e-9));
    }

    @Test void informaDeEstrategiasDominadas() {
        // A2 está dominada por A1 y B1 por B2 (B minimiza); el valor se calcula igualmente sobre la matriz completa.
        var s = resolver(new double[][]{{3, 1}, {2, 0}});
        assertThat(valor(s)).isEqualTo(1);
        assertThat(s.pasos()).anyMatch(p -> p.texto().contains("A2") && p.texto().contains("dominada"));
        assertThat(s.pasos()).anyMatch(p -> p.texto().contains("B1") && p.texto().contains("dominada"));
        var sin = resolver(new double[][]{{2, -3}, {-3, 4}});
        assertThat(sin.pasos()).anyMatch(p -> p.texto().contains("dominadas") && p.texto().contains("ninguna"));
    }

    @Test void certificadoDeOptimalidadEnMatricesAleatorias() {
        // Si p garantiza >= v contra toda columna y q garantiza <= v contra toda fila, v es el valor del juego.
        Random az = new Random(99L); int mixtos = 0;
        for (int caso = 0; caso < 250; caso++) {
            int f = 2 + az.nextInt(4), c = 2 + az.nextInt(4); double[][] A = new double[f][c];
            for (double[] fila : A) for (int j = 0; j < c; j++) fila[j] = az.nextInt(15) - 5;
            var s = resolver(A); double v = valor(s);
            double sumaP = 0, sumaQ = 0; double[] p = new double[f], q = new double[c];
            for (int i = 0; i < f; i++) { p[i] = pA(s, "A" + (i + 1)); sumaP += p[i]; assertThat(p[i]).isGreaterThanOrEqualTo(0); }
            for (int j = 0; j < c; j++) { q[j] = pB(s, "B" + (j + 1)); sumaQ += q[j]; assertThat(q[j]).isGreaterThanOrEqualTo(0); }
            assertThat(sumaP).isCloseTo(1, within(1e-9)); assertThat(sumaQ).isCloseTo(1, within(1e-9));
            for (int j = 0; j < c; j++) { double g = 0; for (int i = 0; i < f; i++) g += p[i] * A[i][j]; assertThat(g).as("A contra columna %d caso %d", j, caso).isGreaterThanOrEqualTo(v - 1e-7); }
            for (int i = 0; i < f; i++) { double g = 0; for (int j = 0; j < c; j++) g += A[i][j] * q[j]; assertThat(g).as("B contra fila %d caso %d", i, caso).isLessThanOrEqualTo(v + 1e-7); }
            double maximin = d(s.resultado().get("maximin")), minimax = d(s.resultado().get("minimax"));
            assertThat(maximin).isLessThanOrEqualTo(v + 1e-9); assertThat(v).isLessThanOrEqualTo(minimax + 1e-9);
            assertThat(s.resultado().get("puntoSilla")).isEqualTo(maximin == minimax);
            if (maximin < minimax) mixtos++;
        }
        assertThat(mixtos).isGreaterThan(50);
    }

    @Test void rechazaEntradasInvalidas() {
        assertThatThrownBy(() -> JuegosSolver.resolver("suma_cero", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> JuegosSolver.resolver("otro", datos(new double[][]{{1}}, null, null))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Método");
        assertThatThrownBy(() -> JuegosSolver.resolver("suma_cero", JSON.createObjectNode())).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("pagos");
        assertThatThrownBy(() -> resolver(new double[][]{})).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver(new double[][]{{1, 2}, {3}})).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("rectangular");
        ObjectNode texto = JSON.createObjectNode(); texto.putArray("pagos").addArray().add("x").add(1);
        assertThatThrownBy(() -> JuegosSolver.resolver("suma_cero", texto)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("número");
        assertThatThrownBy(() -> JuegosSolver.resolver("suma_cero", datos(new double[][]{{1, 2}, {3, 4}}, new String[]{"a", "a"}, null))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("distintos");
        assertThatThrownBy(() -> JuegosSolver.resolver("suma_cero", datos(new double[][]{{1, 2}, {3, 4}}, new String[]{"a"}, null))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("nombre");
        assertThatThrownBy(() -> resolver(new double[21][1])).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("20");
        assertThatThrownBy(() -> resolver(new double[][]{{1e13, 1}})).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void admiteElTamanoMaximoDeLaTabla() {
        double[][] A = new double[20][20]; Random az = new Random(5L);
        for (double[] fila : A) for (int j = 0; j < 20; j++) fila[j] = az.nextInt(21) - 10;
        var s = resolver(A);
        double sumaP = 0; for (int i = 0; i < 20; i++) sumaP += pA(s, "A" + (i + 1));
        assertThat(sumaP).isCloseTo(1, within(1e-9));
    }
}
