package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class ColasSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final double TOL = 1e-9;
    private static JsonNode j(String s) { try { return JSON.readTree(s); } catch (Exception e) { throw new IllegalStateException(e); } }
    private static IoSolucion r(String metodo, String datos) { return ColasSolver.resolver(metodo, j(datos)); }
    private static double v(IoSolucion s, String k) { return ((Number) s.resultado().get(k)).doubleValue(); }
    @SuppressWarnings("unchecked") private static List<Map<String, Object>> pn(IoSolucion s) { return (List<Map<String, Object>>) s.resultado().get("Pn"); }
    private static void simple(Object o) {
        if (o instanceof Map<?, ?> m) m.values().forEach(ColasSolverTest::simple);
        else if (o instanceof List<?> l) l.forEach(ColasSolverTest::simple);
        else if (o instanceof Double d) assertThat(d).isFinite();
        else assertThat(o == null || o instanceof Integer || o instanceof String || o instanceof Boolean).isTrue();
    }
    /** Erlang C con aritmética de precisión arbitraria y factoriales explícitos: referencia independiente de la recurrencia. */
    private static double erlangC(double a, int s) {
        var mc = new MathContext(120); var A = BigDecimal.valueOf(a);
        BigDecimal termino = BigDecimal.ONE, suma = BigDecimal.ZERO;
        for (int k = 0; k < s; k++) { suma = suma.add(termino); termino = termino.multiply(A).divide(BigDecimal.valueOf(k + 1), mc); }
        var cola = termino.divide(BigDecimal.ONE.subtract(A.divide(BigDecimal.valueOf(s), mc)), mc); // a^s / (s! (1-rho))
        return cola.divide(suma.add(cola), mc).doubleValue();
    }

    @Test void mm1DeLibro() {
        var s = r("mm1", "{\"lambda\":2,\"mu\":3}");
        assertThat(s.tipo()).isEqualTo("colas"); assertThat(s.metodo()).isEqualTo("mm1"); assertThat(s.estado()).isEqualTo("calculado");
        assertThat(v(s, "rho")).isCloseTo(2.0 / 3, within(TOL)); assertThat(v(s, "P0")).isCloseTo(1.0 / 3, within(TOL));
        assertThat(v(s, "L")).isCloseTo(2, within(TOL)); assertThat(v(s, "Lq")).isCloseTo(4.0 / 3, within(TOL));
        assertThat(v(s, "W")).isCloseTo(1, within(TOL)); assertThat(v(s, "Wq")).isCloseTo(2.0 / 3, within(TOL));
        assertThat(v(s, "Pw")).isCloseTo(2.0 / 3, within(TOL)); assertThat(s.resultado().get("estable")).isEqualTo(true);
        assertThat(pn(s)).hasSize(16);
        assertThat(((Number) pn(s).get(2).get("p")).doubleValue()).isCloseTo(1.0 / 3 * 4 / 9, within(TOL)); // P0 * rho^2
        assertThat(pn(s).get(2).get("n")).isEqualTo(2);
        assertThat(s.pasos()).isNotEmpty(); assertThat(s.pasos().get(0).texto()).contains("2/3");
        simple(s.resultado());
    }
    @Test void mm2DeLibro() {
        // lambda=2, mu=3, s=2: a=2/3, rho=1/3, P0=1/2, Pw=1/6, Lq=1/12, Wq=1/24, L=3/4, P2=P0*a^2/2=1/9
        var s = r("mms", "{\"lambda\":2,\"mu\":3,\"s\":2}");
        assertThat(v(s, "rho")).isCloseTo(1.0 / 3, within(TOL)); assertThat(v(s, "P0")).isCloseTo(0.5, within(TOL));
        assertThat(v(s, "Pw")).isCloseTo(1.0 / 6, within(TOL)); assertThat(v(s, "Lq")).isCloseTo(1.0 / 12, within(TOL));
        assertThat(v(s, "Wq")).isCloseTo(1.0 / 24, within(TOL)); assertThat(v(s, "L")).isCloseTo(0.75, within(TOL));
        assertThat(v(s, "W")).isCloseTo(1.0 / 24 + 1.0 / 3, within(TOL));
        assertThat(((Number) pn(s).get(2).get("p")).doubleValue()).isCloseTo(1.0 / 9, within(TOL));
        simple(s.resultado());
    }
    @Test void unServidorCoincideConMm1() {
        var a = r("mm1", "{\"lambda\":2,\"mu\":3}"); var b = r("mms", "{\"lambda\":2,\"mu\":3,\"s\":1}");
        for (String k : List.of("rho", "P0", "L", "Lq", "W", "Wq", "Pw")) assertThat(v(b, k)).as(k).isCloseTo(v(a, k), within(TOL));
    }
    @Test void aceptaSIgualAUnoEnMm1() { assertThat(v(r("mm1", "{\"lambda\":2,\"mu\":3,\"s\":1}"), "L")).isCloseTo(2, within(TOL)); }
    @Test void leyDeLittleYDistribucionSumanAUno() {
        var s = r("mms", "{\"lambda\":7.5,\"mu\":2,\"s\":5}");
        assertThat(v(s, "L")).isCloseTo(7.5 * v(s, "W"), within(1e-9)); assertThat(v(s, "Lq")).isCloseTo(7.5 * v(s, "Wq"), within(1e-9));
        assertThat(v(s, "W") - v(s, "Wq")).isCloseTo(0.5, within(1e-9));
        var cola = r("mm1", "{\"lambda\":1,\"mu\":4}"); // masa en n=0..15 = 1 - rho^16
        assertThat(pn(cola).stream().mapToDouble(m -> ((Number) m.get("p")).doubleValue()).sum()).isCloseTo(1 - Math.pow(0.25, 16), within(1e-9));
    }
    @Test void sinLlegadas() {
        var a = r("mm1", "{\"lambda\":0,\"mu\":3}"); assertThat(v(a, "W")).isCloseTo(1.0 / 3, within(TOL)); assertThat(v(a, "L")).isZero();
        var b = r("mms", "{\"lambda\":0,\"mu\":3,\"s\":2}");
        assertThat(v(b, "P0")).isCloseTo(1, within(TOL)); assertThat(v(b, "L")).isZero(); assertThat(v(b, "Wq")).isZero(); assertThat(v(b, "W")).isCloseTo(1.0 / 3, within(TOL));
        assertThat(((Number) pn(b).get(1).get("p")).doubleValue()).isZero();
    }
    @Test void quinientosServidoresCoincideConErlangCExacto() {
        var s = r("mms", "{\"lambda\":490,\"mu\":1,\"s\":500}");
        double pw = erlangC(490, 500);
        assertThat(pw).isBetween(0.01, 0.99);
        assertThat(v(s, "Pw")).isCloseTo(pw, within(1e-9));
        double rho = 0.98, lq = pw * rho / (1 - rho);
        assertThat(v(s, "Lq")).isCloseTo(lq, within(1e-8)); assertThat(v(s, "Wq")).isCloseTo(lq / 490, within(1e-8));
        assertThat(v(s, "L")).isCloseTo(lq + 490, within(1e-8)); assertThat(v(s, "W")).isCloseTo(lq / 490 + 1, within(1e-8));
        simple(s.resultado());
    }
    @Test void milServidoresSinDesbordar() {
        var s = r("mms", "{\"lambda\":990,\"mu\":1,\"s\":1000}");
        assertThat(v(s, "Pw")).isCloseTo(erlangC(990, 1000), within(1e-9));
        assertThat(v(s, "P0")).isBetween(0.0, 1.0); assertThat(v(s, "W")).isFinite();
    }
    @Test void sistemaInestableSeRechaza() {
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":3,\"mu\":3}")).withMessageContaining("inestable");
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":4,\"mu\":3}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":6,\"mu\":3,\"s\":2}")).withMessageContaining("inestable");
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":7,\"mu\":3,\"s\":2}"));
    }
    @Test void costoTotalCuandoVienenCostos() {
        var a = r("mm1", "{\"lambda\":2,\"mu\":3,\"cs\":10,\"cw\":5}"); assertThat(v(a, "costoTotal")).isCloseTo(10 + 5 * 2, within(TOL)); // s*cs + L*cw
        var b = r("mms", "{\"lambda\":2,\"mu\":3,\"s\":2,\"cs\":10,\"cw\":5}"); assertThat(v(b, "costoTotal")).isCloseTo(2 * 10 + 5 * 0.75, within(TOL));
        assertThat(b.metricas()).anyMatch(m -> m.etiqueta().contains("Costo total"));
        assertThat(r("mm1", "{\"lambda\":2,\"mu\":3}").resultado()).doesNotContainKey("costoTotal");
        assertThat(v(r("mm1", "{\"lambda\":2,\"mu\":3,\"cs\":0,\"cw\":0}"), "costoTotal")).isZero();
    }
    @Test void costosIncompletosONegativosSeRechazan() {
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":2,\"mu\":3,\"cs\":10}")).withMessageContaining("ambos");
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":2,\"mu\":3,\"cw\":10}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":2,\"mu\":3,\"cs\":-1,\"cw\":1}"));
        assertThat(v(r("mm1", "{\"lambda\":2,\"mu\":3,\"cs\":null,\"cw\":null}"), "L")).isCloseTo(2, within(TOL));
    }
    @Test void parametrosInvalidos() {
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":-1,\"mu\":3}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":1,\"mu\":0}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":\"1\",\"mu\":3}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":1,\"mu\":3,\"s\":2}")).withMessageContaining("un solo servidor");
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":1,\"mu\":3}")).withMessageContaining("servidores");
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":1,\"mu\":3,\"s\":1.5}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":1,\"mu\":3,\"s\":0}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mms", "{\"lambda\":1,\"mu\":3,\"s\":1001}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("mm1", "{\"lambda\":1e13,\"mu\":1e14}"));
        assertThatIllegalArgumentException().isThrownBy(() -> ColasSolver.resolver("mm1", null));
        assertThatIllegalArgumentException().isThrownBy(() -> ColasSolver.resolver("mm1", j("[]")));
        assertThatIllegalArgumentException().isThrownBy(() -> ColasSolver.resolver("mg1", j("{}"))).withMessageContaining("mg1");
        assertThatIllegalArgumentException().isThrownBy(() -> ColasSolver.resolver(null, j("{}")));
    }
    @Test void utilizacionCasiUnoSigueFinita() {
        var s = r("mm1", "{\"lambda\":999,\"mu\":1000}");
        assertThat(v(s, "L")).isCloseTo(999, within(1e-6)); assertThat(v(s, "W")).isCloseTo(1, within(1e-9));
    }
}
