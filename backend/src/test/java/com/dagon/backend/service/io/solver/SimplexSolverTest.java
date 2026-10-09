package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class SimplexSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();

    private static ObjectNode datos(String objetivo, String... restricciones) {
        ObjectNode d = JSON.createObjectNode().put("objetivo", objetivo);
        var lista = d.putArray("restricciones"); for (String r : restricciones) lista.add(r);
        return d;
    }

    @Test void muchasBasesDegeneradasNoAgotanLaMemoria() {
        // Regresión: con objetivo nulo y 29 filas degeneradas la cola de óptimos múltiples crecía sin tope (OutOfMemoryError).
        var r = new ArrayList<String>();
        for (int k = 1; k <= 29; k++) {
            var fila = new StringBuilder();
            for (int j = 1; j <= 10; j++) { int c = ((3 * k + j) % 4) - 1; fila.append(c >= 0 ? "+" : "").append(c).append("x").append(j); }
            r.add(fila + "<=0");
        }
        r.add("x1,x2,x3,x4,x5,x6,x7,x8,x9,x10>=0");
        long inicio = System.nanoTime();
        var s = SimplexSolver.resolver("simplex", datos("max z=0x1+0x2+0x3+0x4+0x5+0x6+0x7+0x8+0x9+0x10", r.toArray(String[]::new)));
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat((System.nanoTime() - inicio) / 1e9).isLessThan(2);
    }
    private static IoSolucion resolver(String objetivo, String... restricciones) { return SimplexSolver.resolver("simplex", datos(objetivo, restricciones)); }
    @SuppressWarnings("unchecked") private static Map<String, Object> m(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") private static List<Object> l(Object o) { return (List<Object>) o; }
    private static double d(Object o) { return ((Number) o).doubleValue(); }
    private static double x(IoSolucion s, String v) { return d(m(s.resultado().get("x")).get(v)); }
    private static double z(IoSolucion s) { return d(s.resultado().get("z")); }
    /** Comprueba actual/min/max de un rango de sensibilidad; null significa sin cota. */
    private static void rango(Object r, double actual, Number min, Number max) {
        assertThat(d(m(r).get("actual"))).isCloseTo(actual, within(1e-9));
        if (min == null) assertThat(m(r).get("min")).isNull(); else assertThat(d(m(r).get("min"))).isCloseTo(min.doubleValue(), within(1e-9));
        if (max == null) assertThat(m(r).get("max")).isNull(); else assertThat(d(m(r).get("max"))).isCloseTo(max.doubleValue(), within(1e-9));
    }
    private static double dual(IoSolucion s, int i) { return d(l(s.resultado().get("duales")).get(i)); }

    /** El resultado debe ser serializable por Jackson 3: solo tipos simples y nada de NaN/Infinity. */
    private static void soloTiposSimples(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double v) { assertThat(v.isNaN() || v.isInfinite()).as("Double no finito").isFalse(); return; }
        if (o instanceof Map<?, ?> mapa) { mapa.forEach((k, v) -> { assertThat(k).isInstanceOf(String.class); soloTiposSimples(v); }); return; }
        if (o instanceof List<?> lista) { lista.forEach(SimplexSolverTest::soloTiposSimples); return; }
        fail("Tipo no permitido en la solución: " + o.getClass());
    }

    @Test void wyndorPrimalDualTablasYSensibilidad() {
        var s = resolver("max z=3x1+5x2", "x1<=4", "2x2<=12", "3x1+2x2<=18", "x1,x2>=0");
        assertThat(s.tipo()).isEqualTo("pl"); assertThat(s.metodo()).isEqualTo("simplex"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(z(s)).isCloseTo(36, within(1e-9)); assertThat(x(s, "x1")).isCloseTo(2, within(1e-9)); assertThat(x(s, "x2")).isCloseTo(6, within(1e-9));
        assertThat(dual(s, 0)).isCloseTo(0, within(1e-9)); assertThat(dual(s, 1)).isCloseTo(1.5, within(1e-9)); assertThat(dual(s, 2)).isCloseTo(1, within(1e-9));
        assertThat(d(m(s.resultado().get("holguras")).get("s_1"))).isCloseTo(2, within(1e-9));
        assertThat(s.resultado().get("multiple")).isEqualTo(false);
        // Rangos de Hillier: b2 en [6,18], b1 en [2,inf), b3 en [12,24]; c1 en [0,7.5], c2 en [2,inf).
        var sb = l(m(s.resultado().get("sensibilidad")).get("b")); var sc = l(m(s.resultado().get("sensibilidad")).get("c"));
        rango(sb.get(1), 12, 6, 18); rango(sb.get(0), 4, 2, null); rango(sb.get(2), 18, 12, 24);
        rango(sc.get(0), 3, 0, 7.5); rango(sc.get(1), 5, 2, null);
        // Tablas: la primera pivota x1 en la fila 0 (Bland); la última es la óptima, sin pivote.
        var tablas = l(s.resultado().get("tablas"));
        assertThat(tablas.size()).isGreaterThan(1);
        assertThat(m(m(tablas.get(0)).get("pivote"))).containsEntry("fila", 0).containsEntry("col", 0);
        assertThat(m(tablas.get(0)).get("entra")).isEqualTo("x1"); assertThat(m(tablas.get(0)).get("sale")).isEqualTo("s_1");
        assertThat(m(tablas.get(tablas.size() - 1)).get("pivote")).isNull();
        assertThat(l(m(tablas.get(0)).get("encabezados"))).containsExactly("x1", "x2", "s_1", "s_2", "s_3");
        assertThat(s.pasos()).hasSize(tablas.size());
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).contains("x1", "x2", "Valor objetivo Z");
        assertThat(s.resumen()).contains("36");
        soloTiposSimples(s.resultado()); s.pasos().forEach(p -> soloTiposSimples(p.tabla())); s.metricas().forEach(mt -> soloTiposSimples(mt.valor()));
    }

    @Test void minimizacionConExcedentesYArtificiales() {
        var s = resolver("min z=2x+3y", "x+y>=4", "x+3y>=6", "x,y>=0");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(z(s)).isCloseTo(9, within(1e-9)); assertThat(x(s, "x")).isCloseTo(3, within(1e-9)); assertThat(x(s, "y")).isCloseTo(1, within(1e-9));
        assertThat(dual(s, 0)).isCloseTo(1.5, within(1e-9)); assertThat(dual(s, 1)).isCloseTo(0.5, within(1e-9));
        assertThat(l(m(l(s.resultado().get("tablas")).get(0)).get("encabezados"))).contains("e_1", "a_1");
        assertThat(d(m(s.resultado().get("holguras")).get("e_1"))).isCloseTo(0, within(1e-9));
    }

    @Test void igualdadClasicaDeHillierConDosFases() {
        // min 0.4x1+0.5x2; 0.3x1+0.1x2<=2.7; 0.5x1+0.5x2=6; 0.6x1+0.4x2>=6 -> (7.5, 4.5), Z=5.25. Duales a mano: (-0.5, 1.1, 0).
        var s = resolver("min z=0.4x1+0.5x2", "0.3x1+0.1x2<=2.7", "0.5x1+0.5x2=6", "0.6x1+0.4x2>=6");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x1")).isCloseTo(7.5, within(1e-9)); assertThat(x(s, "x2")).isCloseTo(4.5, within(1e-9)); assertThat(z(s)).isCloseTo(5.25, within(1e-9));
        assertThat(dual(s, 0)).isCloseTo(-0.5, within(1e-9)); assertThat(dual(s, 1)).isCloseTo(1.1, within(1e-9)); assertThat(dual(s, 2)).isCloseTo(0, within(1e-9));
        assertThat(d(m(s.resultado().get("holguras")).get("e_3"))).isCloseTo(0.3, within(1e-9));
        assertThat(l(s.resultado().get("tablas")).stream().map(t -> (String) m(t).get("titulo"))).anyMatch(t -> t.contains("fase 1")).anyMatch(t -> t.contains("fase 2"));
    }

    @Test void igualdadSimpleYRestriccionConVariablesEnAmbosLados() {
        var s = resolver("max z=x+y", "x-y=0", "x+y<=10");
        assertThat(z(s)).isCloseTo(10, within(1e-9)); assertThat(x(s, "x")).isCloseTo(5, within(1e-9)); assertThat(x(s, "y")).isCloseTo(5, within(1e-9));
        assertThat(z(resolver("max z=x1+x2", "x1+2<=6-x2"))).isCloseTo(4, within(1e-9));
    }

    @Test void terminoIndependienteNegativoSeNormalizaYSuDualTieneElSignoCorrecto() {
        // min x s.a. -x <= -2  (x >= 2): dz/db = -1 porque z = -b.
        var s = resolver("min z=x", "-x<=-2");
        assertThat(z(s)).isCloseTo(2, within(1e-9)); assertThat(dual(s, 0)).isCloseTo(-1, within(1e-9));
        assertThat(x(resolver("max z=x", "-x<=-1", "x<=3"), "x")).isCloseTo(3, within(1e-9));
    }

    @Test void detectaInfactibilidad() {
        for (var s : List.of(resolver("max z=x", "x<=1", "x>=2"), resolver("max z=x", "0x=1"), resolver("min z=x+y", "x+y>=5", "x+y<=3"))) {
            assertThat(s.estado()).isEqualTo("infactible"); assertThat(s.resultado().get("z")).isNull();
            assertThat(s.metricas()).isEmpty(); assertThat(l(s.resultado().get("duales"))).isEmpty();
            assertThat(m(l(m(s.resultado().get("sensibilidad")).get("c")).get(0)).get("min")).isNull();
            soloTiposSimples(s.resultado());
        }
    }

    @Test void detectaObjetivoNoAcotado() {
        for (var s : List.of(resolver("max z=x+y", "x-y>=1"), resolver("min z=-x", "x-y<=3"), resolver("max z=x"))) {
            assertThat(s.estado()).isEqualTo("no_acotado"); assertThat(s.resultado().get("z")).isNull(); assertThat(s.metricas()).isEmpty();
            soloTiposSimples(s.resultado());
        }
    }

    @Test void unaRestriccionDeMayorOIgualNoDisfrazaUnModeloNoAcotadoDeInfactible() {
        // max x1 s.a. x2 >= 1 es factible y no acotado (x1 crece sin límite); el Big-M del frontend lo declara infactible.
        var s = resolver("max z=x1", "x2>=1");
        assertThat(s.estado()).isEqualTo("no_acotado");
    }

    @Test void sinRestriccionesMinimizarDaCeroYMaximizarNoAcota() {
        var s = resolver("min z=x"); assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isZero();
    }

    @Test void avisaDeOptimosMultiples() {
        for (var s : List.of(resolver("max z=x+y", "x+y<=4"), resolver("max z=2x1+4x2", "x1+2x2<=4", "x1<=3"))) {
            assertThat(s.resultado().get("multiple")).isEqualTo(true);
            assertThat(s.advertencias()).anyMatch(a -> a.contains("múltiples"));
        }
        assertThat(z(resolver("max z=2x1+4x2", "x1+2x2<=4", "x1<=3"))).isCloseTo(8, within(1e-9));
    }

    @Test void avisaDeSolucionDegenerada() {
        // Tres restricciones activas en (2,2): una variable básica vale 0 y el óptimo es único.
        var s = resolver("max z=x+y", "x<=2", "y<=2", "x+y<=4");
        assertThat(z(s)).isCloseTo(4, within(1e-9)); assertThat(s.resultado().get("degenerado")).isEqualTo(true); assertThat(s.resultado().get("multiple")).isEqualTo(false);
        assertThat(s.advertencias()).anyMatch(a -> a.contains("degenerada"));
        assertThat(2 * dual(s, 0) + 2 * dual(s, 1) + 4 * dual(s, 2)).isCloseTo(4, within(1e-9)); // dualidad fuerte
    }

    @Test void blandEvitaElCicloDeChvatal() {
        var s = resolver("max z=10x1-57x2-9x3-24x4", "0.5x1-5.5x2-2.5x3+9x4<=0", "0.5x1-1.5x2-0.5x3+x4<=0", "x1<=1");
        assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isCloseTo(1, within(1e-9));
        assertThat(l(s.resultado().get("tablas")).size()).isLessThan(30);
    }

    @Test void bealeClasicoDaZ125SinCiclar() {
        // Ejemplo de Beale (forma de maximización): optimo x1=1, x3=1 con Z=1.25 aunque Dantzig cicla.
        var s = resolver("max z=0.75x1-20x2+0.5x3-6x4", "0.25x1-8x2-x3+9x4<=0", "0.5x1-12x2-0.5x3+3x4<=0", "x3<=1");
        assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isCloseTo(1.25, within(1e-9));
        assertThat(x(s, "x1")).isCloseTo(1, within(1e-9)); assertThat(x(s, "x3")).isCloseTo(1, within(1e-9));
    }

    @Test void dietaConNombresX1X2() {
        var s = resolver("min 2x1+3x2", "x1+x2>=4", "x1+3x2>=6");
        assertThat(z(s)).isCloseTo(9, within(1e-9)); assertThat(x(s, "x1")).isCloseTo(3, within(1e-9)); assertThat(x(s, "x2")).isCloseTo(1, within(1e-9));
    }

    @Test void igualdadRedundanteSeRetiraSinPerderElOptimo() {
        var s = resolver("min z=x+y", "x+y=3", "2x+2y=6", "-x<=-1");
        assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isCloseTo(3, within(1e-9)); assertThat(s.resultado().get("multiple")).isEqualTo(true);
        assertThat(l(s.resultado().get("duales"))).hasSize(3);
        // Dualidad fuerte: b'y = z aun con una fila redundante.
        assertThat(3 * dual(s, 0) + 6 * dual(s, 1) - 1 * dual(s, 2)).isCloseTo(3, within(1e-9));
    }

    @Test void limitaLasTablasPeroConservaLaOptima() {
        StringBuilder obj = new StringBuilder("max z=x1"); List<String> rs = new ArrayList<>(List.of("x1<=1"));
        for (int i = 2; i <= 45; i++) { obj.append("+x").append(i); rs.add("x" + i + "<=1"); }
        var s = resolver(obj.toString(), rs.toArray(new String[0]));
        assertThat(z(s)).isCloseTo(45, within(1e-9));
        var tablas = l(s.resultado().get("tablas"));
        assertThat(tablas).hasSize(40); assertThat(m(tablas.get(39)).get("pivote")).isNull();
        assertThat(s.advertencias()).anyMatch(a -> a.contains("primeras"));
    }

    @Test void conVariablesEnterasDelegaEnBranchAndBound() {
        for (String metodo : List.of("simplex", "branch_bound")) {
            var s = SimplexSolver.resolver(metodo, datos("max z=5x1+8x2", "x1+x2<=6", "5x1+9x2<=45", "x1,x2 enteras"));
            assertThat(s.metodo()).isEqualTo("branch_bound"); assertThat(z(s)).isCloseTo(40, within(1e-9));
        }
    }

    @Test void rechazaEntradasInvalidas() {
        assertThatThrownBy(() -> SimplexSolver.resolver("simplex", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SimplexSolver.resolver("otro", datos("max z=x", "x<=1"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Método");
        assertThatThrownBy(() -> resolver("max z=x*y", "x<=1")).isInstanceOf(IllegalArgumentException.class);
    }

    // ---------- Propiedades contra un oráculo independiente (enumeración de vértices) ----------

    private record Caso(boolean max, double[] c, double[][] A, String[] ops, double[] b) {}

    private static String expr(double[] v) {
        StringBuilder s = new StringBuilder();
        for (int j = 0; j < v.length; j++) s.append(v[j] >= 0 ? "+" : "-").append(Math.abs(v[j])).append("x").append(j + 1);
        return s.toString();
    }
    private static ObjectNode datos(Caso k) {
        ObjectNode d = JSON.createObjectNode().put("objetivo", (k.max ? "max z=" : "min z=") + expr(k.c));
        var rs = d.putArray("restricciones");
        for (int i = 0; i < k.A.length; i++) rs.add(expr(k.A[i]) + k.ops[i] + k.b[i]);
        StringBuilder nn = new StringBuilder("x1"); for (int j = 2; j <= k.c.length; j++) nn.append(",x").append(j);
        rs.add(nn + ">=0");
        return d;
    }
    private static boolean cumple(double[] fila, String op, double rhs, double[] x, double tol) {
        double v = 0; for (int j = 0; j < x.length; j++) v += fila[j] * x[j];
        double t = tol * (1 + Math.abs(rhs));
        return switch (op) { case "<=" -> v <= rhs + t; case ">=" -> v >= rhs - t; default -> Math.abs(v - rhs) <= t; };
    }
    private static double[] gauss(double[][] M, double[] r) {
        int n = r.length; double[][] T = new double[n][n + 1];
        for (int i = 0; i < n; i++) { System.arraycopy(M[i], 0, T[i], 0, n); T[i][n] = r[i]; }
        for (int j = 0; j < n; j++) {
            int p = j; for (int i = j + 1; i < n; i++) if (Math.abs(T[i][j]) > Math.abs(T[p][j])) p = i;
            if (Math.abs(T[p][j]) < 1e-9) return null;
            double[] t = T[p]; T[p] = T[j]; T[j] = t;
            for (int i = 0; i < n; i++) if (i != j) { double f = T[i][j] / T[j][j]; for (int k = j; k <= n; k++) T[i][k] -= f * T[j][k]; }
        }
        double[] x = new double[n]; for (int i = 0; i < n; i++) x[i] = T[i][n] / T[i][i];
        return x;
    }
    /** Mejor objetivo del poliedro acotado {A x op b, x>=0} por enumeración de vértices; null si no hay puntos factibles. */
    private static Double oraculo(Caso k) {
        int n = k.c.length, m = k.A.length;
        List<double[]> planos = new ArrayList<>(); // a·x = rhs
        for (int i = 0; i < m; i++) { double[] p = Arrays.copyOf(k.A[i], n + 1); p[n] = k.b[i]; planos.add(p); }
        for (int j = 0; j < n; j++) { double[] p = new double[n + 1]; p[j] = 1; planos.add(p); }
        Double[] mejor = {null};
        combinar(planos, k, new int[n], 0, 0, mejor);
        return mejor[0];
    }
    private static void combinar(List<double[]> planos, Caso k, int[] elegidos, int pos, int desde, Double[] mejor) {
        int n = k.c.length;
        if (pos == n) {
            double[][] M = new double[n][]; double[] r = new double[n];
            for (int i = 0; i < n; i++) { M[i] = Arrays.copyOf(planos.get(elegidos[i]), n); r[i] = planos.get(elegidos[i])[n]; }
            double[] x = gauss(M, r);
            if (x == null) return;
            for (double v : x) if (v < -1e-7) return;
            for (int i = 0; i < k.A.length; i++) if (!cumple(k.A[i], k.ops[i], k.b[i], x, 1e-7)) return;
            double z = 0; for (int j = 0; j < n; j++) z += k.c[j] * x[j];
            if (mejor[0] == null || (k.max ? z > mejor[0] : z < mejor[0])) mejor[0] = z;
            return;
        }
        for (int p = desde; p < planos.size(); p++) { elegidos[pos] = p; combinar(planos, k, elegidos, pos + 1, p + 1, mejor); }
    }

    @Test void coincideConEnumeracionDeVerticesYCumpleDualidadYRangosDeSensibilidad() {
        Random az = new Random(20261008L); int optimos = 0, infactibles = 0;
        for (int caso = 0; caso < 300; caso++) {
            int n = 2 + az.nextInt(2), mr = 2 + az.nextInt(3), m = mr + n; // + caja x_j <= 12 para acotar
            double[] c = new double[n]; double[][] A = new double[m][n]; String[] o = new String[m]; double[] b = new double[m];
            for (int j = 0; j < n; j++) c[j] = az.nextInt(13) - 4;
            for (int i = 0; i < mr; i++) { for (int j = 0; j < n; j++) A[i][j] = az.nextInt(10) - 3; int r = az.nextInt(20); o[i] = r < 9 ? "<=" : r < 17 ? ">=" : "="; b[i] = az.nextInt(23) - 4; }
            for (int j = 0; j < n; j++) { A[mr + j][j] = 1; o[mr + j] = "<="; b[mr + j] = 12; }
            var k = new Caso(az.nextBoolean(), c, A, o, b);
            Double esperado = oraculo(k); var s = SimplexSolver.resolver("simplex", datos(k));
            soloTiposSimples(s.resultado());
            if (esperado == null) { assertThat(s.estado()).as("caso %d", caso).isEqualTo("infactible"); infactibles++; continue; }
            optimos++;
            assertThat(s.estado()).as("caso %d", caso).isEqualTo("optimo");
            assertThat(z(s)).as("z caso %d", caso).isCloseTo(esperado, within(1e-6 * (1 + Math.abs(esperado))));
            double[] xs = new double[n]; for (int j = 0; j < n; j++) xs[j] = x(s, "x" + (j + 1));
            double zx = 0; for (int j = 0; j < n; j++) { assertThat(xs[j]).isGreaterThanOrEqualTo(0); zx += c[j] * xs[j]; }
            assertThat(zx).isCloseTo(z(s), within(1e-6 * (1 + Math.abs(zx))));
            for (int i = 0; i < m; i++) assertThat(cumple(A[i], o[i], b[i], xs, 1e-6)).as("factibilidad caso %d fila %d", caso, i).isTrue();
            // Dualidad: factibilidad dual, signos, holgura complementaria y dualidad fuerte (y = dz/db).
            double[] y = new double[m]; double by = 0;
            for (int i = 0; i < m; i++) {
                y[i] = dual(s, i); by += y[i] * b[i];
                if (!o[i].equals("=")) assertThat(k.max == o[i].equals("<=") ? y[i] : -y[i]).as("signo dual caso %d fila %d", caso, i).isGreaterThanOrEqualTo(-1e-6);
                double res = b[i]; for (int j = 0; j < n; j++) res -= A[i][j] * xs[j];
                assertThat(y[i] * res).as("holgura complementaria caso %d", caso).isCloseTo(0, within(1e-6));
            }
            assertThat(by).as("dualidad fuerte caso %d", caso).isCloseTo(z(s), within(1e-6 * (1 + Math.abs(zx))));
            for (int j = 0; j < n; j++) { double ay = 0; for (int i = 0; i < m; i++) ay += A[i][j] * y[i]; assertThat(k.max ? ay - c[j] : c[j] - ay).as("factibilidad dual caso %d col %d", caso, j).isGreaterThanOrEqualTo(-1e-6); }
            // Rangos de sensibilidad: dentro de ellos la base se conserva, así que z cambia de forma lineal.
            var sens = m(s.resultado().get("sensibilidad"));
            for (int i = 0; i < m; i++) {
                var r = m(l(sens.get("b")).get(i));
                for (double[] ext : extremos(r, 3)) {
                    double[] b2 = b.clone(); b2[i] = ext[0];
                    var s2 = SimplexSolver.resolver("simplex", datos(new Caso(k.max, c, A, o, b2)));
                    assertThat(s2.estado()).as("rango b caso %d fila %d", caso, i).isEqualTo("optimo");
                    assertThat(z(s2)).as("z con b[%d]=%s caso %d", i, ext[0], caso).isCloseTo(z(s) + y[i] * (ext[0] - b[i]), within(1e-6 * (1 + Math.abs(zx))));
                }
            }
            for (int j = 0; j < n; j++) {
                var r = m(l(sens.get("c")).get(j));
                for (double[] ext : extremos(r, 3)) {
                    double[] c2 = c.clone(); c2[j] = ext[0];
                    var s2 = SimplexSolver.resolver("simplex", datos(new Caso(k.max, c2, A, o, b)));
                    assertThat(s2.estado()).as("rango c caso %d col %d", caso, j).isEqualTo("optimo");
                    assertThat(z(s2)).as("z con c[%d]=%s caso %d", j, ext[0], caso).isCloseTo(z(s) + (ext[0] - c[j]) * xs[j], within(1e-6 * (1 + Math.abs(zx))));
                }
            }
        }
        assertThat(optimos).isGreaterThan(60); assertThat(infactibles).isGreaterThan(20);
    }
    /** Valores interiores a los rangos: 90% hacia cada cota finita y ±3 donde no hay cota. */
    private static List<double[]> extremos(Map<String, Object> r, double paso) {
        double a = d(r.get("actual")); List<double[]> v = new ArrayList<>();
        Object lo = r.get("min"), hi = r.get("max");
        double t1 = lo == null ? a - paso : a + 0.9 * (d(lo) - a), t2 = hi == null ? a + paso : a + 0.9 * (d(hi) - a);
        if (Math.abs(t1 - a) > 1e-9) v.add(new double[]{t1});
        if (Math.abs(t2 - a) > 1e-9) v.add(new double[]{t2});
        return v;
    }
}
