package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class InventarioSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final double TOL = 1e-9;
    private static JsonNode j(String s) { try { return JSON.readTree(s); } catch (Exception e) { throw new IllegalStateException(e); } }
    private static IoSolucion r(String metodo, String datos) { return InventarioSolver.resolver(metodo, j(datos)); }
    private static double v(IoSolucion s, String k) { return ((Number) s.resultado().get(k)).doubleValue(); }
    private static double metrica(IoSolucion s, String parte) { return ((Number) s.metricas().stream().filter(m -> m.etiqueta().contains(parte)).findFirst().orElseThrow().valor()).doubleValue(); }
    /** Solo tipos simples y finitos, como exige el contrato de serialización. */
    private static void simple(Object o) {
        if (o instanceof Map<?, ?> m) m.values().forEach(InventarioSolverTest::simple);
        else if (o instanceof List<?> l) l.forEach(InventarioSolverTest::simple);
        else if (o instanceof Double d) assertThat(d).isFinite();
        else assertThat(o == null || o instanceof Integer || o instanceof String || o instanceof Boolean).isTrue();
    }
    private static void assertSimples(IoSolucion s) { simple(s.resultado()); s.pasos().forEach(p -> simple(p.tabla())); s.metricas().forEach(m -> simple(m.valor())); }

    @Test void eoqDeLibroDa200() {
        var s = r("eoq", "{\"D\":1000,\"S\":10,\"H\":0.5}");
        assertThat(s.tipo()).isEqualTo("inventarios"); assertThat(s.metodo()).isEqualTo("eoq"); assertThat(s.estado()).isEqualTo("calculado");
        assertThat(v(s, "Q")).isCloseTo(200, within(TOL)); assertThat(v(s, "N")).isCloseTo(5, within(TOL)); assertThat(v(s, "T")).isCloseTo(0.2, within(TOL));
        assertThat(v(s, "costoTotal")).isCloseTo(100, within(TOL)); // sqrt(2DSH) = sqrt(10000)
        assertThat(metrica(s, "Cantidad de pedido")).isCloseTo(200, within(TOL));
        assertThat(s.resumen()).contains("200");
        assertSimples(s);
    }
    @Test void eoqPasosMuestranLasFormulasSustituidas() {
        var s = r("eoq", "{\"D\":1000,\"S\":10,\"H\":0.5}");
        assertThat(s.pasos().get(0).texto()).contains("2·1000·10/0.5").contains("200");
        assertThat(s.pasos()).hasSizeGreaterThanOrEqualTo(3);
    }
    @Test void eoqCurvaTiene41PuntosYElOptimoNoLaSuperaPorDebajo() {
        var s = r("eoq", "{\"D\":1000,\"S\":10,\"H\":0.5}");
        @SuppressWarnings("unchecked") var curva = (List<Map<String, Object>>) s.resultado().get("curva");
        assertThat(curva).hasSize(41);
        curva.forEach(p -> assertThat(((Number) p.get("total")).doubleValue()).isGreaterThanOrEqualTo(100 - TOL));
        assertThat(curva.get(0).keySet()).containsExactly("q", "ordenar", "mantener", "total");
    }
    @Test void faltantesCoincideConLaFormulaIndependiente() {
        // D=1000, S=10, H=0.5, p=2: Q=sqrt(2DS(H+p)/(Hp))=sqrt(50000); CT optimo=sqrt(2DSH p/(H+p))=sqrt(8000)
        var s = r("faltantes", "{\"D\":1000,\"S\":10,\"H\":0.5,\"p\":2}");
        assertThat(v(s, "Q")).isCloseTo(Math.sqrt(50000), within(TOL));
        assertThat(v(s, "inventarioMaximo") + v(s, "faltanteMaximo")).isCloseTo(v(s, "Q"), within(TOL));
        assertThat(v(s, "inventarioMaximo")).isCloseTo(v(s, "Q") * 2 / 2.5, within(TOL));
        assertThat(v(s, "costoTotal")).isCloseTo(Math.sqrt(8000), within(TOL));
        assertThat(v(s, "costoMantener") + v(s, "costoFaltantes") + 1000 * 10 / v(s, "Q")).isCloseTo(v(s, "costoTotal"), within(TOL));
        assertSimples(s);
    }
    @Test void epqCoincideConLaFormulaIndependiente() {
        // D=1000, S=10, H=0.5, P=2000: Q=sqrt(80000); CT=sqrt(2DSH(1-D/P))=sqrt(5000); Imax=Q/2; t_prod=Q/P
        var s = r("epq", "{\"D\":1000,\"S\":10,\"H\":0.5,\"P\":2000}");
        assertThat(v(s, "Q")).isCloseTo(Math.sqrt(80000), within(TOL));
        assertThat(v(s, "inventarioMaximo")).isCloseTo(Math.sqrt(80000) / 2, within(TOL));
        assertThat(v(s, "costoTotal")).isCloseTo(Math.sqrt(5000), within(TOL));
        assertThat(v(s, "tiempoProduccion")).isCloseTo(Math.sqrt(80000) / 2000, within(TOL));
        assertSimples(s);
    }
    @Test void descuentosDeLibroHeizerWohl() {
        // D=5000, S=49, i=20 %: precios 5.00 (0+), 4.80 (1000+), 4.75 (2000+). Costos 25700, 24725 y 24822.5 -> gana Q=1000.
        var s = r("descuentos", "{\"D\":5000,\"S\":49,\"i\":0.2,\"tramos\":[{\"min\":0,\"precio\":5},{\"min\":1000,\"precio\":4.8},{\"min\":2000,\"precio\":4.75}]}");
        assertThat(v(s, "Q")).isCloseTo(1000, within(TOL)); assertThat(v(s, "precio")).isCloseTo(4.8, within(TOL)); assertThat(v(s, "costoTotal")).isCloseTo(24725, within(TOL));
        assertThat(v(s, "N")).isCloseTo(5, within(TOL)); assertThat(v(s, "T")).isCloseTo(0.2, within(TOL));
        @SuppressWarnings("unchecked") var c = (List<Map<String, Object>>) s.resultado().get("candidatos");
        var costos = c.stream().map(m -> ((Number) m.get("costoTotal")).doubleValue()).toList(); // ordenados de menor a mayor
        assertThat(costos).hasSize(3);
        assertThat(costos.get(0)).isCloseTo(24725, within(TOL)); assertThat(costos.get(1)).isCloseTo(24822.5, within(TOL)); assertThat(costos.get(2)).isCloseTo(25700, within(TOL));
        assertThat(((Number) c.stream().filter(m -> ((Number) m.get("precio")).doubleValue() == 5.0).findFirst().orElseThrow().get("Q")).doubleValue()).isCloseTo(700, within(TOL));
        assertThat(s.resultado().get("curva")).asList().hasSize(41);
        assertSimples(s);
    }
    @Test void descuentosAjustaAlMinimoDelTramo() {
        // El mismo caso del solver JS: Q ideal 149.07 < 500 -> se ajusta a 500; CT = 9000 + 20 + 225 = 9245.
        var s = r("descuentos", "{\"D\":1000,\"S\":10,\"i\":0.1,\"tramos\":[{\"min\":0,\"precio\":10},{\"min\":500,\"precio\":9}]}");
        assertThat(v(s, "Q")).isCloseTo(500, within(TOL)); assertThat(v(s, "costoTotal")).isCloseTo(9245, within(TOL));
    }
    @Test void descuentosDescartaTramoCuyoLoteIdealExcedeElLimiteSuperior() {
        // Tramo 1: H=2, Q ideal = 1000 >= 500 (donde empieza el tramo 2) -> no es factible; solo queda el tramo 2.
        var s = r("descuentos", "{\"D\":10000,\"S\":100,\"i\":0.2,\"tramos\":[{\"min\":0,\"precio\":10},{\"min\":500,\"precio\":9.5}]}");
        assertThat(s.resultado().get("candidatos")).asList().hasSize(1);
        assertThat(v(s, "precio")).isCloseTo(9.5, within(TOL)); assertThat(v(s, "Q")).isCloseTo(Math.sqrt(2.0 * 10000 * 100 / 1.9), within(TOL));
    }
    @Test void reordenConYSinInventarioDeSeguridad() {
        var a = r("reorden", "{\"d\":10,\"L\":4}");
        assertThat(v(a, "R")).isCloseTo(40, within(TOL)); assertThat(v(a, "stockSeguridad")).isZero();
        var b = r("reorden", "{\"d\":10,\"L\":4,\"sigma\":3,\"z\":2}"); // SS = 2*3*sqrt(4) = 12
        assertThat(v(b, "stockSeguridad")).isCloseTo(12, within(TOL)); assertThat(v(b, "R")).isCloseTo(52, within(TOL));
        assertThat(v(b, "puntoReorden")).isCloseTo(52, within(TOL)); assertThat(v(b, "demandaDuranteEntrega")).isCloseTo(40, within(TOL));
        assertThat(b.pasos().get(0).texto()).contains("10·4"); assertThat(b.pasos().get(2).texto()).contains("52");
        assertSimples(b);
    }
    @Test void reordenIgnoraClavesNulas() {
        assertThat(v(r("reorden", "{\"d\":10,\"L\":4,\"sigma\":null,\"z\":null}"), "R")).isCloseTo(40, within(TOL));
    }
    @Test void periodoFijoNivelObjetivoYPedido() {
        // d=10, T=5, L=4, sigma=3, z=2: SS = 2*3*sqrt(9) = 18; M = 10*9+18 = 108; Q = 108-40 = 68
        var s = r("periodo_fijo", "{\"d\":10,\"T\":5,\"L\":4,\"sigma\":3,\"z\":2,\"inventario\":40}");
        assertThat(v(s, "stockSeguridad")).isCloseTo(18, within(TOL)); assertThat(v(s, "nivelObjetivo")).isCloseTo(108, within(TOL)); assertThat(v(s, "Q")).isCloseTo(68, within(TOL));
        assertThat(v(r("periodo_fijo", "{\"d\":1,\"T\":1,\"L\":0,\"sigma\":0,\"z\":0,\"inventario\":10}"), "Q")).isZero(); // ya hay de sobra
        assertThat(v(r("periodo_fijo", "{\"d\":10,\"T\":5,\"L\":4,\"sigma\":3,\"z\":2,\"inventario\":-5}"), "Q")).isCloseTo(113, within(TOL)); // faltantes pendientes suman
    }
    @Test void valoresMinusculosSeLimpianACero() {
        assertThat(v(r("reorden", "{\"d\":1e-10,\"L\":1}"), "R")).isEqualTo(0.0);
    }
    @Test void rechazaParametrosInvalidos() {
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":1000,\"S\":10,\"H\":0}")).withMessageContaining("costo");
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":1000,\"S\":10}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":\"1000\",\"S\":10,\"H\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":-1,\"S\":10,\"H\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":1e13,\"S\":10,\"H\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("faltantes", "{\"D\":1,\"S\":1,\"H\":1,\"p\":-1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("epq", "{\"D\":1000,\"S\":10,\"H\":1,\"P\":500}")).withMessageContaining("mayor");
        assertThatIllegalArgumentException().isThrownBy(() -> r("epq", "{\"D\":1000,\"S\":10,\"H\":1,\"P\":1000}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("reorden", "{\"d\":-1,\"L\":2}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("periodo_fijo", "{\"d\":1,\"T\":0,\"L\":1,\"sigma\":1,\"z\":1,\"inventario\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("periodo_fijo", "{}"));
    }
    @Test void rechazaTramosInvalidos() {
        String base = "{\"D\":1000,\"S\":10,\"i\":0.1,\"tramos\":";
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "[]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", "{\"D\":1000,\"S\":10,\"i\":0.1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "[{\"min\":0,\"precio\":10},{\"min\":0,\"precio\":9}]}")).withMessageContaining("crecientes");
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "[{\"min\":0,\"precio\":10},{\"min\":100,\"precio\":11}]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "[{\"min\":0,\"precio\":0}]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "[5]}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", base + "{}}"));
    }
    @Test void rechazaEntradaNulaMetodoDesconocidoYDesbordes() {
        assertThatIllegalArgumentException().isThrownBy(() -> InventarioSolver.resolver("eoq", null));
        assertThatIllegalArgumentException().isThrownBy(() -> InventarioSolver.resolver("eoq", j("[1,2]")));
        assertThatIllegalArgumentException().isThrownBy(() -> InventarioSolver.resolver(null, j("{}")));
        assertThatIllegalArgumentException().isThrownBy(() -> r("wilson", "{}")).withMessageContaining("wilson");
        // H minúsculo: el lote desborda double y no debe devolverse como número válido.
        assertThatIllegalArgumentException().isThrownBy(() -> r("eoq", "{\"D\":1e12,\"S\":1e12,\"H\":1e-300}")).withMessageContaining("precisión");
    }
    @Test void muchosTramosNoSeAceptanSinLimite() {
        var sb = new StringBuilder("{\"D\":1000,\"S\":10,\"i\":0.1,\"tramos\":[");
        for (int k = 0; k < 31; k++) sb.append(k > 0 ? "," : "").append("{\"min\":").append(k * 10).append(",\"precio\":").append(100 - k).append("}");
        assertThatIllegalArgumentException().isThrownBy(() -> r("descuentos", sb + "]}"));
    }
}
