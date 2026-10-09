package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class DecisionesSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final double TOL = 1e-9;
    // Ganancias; cada criterio elige una alternativa distinta (verificado a mano):
    //   maximax -> A2 (100) | maximin -> A3 (50) | Laplace -> A1 (60) | Hurwicz(0,6) -> A4 (62) | Savage -> A5 (arrepentimiento max 40)
    private static final String GANANCIAS = "[[90,10,80],[100,0,30],[50,50,50],[20,90,20],[60,60,40]]";
    private static JsonNode j(String s) { try { return JSON.readTree(s); } catch (Exception e) { throw new IllegalStateException(e); } }
    private static IoSolucion inc(String datos) { return DecisionesSolver.resolver("incertidumbre", j(datos)); }
    private static IoSolucion rie(String datos) { return DecisionesSolver.resolver("riesgo", j(datos)); }
    @SuppressWarnings("unchecked") private static Map<String, Object> criterio(IoSolucion s, String clave) {
        return ((List<Map<String, Object>>) s.resultado().get("criterios")).stream().filter(c -> c.get("clave").equals(clave)).findFirst().orElseThrow();
    }
    @SuppressWarnings("unchecked") private static List<Double> valores(Map<String, Object> c) { return (List<Double>) c.get("valores"); }
    @SuppressWarnings("unchecked") private static List<Double> lista(IoSolucion s, String k) { return (List<Double>) s.resultado().get(k); }
    private static void igual(List<Double> real, double... esperado) {
        assertThat(real).hasSize(esperado.length);
        for (int i = 0; i < esperado.length; i++) assertThat(real.get(i)).isCloseTo(esperado[i], within(TOL));
    }
    private static double v(IoSolucion s, String k) { return ((Number) s.resultado().get(k)).doubleValue(); }
    private static void simple(Object o) {
        if (o instanceof Map<?, ?> m) m.values().forEach(DecisionesSolverTest::simple);
        else if (o instanceof List<?> l) l.forEach(DecisionesSolverTest::simple);
        else if (o instanceof Double d) assertThat(d).isFinite();
        else assertThat(o == null || o instanceof Integer || o instanceof String || o instanceof Boolean).isTrue();
    }

    @Test void cadaCriterioEligeUnaAlternativaDistinta() {
        var s = inc("{\"pagos\":" + GANANCIAS + ",\"objetivo\":\"max\",\"alfa\":0.6}");
        assertThat(s.tipo()).isEqualTo("decisiones"); assertThat(s.metodo()).isEqualTo("incertidumbre"); assertThat(s.estado()).isEqualTo("calculado");
        assertThat(criterio(s, "optimista").get("decision")).isEqualTo("A2");
        assertThat(criterio(s, "pesimista").get("decision")).isEqualTo("A3");
        assertThat(criterio(s, "laplace").get("decision")).isEqualTo("A1");
        assertThat(criterio(s, "hurwicz").get("decision")).isEqualTo("A4");
        assertThat(criterio(s, "savage").get("decision")).isEqualTo("A5");
        assertThat(criterio(s, "savage").get("indice")).isEqualTo(4);
        assertThat(valores(criterio(s, "optimista"))).containsExactly(90.0, 100.0, 50.0, 90.0, 60.0);
        assertThat(valores(criterio(s, "pesimista"))).containsExactly(10.0, 0.0, 50.0, 20.0, 40.0);
        assertThat(valores(criterio(s, "laplace")).get(0)).isCloseTo(60, within(TOL)); assertThat(valores(criterio(s, "laplace")).get(1)).isCloseTo(130.0 / 3, within(TOL));
        igual(valores(criterio(s, "hurwicz")), 58.0, 60.0, 50.0, 62.0, 52.0);
        assertThat(valores(criterio(s, "savage"))).containsExactly(80.0, 90.0, 50.0, 80.0, 40.0);
        assertThat(criterio(s, "hurwicz").get("nombre").toString()).contains("0.6");
        assertThat(s.metricas()).hasSize(5);
        assertThat(s.metricas().get(0).valor()).isEqualTo(100.0); // valor del criterio ganador
        simple(s.resultado()); s.pasos().forEach(p -> simple(p.tabla()));
    }
    @Test void matrizDeArrepentimientoYNombresPorDefecto() {
        var s = inc("{\"pagos\":" + GANANCIAS + ",\"objetivo\":\"max\"}");
        assertThat(s.resultado().get("alternativas")).asList().containsExactly("A1", "A2", "A3", "A4", "A5");
        assertThat(s.resultado().get("estados")).asList().containsExactly("E1", "E2", "E3");
        assertThat(s.resultado().get("arrepentimiento")).asList().first().asList().containsExactly(10.0, 80.0, 0.0);
        assertThat(((List<?>) s.resultado().get("criterios")).size()).isEqualTo(4); // sin alfa no hay Hurwicz
        assertThatThrownBy(() -> criterio(s, "hurwicz")).isInstanceOf(java.util.NoSuchElementException.class);
    }
    @Test void alfaExtremosCoincidenConOptimistaYPesimista() {
        var uno = inc("{\"pagos\":" + GANANCIAS + ",\"objetivo\":\"max\",\"alfa\":1}"); var cero = inc("{\"pagos\":" + GANANCIAS + ",\"objetivo\":\"max\",\"alfa\":0}");
        assertThat(valores(criterio(uno, "hurwicz"))).isEqualTo(valores(criterio(uno, "optimista")));
        assertThat(valores(criterio(cero, "hurwicz"))).isEqualTo(valores(criterio(cero, "pesimista")));
    }
    @Test void costosInvierteElSentidoDeLosCriterios() {
        // Costos: A1=[4,8] A2=[6,5] A3=[7,3]. minimin->A3(3) | minimax->A2(6) | Laplace->A3(5) | Hurwicz(0,5)->A3(5) | Savage->A2(2)
        var s = inc("{\"pagos\":[[4,8],[6,5],[7,3]],\"objetivo\":\"min\",\"alfa\":0.5,\"alternativas\":[\"X\",\"Y\",\"Z\"],\"estados\":[\"bajo\",\"alto\"]}");
        assertThat(criterio(s, "optimista").get("decision")).isEqualTo("Z"); assertThat(criterio(s, "optimista").get("nombre").toString()).contains("minimin");
        assertThat(criterio(s, "pesimista").get("decision")).isEqualTo("Y"); assertThat(criterio(s, "pesimista").get("nombre").toString()).contains("minimax");
        assertThat(criterio(s, "laplace").get("decision")).isEqualTo("Z");
        igual(valores(criterio(s, "hurwicz")), 6.0, 5.5, 5.0);
        assertThat(criterio(s, "savage").get("decision")).isEqualTo("Y"); assertThat(valores(criterio(s, "savage"))).containsExactly(5.0, 2.0, 3.0);
        assertThat(s.resultado().get("estados")).asList().containsExactly("bajo", "alto");
    }
    @Test void empateSeResuelveConLaPrimeraAlternativa() {
        var s = inc("{\"pagos\":[[5,5],[5,5]],\"objetivo\":\"max\"}");
        assertThat(criterio(s, "laplace").get("decision")).isEqualTo("A1");
    }
    @Test void riesgoValorEsperadoVeipYPerdidaDeOportunidad() {
        // p=(0.5,0.3,0.2): VE = 64, 56, 50, 41, 56 -> A1. Con informacion perfecta: 100*0.5+90*0.3+80*0.2 = 93 -> VEIP = 29.
        // Perdida de oportunidad esperada = 29, 37, 43, 52, 37: su minimo es el VEIP.
        var s = rie("{\"pagos\":" + GANANCIAS + ",\"objetivo\":\"max\",\"probabilidades\":[0.5,0.3,0.2]}");
        assertThat(s.metodo()).isEqualTo("riesgo");
        igual(lista(s, "valoresEsperados"), 64.0, 56.0, 50.0, 41.0, 56.0);
        assertThat(s.resultado().get("decision")).isEqualTo("A1"); assertThat(v(s, "valorEsperado")).isCloseTo(64, within(TOL));
        assertThat(v(s, "valorConInformacionPerfecta")).isCloseTo(93, within(TOL)); assertThat(v(s, "veip")).isCloseTo(29, within(TOL));
        igual(lista(s, "perdidaOportunidadEsperada"), 29.0, 37.0, 43.0, 52.0, 37.0);
        assertThat(v(s, "perdidaOportunidadMinima")).isCloseTo(v(s, "veip"), within(TOL));
        assertThat(s.metricas()).extracting(m -> m.etiqueta()).anyMatch(e -> e.contains("VEIP"));
        simple(s.resultado()); s.pasos().forEach(p -> simple(p.tabla()));
    }
    @Test void riesgoConCostos() {
        // Costos A1=[4,8] A2=[6,5] A3=[7,3], p=(0.4,0.6): VE = 6.4, 5.4, 4.6 -> A3; con informacion perfecta 4*0.4+3*0.6 = 3.4; VEIP = 1.2
        var s = rie("{\"pagos\":[[4,8],[6,5],[7,3]],\"objetivo\":\"min\",\"probabilidades\":[0.4,0.6]}");
        assertThat(s.resultado().get("decision")).isEqualTo("A3"); assertThat(v(s, "valorEsperado")).isCloseTo(4.6, within(TOL));
        assertThat(v(s, "valorConInformacionPerfecta")).isCloseTo(3.4, within(TOL)); assertThat(v(s, "veip")).isCloseTo(1.2, within(TOL));
        assertThat(lista(s, "perdidaOportunidadEsperada").get(2)).isCloseTo(1.2, within(TOL));
    }
    @Test void riesgoConCertezaTieneVeipCero() {
        assertThat(v(rie("{\"pagos\":[[3,9],[5,1]],\"objetivo\":\"max\",\"probabilidades\":[0,1]}"), "veip")).isEqualTo(0.0);
    }
    @Test void rechazaTablasInvalidas() {
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"objetivo\":\"max\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[],\"objetivo\":\"max\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[]],\"objetivo\":\"max\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2],[3]],\"objetivo\":\"max\"}")).withMessageContaining("rectangular");
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,\"x\"]],\"objetivo\":\"max\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,1e13]],\"objetivo\":\"max\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]]}")).withMessageContaining("max");
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"maximo\"}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"alternativas\":[\"a\",\"b\"]}")).withMessageContaining("alternativa");
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"estados\":[\"a\"]}")).withMessageContaining("estado");
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"estados\":[\"a\",5]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"alternativas\":[\"" + "x".repeat(61) + "\"]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"alfa\":1.5}")).withMessageContaining("entre 0 y 1");
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[[1,2]],\"objetivo\":\"max\",\"alfa\":-0.1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> DecisionesSolver.resolver("incertidumbre", null));
        assertThatIllegalArgumentException().isThrownBy(() -> DecisionesSolver.resolver("maximin", j("{}"))).withMessageContaining("maximin");
        assertThatIllegalArgumentException().isThrownBy(() -> DecisionesSolver.resolver(null, j("{}")));
    }
    @Test void rechazaTablasDemasiadoGrandes() {
        var fila = "[" + "1,".repeat(20) + "1]"; // 21 estados
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":[" + fila + "],\"objetivo\":\"max\"}")).withMessageContaining("20");
        var col = "[" + "[1],".repeat(20) + "[1]]"; // 21 alternativas
        assertThatIllegalArgumentException().isThrownBy(() -> inc("{\"pagos\":" + col + ",\"objetivo\":\"max\"}")).withMessageContaining("20");
    }
    @Test void rechazaProbabilidadesInvalidas() {
        String t = "{\"pagos\":[[1,2],[3,4]],\"objetivo\":\"max\",";
        assertThatIllegalArgumentException().isThrownBy(() -> rie(t + "\"probabilidades\":[0.5,0.4]}")).withMessageContaining("sumar 1");
        assertThatIllegalArgumentException().isThrownBy(() -> rie(t + "\"probabilidades\":[1]}")).withMessageContaining("probabilidad");
        assertThatIllegalArgumentException().isThrownBy(() -> rie(t + "\"probabilidades\":[1.5,-0.5]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> rie(t + "\"probabilidades\":[\"a\",\"b\"]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> rie("{\"pagos\":[[1,2],[3,4]],\"objetivo\":\"max\"}")).withMessageContaining("probabilidad");
        assertThat(v(rie(t + "\"probabilidades\":[0.5000001,0.5]}"), "valorEsperado")).isCloseTo(3.5, within(1e-5)); // tolerancia 1e-6
    }
}
