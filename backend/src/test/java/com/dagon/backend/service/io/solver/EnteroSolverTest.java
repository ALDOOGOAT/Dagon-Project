package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class EnteroSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();

    private static ObjectNode datos(String objetivo, String... restricciones) {
        ObjectNode d = JSON.createObjectNode().put("objetivo", objetivo);
        var lista = d.putArray("restricciones"); for (String r : restricciones) lista.add(r);
        return d;
    }
    private static IoSolucion resolver(String objetivo, String... restricciones) { return EnteroSolver.resolver("branch_bound", datos(objetivo, restricciones)); }
    @SuppressWarnings("unchecked") private static Map<String, Object> m(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") private static List<Object> l(Object o) { return (List<Object>) o; }
    private static double d(Object o) { return ((Number) o).doubleValue(); }
    private static double x(IoSolucion s, String v) { return d(m(s.resultado().get("x")).get(v)); }
    private static double z(IoSolucion s) { return d(s.resultado().get("z")); }
    private static void soloTiposSimples(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double v) { assertThat(v.isNaN() || v.isInfinite()).as("Double no finito").isFalse(); return; }
        if (o instanceof Map<?, ?> mapa) { mapa.forEach((k, v) -> { assertThat(k).isInstanceOf(String.class); soloTiposSimples(v); }); return; }
        if (o instanceof List<?> lista) { lista.forEach(EnteroSolverTest::soloTiposSimples); return; }
        fail("Tipo no permitido en la solución: " + o.getClass());
    }

    @Test void enteraPuraNoRedondeaLaRelajacion() {
        // La relajación es (2.25, 3.75), Z=41.25. Redondear da (2,4), infactible (46>45); (3,3) da 39. El óptimo entero es (0,5), Z=40.
        var s = resolver("max z = 5x1 + 8x2", "x1 + x2 <= 6", "5x1 + 9x2 <= 45", "x1, x2 >= 0", "x1, x2 enteras");
        assertThat(s.tipo()).isEqualTo("pl"); assertThat(s.metodo()).isEqualTo("branch_bound"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x1")).isEqualTo(0); assertThat(x(s, "x2")).isEqualTo(5); assertThat(z(s)).isEqualTo(40);
        var rel = m(s.resultado().get("relajacion"));
        assertThat(d(rel.get("z"))).isCloseTo(41.25, within(1e-9));
        assertThat(d(m(rel.get("x")).get("x1"))).isCloseTo(2.25, within(1e-9)); assertThat(d(m(rel.get("x")).get("x2"))).isCloseTo(3.75, within(1e-9));
        assertThat(d(s.resultado().get("brecha"))).isCloseTo(1.25, within(1e-9));
        var nodos = l(s.resultado().get("nodos"));
        assertThat(m(nodos.get(0)).get("rama").toString()).contains("Relajación"); assertThat(m(nodos.get(0)).get("padre")).isNull();
        assertThat(nodos.stream().filter(n -> Boolean.TRUE.equals(m(n).get("optimo")))).hasSize(1);
        assertThat(s.resultado().get("explorados")).isEqualTo(nodos.size());
        assertThat(nodos.stream().map(n -> (String) m(n).get("decision"))).anyMatch(t -> t.startsWith("Ramificar")).anyMatch(t -> t.startsWith("Podado"));
        assertThat(s.pasos()).hasSize(2);
        assertThat(l(s.pasos().get(1).tabla())).hasSize(nodos.size());
        assertThat(m(l(s.pasos().get(1).tabla()).get(0))).containsEntry("nodo", "P0");
        assertThat(s.advertencias()).anyMatch(a -> a.contains("no se redondeó"));
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).contains("x1", "x2", "Valor objetivo Z (entero)", "Cota de la relajación lineal");
        soloTiposSimples(s.resultado()); s.pasos().forEach(p -> soloTiposSimples(p.tabla())); s.metricas().forEach(mt -> soloTiposSimples(mt.valor()));
    }

    @Test void mochilaBinariaEnTextoYEnLista() {
        // valores (8,11,6,4), pesos (5,7,4,3), capacidad 14: se eligen y2,y3,y4 con peso 14 y valor 21.
        var texto = resolver("max z = 8y1 + 11y2 + 6y3 + 4y4", "5y1 + 7y2 + 4y3 + 3y4 <= 14", "y1, y2, y3, y4 binarias");
        ObjectNode d = datos("max z = 8y1 + 11y2 + 6y3 + 4y4", "5y1 + 7y2 + 4y3 + 3y4 <= 14"); var b = d.putArray("binarias"); for (String v : List.of("y1", "y2", "y3", "y4")) b.add(v);
        for (var s : List.of(texto, EnteroSolver.resolver("branch_bound", d))) {
            assertThat(z(s)).isEqualTo(21);
            assertThat(List.of(x(s, "y1"), x(s, "y2"), x(s, "y3"), x(s, "y4"))).containsExactly(0.0, 1.0, 1.0, 1.0);
        }
    }

    @Test void mochilaConDeclaracionDeConjuntoYValoresDelOraculo() {
        // 14x1+10x2+15x3 con 9x1+6x2+2x3<=14: x1+x3 pesa 11 y rinde 29 (x1+x2 pesaría 15).
        var s = resolver("max z=14y1+10y2+15y3", "9y1+6y2+2y3<=14", "y1,y2,y3 ∈ {0,1}");
        assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isEqualTo(29);
        assertThat(x(s, "y1")).isEqualTo(1); assertThat(x(s, "y2")).isEqualTo(0); assertThat(x(s, "y3")).isEqualTo(1);
    }

    @Test void mezclaEnterasBinariasYContinuas() {
        // b binaria cuesta 4 de capacidad y rinde 12; x entera; y continua. Óptimo: b=1, x=2, y=0.5, Z=19 (b=0 daría 17).
        var s = resolver("max z=3x+2y+12b", "x+y+4b<=6.5", "y<=2.5", "x<=4", "x entera", "b binaria");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(z(s)).isCloseTo(19, within(1e-9)); assertThat(x(s, "b")).isEqualTo(1); assertThat(x(s, "x")).isEqualTo(2); assertThat(x(s, "y")).isCloseTo(0.5, within(1e-9));
        assertThat(l(s.resultado().get("enteras"))).containsExactlyInAnyOrder("x", "b"); assertThat(l(s.resultado().get("binarias"))).containsExactly("b");
    }

    @Test void mixtaConUnaEnteraYUnaContinua() {
        ObjectNode d = datos("max z = x1 + x2", "2x1 + 2x2 <= 5", "x1 - x2 <= 0.5", "x1, x2 >= 0"); d.putArray("enteras").add("x1");
        var s = EnteroSolver.resolver("branch_bound", d);
        assertThat(z(s)).isCloseTo(2.5, within(1e-9)); assertThat(x(s, "x1")).isEqualTo(Math.rint(x(s, "x1")));
    }

    @Test void minimizacionEnteraYModeloSinPuntosEnteros() {
        var s = resolver("min z = 3x1 + 2x2", "x1 + x2 >= 3.5", "x1 + 3x2 >= 4.2", "x1, x2 enteros");
        assertThat(s.estado()).isEqualTo("optimo"); assertThat(z(s)).isEqualTo(8);
        var i = resolver("max z = x1", "x1 >= 0.2", "x1 <= 0.8", "x1 entera");
        assertThat(i.estado()).isEqualTo("infactible"); assertThat(i.resultado().get("z")).isNull(); assertThat(i.metricas()).isEmpty();
        // Infactible solo por integralidad: la relajación sí tiene solución.
        var p = resolver("max z = y1 + y2", "2y1 + 2y2 = 3", "y1, y2 binarias");
        assertThat(p.estado()).isEqualTo("infactible"); soloTiposSimples(p.resultado());
    }

    @Test void relajacionNoAcotadaSeInformaSinInventarUnOptimo() {
        var s = resolver("max z = x1 + x2", "x1 - x2 <= 3", "x1 entera");
        assertThat(s.estado()).isEqualTo("no_acotado"); assertThat(s.resultado().get("z")).isNull(); assertThat(s.advertencias()).anyMatch(a -> a.contains("no está acotada"));
    }

    @Test void exigeAlMenosUnaVariableEntera() {
        assertThatThrownBy(() -> resolver("max z = x1", "x1 <= 3")).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("al menos una variable entera");
        assertThatThrownBy(() -> EnteroSolver.resolver("simplex", datos("max z = x1", "x1 <= 3", "x1 entera"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Método");
    }

    @Test void alAlcanzarElLimiteDeNodosDevuelveLaMejorIncumbenteComoAproximada() {
        // Z=21 en la relajación pero solo se alcanza 20 con enteros; probarlo exige un árbol enorme, así que se corta en 3000 nodos.
        StringBuilder obj = new StringBuilder("max z=2y1"), suma = new StringBuilder("2y1"), bin = new StringBuilder("y1");
        for (int i = 2; i <= 20; i++) { obj.append("+2y").append(i); suma.append("+2y").append(i); bin.append(",y").append(i); }
        var s = resolver(obj.toString(), suma + "<=21", bin + " binarias");
        assertThat(s.estado()).isEqualTo("aproximado"); assertThat(s.resultado().get("estado")).isEqualTo("limite");
        assertThat(z(s)).isEqualTo(20); assertThat(s.resultado().get("explorados")).isEqualTo(3000);
        assertThat(s.advertencias()).anyMatch(a -> a.contains("3000") && a.contains("sin garantía"));
    }

    @Test void siSeAgotaElLimiteSinSolucionEnteraNoInventaNada() {
        // 2*(y1+...+y14) = 11 no tiene solución entera, pero la relajación sí: el árbol crece sin hallar incumbente.
        StringBuilder suma = new StringBuilder("2y1"), bin = new StringBuilder("y1");
        for (int i = 2; i <= 14; i++) { suma.append("+2y").append(i); bin.append(",y").append(i); }
        assertThatThrownBy(() -> resolver("max z=y1", suma + "=11", bin + " binarias")).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("límite");
    }

    @Test void coincideConFuerzaBrutaEnModelosEnterosAleatorios() {
        Random az = new Random(7L); int infactibles = 0;
        for (int caso = 0; caso < 120; caso++) {
            int n = 2 + az.nextInt(2), m = 3; double[] c = new double[n]; double[][] A = new double[m][n]; double[] b = new double[m];
            for (int j = 0; j < n; j++) c[j] = 1 + az.nextInt(9);
            for (int i = 0; i < m; i++) { for (int j = 0; j < n; j++) A[i][j] = 1 + az.nextInt(8); b[i] = 10 + az.nextInt(15) + 0.5; }
            boolean max = az.nextInt(4) != 0; // algunos casos de minimización con una restricción >= que obliga a producir
            StringBuilder obj = new StringBuilder(max ? "max z=" : "min z="), vars = new StringBuilder();
            for (int j = 0; j < n; j++) { obj.append("+").append(c[j]).append("x").append(j + 1); vars.append(j > 0 ? "," : "").append("x").append(j + 1); }
            List<String> rs = new ArrayList<>();
            for (int i = 0; i < m; i++) { StringBuilder r = new StringBuilder(); for (int j = 0; j < n; j++) r.append("+").append(A[i][j]).append("x").append(j + 1); rs.add(r + "<=" + b[i]); }
            double minimo = 0; if (!max) { StringBuilder r = new StringBuilder(); for (int j = 0; j < n; j++) r.append("+x").append(j + 1); minimo = 1 + az.nextInt(4) + 0.5; rs.add(r + ">=" + minimo); }
            rs.add(vars + " enteras");
            var s = resolver(obj.toString(), rs.toArray(new String[0]));
            Double mejor = null;
            int[] x = new int[n];
            for (int k = 0; k < Math.pow(31, n); k++) {
                int t = k; for (int j = 0; j < n; j++) { x[j] = t % 31; t /= 31; }
                boolean ok = true; for (int i = 0; i < m && ok; i++) { double v = 0; for (int j = 0; j < n; j++) v += A[i][j] * x[j]; ok = v <= b[i] + 1e-9; }
                int suma = Arrays.stream(x).sum(); if (!max && suma < minimo) ok = false;
                if (!ok) continue;
                double z = 0; for (int j = 0; j < n; j++) z += c[j] * x[j];
                if (mejor == null || (max ? z > mejor : z < mejor)) mejor = z;
            }
            if (mejor == null) { assertThat(s.estado()).as("caso %d: %s %s", caso, obj, rs).isEqualTo("infactible"); infactibles++; continue; }
            assertThat(s.estado()).as("caso %d: %s %s", caso, obj, rs).isEqualTo("optimo");
            assertThat(z(s)).as("caso %d", caso).isCloseTo(mejor, within(1e-6));
            for (int j = 0; j < n; j++) assertThat(x(s, "x" + (j + 1))).isEqualTo(Math.rint(x(s, "x" + (j + 1))));
        }
        assertThat(infactibles).as("el generador debe producir también casos sin solución entera").isGreaterThan(0);
    }
}
