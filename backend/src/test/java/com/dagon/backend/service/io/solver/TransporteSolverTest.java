package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.assertj.core.api.Assertions.*;

class TransporteSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    // Ejemplo de libro (Taha/Hillier), balanceado: costo óptimo 435.
    static final String TAHA = "{'costos':[[10,2,20,11],[12,7,9,20],[4,14,16,18]],'oferta':[15,25,10],'demanda':[5,15,15,15]}";
    // Powerco (Winston): costo óptimo 1020.
    static final String POWERCO = "{'costos':[[8,6,10,9],[9,12,13,7],[14,9,16,5]],'oferta':[35,50,40],'demanda':[45,20,30,30]}";

    static JsonNode json(String s) {
        try { return JSON.readTree(s.replace('\'', '"')); } catch (Exception e) { throw new IllegalStateException(e); }
    }
    @SuppressWarnings("unchecked") static Map<String, Object> mapa(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") static List<Object> lista(Object o) { return (List<Object>) o; }
    static double num(Object o) { return ((Number) o).doubleValue(); }
    static double costoOptimo(IoSolucion s) { return num(mapa(s.resultado().get("optimo")).get("costo")); }
    static double costoInicial(IoSolucion s) { return num(mapa(s.resultado().get("inicial")).get("costo")); }

    /** Factibilidad y certificado de optimalidad (holgura complementaria) leídos del resultado, sin reejecutar el algoritmo. */
    static void verificar(IoSolucion s) {
        var bal = mapa(s.resultado().get("balanceado"));
        var C = lista(bal.get("costos")); var O = lista(bal.get("oferta")); var D = lista(bal.get("demanda"));
        var X = lista(mapa(s.resultado().get("optimo")).get("asignacion"));
        for (int i = 0; i < O.size(); i++) assertThat(lista(X.get(i)).stream().mapToDouble(TransporteSolverTest::num).sum()).isCloseTo(num(O.get(i)), within(1e-7));
        for (int j = 0; j < D.size(); j++) { int jj = j; assertThat(X.stream().mapToDouble(r -> num(lista(r).get(jj))).sum()).isCloseTo(num(D.get(j)), within(1e-7)); }
        var ultima = mapa(lista(s.resultado().get("iteraciones")).get(lista(s.resultado().get("iteraciones")).size() - 1));
        assertThat(ultima.get("entra")).isNull();
        var u = lista(ultima.get("u")); var v = lista(ultima.get("v"));
        for (int i = 0; i < O.size(); i++) for (int j = 0; j < D.size(); j++) {
            double x = num(lista(X.get(i)).get(j)), c = num(lista(C.get(i)).get(j)), holgura = c - num(u.get(i)) - num(v.get(j));
            assertThat(x).isGreaterThanOrEqualTo(0);
            assertThat(holgura).isGreaterThanOrEqualTo(-1e-7);
            if (x > 1e-9) assertThat(holgura).isCloseTo(0, within(1e-7));
        }
    }

    @ParameterizedTest @ValueSource(strings = {"vogel", "noroeste", "costo_minimo"})
    void ejemploDeLibroTerminaEn435ConCualquierMetodoInicial(String metodo) {
        var s = TransporteSolver.resolver(metodo, json(TAHA));
        assertThat(s.tipo()).isEqualTo("transporte"); assertThat(s.metodo()).isEqualTo(metodo); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(costoOptimo(s)).isCloseTo(435, within(1e-9));
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).containsExactly("Costo inicial", "Costo óptimo");
        assertThat(s.metricas().get(1).valor()).isEqualTo(435.0);
        assertThat(mapa(s.resultado().get("balanceado")).get("ficticio")).isNull();
        assertThat(s.advertencias()).isEmpty();
        verificar(s);
    }

    @Test void solucionesInicialesDeCadaMetodoCoincidenConElCalculoManual() {
        // Noroeste: 5*10+10*2+5*7+15*9+5*20+10*18 = 520. Costo mínimo y Vogel: 15*2+5*4+15*9+5*18+10*20 = 475.
        assertThat(costoInicial(TransporteSolver.resolver("noroeste", json(TAHA)))).isEqualTo(520.0);
        assertThat(costoInicial(TransporteSolver.resolver("costo_minimo", json(TAHA)))).isEqualTo(475.0);
        assertThat(costoInicial(TransporteSolver.resolver("vogel", json(TAHA)))).isEqualTo(475.0);
    }

    @ParameterizedTest @ValueSource(strings = {"vogel", "noroeste", "costo_minimo"})
    void powercoTerminaEn1020(String metodo) {
        var s = TransporteSolver.resolver(metodo, json(POWERCO));
        assertThat(costoOptimo(s)).isCloseTo(1020, within(1e-9));
        verificar(s);
    }

    @Test void pasosIncluyenLaTablaInicialYCadaIteracionModi() {
        var s = TransporteSolver.resolver("noroeste", json(TAHA));
        int iteraciones = lista(s.resultado().get("iteraciones")).size();
        assertThat(iteraciones).isGreaterThan(1);
        assertThat(s.pasos().stream().filter(p -> p.texto().startsWith("MODI: iteración")).count()).isEqualTo(iteraciones);
        assertThat(s.pasos().stream().anyMatch(p -> p.texto().startsWith("Solución inicial") && p.tabla() != null)).isTrue();
        var primera = mapa(lista(s.resultado().get("iteraciones")).get(0));
        assertThat(primera.get("entra")).isNotNull(); assertThat(lista(primera.get("ciclo")).size()).isGreaterThanOrEqualTo(4);
        assertThat(mapa(primera.get("entra"))).containsKeys("i", "j");
        // costosReducidos usa null en las celdas básicas.
        assertThat(lista(primera.get("costosReducidos")).stream().flatMap(r -> lista(r).stream()).anyMatch(x -> x == null)).isTrue();
    }

    @Test void ofertaMayorQueDemandaAgregaColumnaFicticiaYAvisa() {
        var s = TransporteSolver.resolver("noroeste", json("{'costos':[[1,8],[8,1]],'oferta':[4,4],'demanda':[2,2]}"));
        var bal = mapa(s.resultado().get("balanceado"));
        assertThat(bal.get("ficticio")).isEqualTo("columna");
        assertThat(lista(bal.get("demanda"))).containsExactly(2.0, 2.0, 4.0);
        assertThat(lista(bal.get("costos")).stream().map(r -> lista(r).get(2))).containsExactly(0.0, 0.0);
        assertThat(costoOptimo(s)).isEqualTo(4.0);
        assertThat(s.advertencias()).isNotEmpty();
        verificar(s);
    }

    @Test void demandaMayorQueOfertaAgregaFilaFicticia() {
        var s = TransporteSolver.resolver("vogel", json("{'costos':[[1,5]],'oferta':[3],'demanda':[2,3]}"));
        var bal = mapa(s.resultado().get("balanceado"));
        assertThat(bal.get("ficticio")).isEqualTo("fila");
        assertThat(lista(bal.get("oferta"))).containsExactly(3.0, 2.0);
        assertThat(costoOptimo(s)).isEqualTo(7.0);   // 2 unidades a 1 y 1 unidad a 5; la ficticia absorbe 2 de la segunda columna
        assertThat(s.advertencias()).isNotEmpty();
        verificar(s);
    }

    @Test void degeneracionUsaEpsilonSimbolicoSinAlterarOfertaNiDemanda() {
        var s = TransporteSolver.resolver("noroeste", json("{'costos':[[2,1],[1,2]],'oferta':[5,5],'demanda':[5,5]}"));
        assertThat(costoInicial(s)).isEqualTo(20.0);
        assertThat(costoOptimo(s)).isEqualTo(10.0);
        var bal = mapa(s.resultado().get("balanceado"));
        assertThat(lista(bal.get("oferta"))).containsExactly(5.0, 5.0); assertThat(lista(bal.get("demanda"))).containsExactly(5.0, 5.0);
        var inicial = mapa(s.resultado().get("inicial"));
        assertThat(lista(inicial.get("pasos")).stream().anyMatch(p -> mapa(p).get("texto").toString().contains("epsilon"))).isTrue();
        verificar(s);
    }

    @Test void ofertaYDemandaCeroDanCostoCero() {
        var s = TransporteSolver.resolver("vogel", json("{'costos':[[1,2],[3,4]],'oferta':[0,0],'demanda':[0,0]}"));
        assertThat(costoOptimo(s)).isEqualTo(0.0);
        verificar(s);
    }

    @Test void costosNegativosSeAceptanComoEnElSolverDelFrontend() {
        var s = TransporteSolver.resolver("noroeste", json("{'costos':[[-1,4],[3,-2]],'oferta':[3,3],'demanda':[3,3]}"));
        assertThat(costoOptimo(s)).isEqualTo(-9.0);
        verificar(s);
    }

    @Test void frenteAUnaFuerzaBrutaIndependienteLosTresMetodosCoincidenConElOptimo() {
        var azar = new Random(7);
        for (int caso = 0; caso < 40; caso++) {
            int m = 2 + azar.nextInt(2), n = 2 + azar.nextInt(2);
            int[][] c = new int[m][n]; int[] o = new int[m], d = new int[n];
            for (int[] fila : c) for (int j = 0; j < n; j++) fila[j] = 1 + azar.nextInt(9);
            for (int i = 0; i < m; i++) o[i] = azar.nextInt(5);   // incluye ceros: casos degenerados
            for (int j = 0; j < n; j++) d[j] = azar.nextInt(5);
            String datos = "{'costos':" + java.util.Arrays.deepToString(c) + ",'oferta':" + java.util.Arrays.toString(o) + ",'demanda':" + java.util.Arrays.toString(d) + "}";
            int esperado = fuerzaBruta(c, o, d.clone());
            for (String metodo : List.of("vogel", "noroeste", "costo_minimo")) {
                var s = TransporteSolver.resolver(metodo, json(datos));
                assertThat(costoOptimo(s)).as("%s %s", metodo, datos).isCloseTo(esperado, within(1e-9));
                verificar(s);
            }
        }
    }

    @Test void estresAleatorioConEmpatesCerosYDesbalanceNoCiclaYCertificaElOptimo() {
        var azar = new Random(99);
        for (int caso = 0; caso < 150; caso++) {
            int m = 2 + azar.nextInt(8), n = 2 + azar.nextInt(8);
            int[][] c = new int[m][n]; int[] o = new int[m], d = new int[n];
            for (int[] fila : c) for (int j = 0; j < n; j++) fila[j] = azar.nextInt(4);   // pocos valores distintos: muchos empates
            for (int i = 0; i < m; i++) o[i] = azar.nextInt(10);
            for (int j = 0; j < n; j++) d[j] = azar.nextInt(10);
            String datos = "{'costos':" + java.util.Arrays.deepToString(c) + ",'oferta':" + java.util.Arrays.toString(o) + ",'demanda':" + java.util.Arrays.toString(d) + "}";
            double referencia = Double.NaN;
            for (String metodo : List.of("vogel", "noroeste", "costo_minimo")) {
                var s = TransporteSolver.resolver(metodo, json(datos));
                verificar(s);
                if (Double.isNaN(referencia)) referencia = costoOptimo(s); else assertThat(costoOptimo(s)).as(datos).isCloseTo(referencia, within(1e-9));
            }
        }
    }

    private static int fuerzaBruta(int[][] c, int[] o, int[] d) {
        return busca(c, o.clone(), d, 0, 0, Math.min(java.util.Arrays.stream(o).sum(), java.util.Arrays.stream(d).sum()), 0);
    }
    private static int busca(int[][] c, int[] o, int[] d, int i, int j, int resta, int costo) {
        if (i == o.length) return resta == 0 ? costo : Integer.MAX_VALUE;
        int ni = j + 1 == d.length ? i + 1 : i, nj = j + 1 == d.length ? 0 : j + 1, mejor = Integer.MAX_VALUE;
        for (int q = 0; q <= Math.min(o[i], d[j]) && q <= resta; q++) {
            o[i] -= q; d[j] -= q;
            mejor = Math.min(mejor, busca(c, o, d, ni, nj, resta - q, costo + q * c[i][j]));
            o[i] += q; d[j] += q;
        }
        return mejor;
    }

    @Test void problemaGrandeDe12x12SeResuelveYSeCertificaElOptimo() {
        var azar = new Random(3);
        int n = 12; StringBuilder costos = new StringBuilder("["); int[] o = new int[n], d = new int[n];
        for (int i = 0; i < n; i++) { costos.append(i > 0 ? "," : "").append("["); for (int j = 0; j < n; j++) costos.append(j > 0 ? "," : "").append(1 + azar.nextInt(99)); costos.append("]"); }
        costos.append("]");
        int total = 0; for (int i = 0; i < n; i++) { o[i] = 5 + azar.nextInt(40); total += o[i]; }
        for (int j = 0; j < n - 1; j++) { d[j] = total / n; } d[n - 1] = total - (n - 1) * (total / n);
        String datos = "{'costos':" + costos + ",'oferta':" + java.util.Arrays.toString(o) + ",'demanda':" + java.util.Arrays.toString(d) + "}";
        for (String metodo : List.of("vogel", "noroeste", "costo_minimo")) verificar(TransporteSolver.resolver(metodo, json(datos)));
    }

    @Test void entradasInvalidasLanzanIllegalArgumentExceptionEnEspanol() {
        assertThatThrownBy(() -> TransporteSolver.resolver("otro", json(TAHA))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Método");
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("[]"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[[1,2],[3,4]],'oferta':[-1,2],'demanda':[1,1]}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[[1,2],[3,4]],'oferta':[1,2],'demanda':[1]}"))).hasMessageContaining("no coinciden");
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[[1,2],[3]],'oferta':[1,2],'demanda':[1,1]}"))).hasMessageContaining("rectangular");
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[[1,'x'],[3,4]],'oferta':[1,2],'demanda':[1,1]}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[],'oferta':[],'demanda':[]}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json("{'costos':[[1,2],[3,4]],'oferta':[1e13,2],'demanda':[1,1]}"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void rechazaMasDe12OrigenesOLasMatricesEnormes() {
        StringBuilder c = new StringBuilder("["), o = new StringBuilder("[");
        for (int i = 0; i < 13; i++) { c.append(i > 0 ? "," : "").append("[1,1]"); o.append(i > 0 ? "," : "").append(1); }
        String datos = "{'costos':" + c + "],'oferta':" + o + "],'demanda':[6,7]}";
        assertThatThrownBy(() -> TransporteSolver.resolver("vogel", json(datos))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("12");
    }

    @Test void elResultadoSoloContieneTiposSimplesSerializables() {
        var s = TransporteSolver.resolver("vogel", json(TAHA));
        assertSimple(s.resultado()); s.pasos().forEach(p -> assertSimple(p.tabla()));
    }
    static void assertSimple(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double x) { assertThat(x.isNaN() || x.isInfinite()).isFalse(); assertThat(x == 0 && 1 / x < 0).as("-0.0").isFalse(); return; }
        if (o instanceof Map<?, ?> m) { m.values().forEach(TransporteSolverTest::assertSimple); return; }
        if (o instanceof List<?> l) { l.forEach(TransporteSolverTest::assertSimple); return; }
        fail("tipo no permitido: " + o.getClass());
    }
}
