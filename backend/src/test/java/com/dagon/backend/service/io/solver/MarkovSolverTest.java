package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class MarkovSolverTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final double TOL = 1e-9;
    private static JsonNode j(String s) { try { return JSON.readTree(s); } catch (Exception e) { throw new IllegalStateException(e); } }
    private static IoSolucion r(String datos) { return MarkovSolver.resolver("discreto", j(datos)); }
    @SuppressWarnings("unchecked") private static List<List<Double>> hist(IoSolucion s) { return (List<List<Double>>) s.resultado().get("historial"); }
    @SuppressWarnings("unchecked") private static List<Double> pi(IoSolucion s) { return (List<Double>) s.resultado().get("estacionaria"); }
    private static void igual(List<Double> real, double... esperado) {
        assertThat(real).hasSize(esperado.length);
        for (int i = 0; i < esperado.length; i++) assertThat(real.get(i)).isCloseTo(esperado[i], within(TOL));
    }
    private static void simple(Object o) {
        if (o instanceof Map<?, ?> m) m.values().forEach(MarkovSolverTest::simple);
        else if (o instanceof List<?> l) l.forEach(MarkovSolverTest::simple);
        else if (o instanceof Double d) assertThat(d).isFinite();
        else assertThat(o == null || o instanceof Integer || o instanceof String || o instanceof Boolean).isTrue();
    }

    @Test void lealtadDeMarcasConEstacionaria06y04() {
        // pi0 = 0.3/(0.2+0.3) = 0.6 resolviendo pi0*0.2 = pi1*0.3
        var s = r("{\"P\":[[0.8,0.2],[0.3,0.7]],\"inicial\":[1,0],\"n\":2}");
        assertThat(s.tipo()).isEqualTo("markov"); assertThat(s.metodo()).isEqualTo("discreto"); assertThat(s.estado()).isEqualTo("calculado");
        igual(pi(s), 0.6, 0.4); assertThat(s.resultado().get("estacionariaUnica")).isEqualTo(true);
        assertThat(hist(s)).hasSize(3);
        assertThat(hist(s).get(0)).containsExactly(1.0, 0.0);
        assertThat(hist(s).get(1)).containsExactly(0.8, 0.2);
        assertThat(hist(s).get(2).get(0)).isCloseTo(0.7, within(TOL)); // 0.8*0.8 + 0.2*0.3
        assertThat(hist(s).get(2).get(1)).isCloseTo(0.3, within(TOL));
        assertThat(s.metricas()).hasSize(4); // 2 estados tras n pasos + 2 en largo plazo
        assertThat(s.metricas().get(0).etiqueta()).contains("Estado 1").contains("2 pasos");
        assertThat(s.pasos()).isNotEmpty(); simple(s.resultado()); s.pasos().forEach(p -> simple(p.tabla()));
    }
    @Test void ejemploDeLaTierraDeOzDeKemenySnell() {
        // Lluvia/buen tiempo/nieve: pi = (0.4, 0.2, 0.4)
        var s = r("{\"P\":[[0.5,0.25,0.25],[0.5,0,0.5],[0.25,0.25,0.5]],\"inicial\":[0,1,0],\"n\":300}");
        assertThat(pi(s).get(0)).isCloseTo(0.4, within(TOL)); assertThat(pi(s).get(1)).isCloseTo(0.2, within(TOL)); assertThat(pi(s).get(2)).isCloseTo(0.4, within(TOL));
        var ultimo = hist(s).get(300); // la cadena es regular: converge a pi
        for (int k = 0; k < 3; k++) assertThat(ultimo.get(k)).isCloseTo(pi(s).get(k), within(1e-6));
        assertThat(s.resultado().get("absorbentes")).asList().isEmpty();
    }
    @Test void estadoAbsorbente() {
        var s = r("{\"P\":[[1,0],[0.3,0.7]],\"inicial\":[0,1],\"n\":1}");
        igual(pi(s), 1.0, 0.0); assertThat(s.resultado().get("absorbentes")).asList().containsExactly(0);
        assertThat(s.resultado().get("estacionariaUnica")).isEqualTo(true);
        assertThat(hist(s).get(1)).containsExactly(0.3, 0.7);
    }
    @Test void ruinaDelJugadorTieneDosAbsorbentesYEstacionariaNoUnica() {
        var s = r("{\"P\":[[1,0,0,0],[0.5,0,0.5,0],[0,0.5,0,0.5],[0,0,0,1]],\"inicial\":[0,1,0,0],\"n\":50}");
        assertThat(s.resultado().get("absorbentes")).asList().containsExactly(0, 3);
        assertThat(s.resultado().get("estacionariaUnica")).isEqualTo(false);
        assertThat(pi(s).stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(1, within(TOL));
        assertThat(s.pasos().get(s.pasos().size() - 1).texto()).contains("varias");
        // la masa que sobrevive en los estados transitorios decae y se reparte entre los absorbentes: desde 1, P(ruina) = 2/3
        assertThat(hist(s).get(50).get(0)).isCloseTo(2.0 / 3, within(1e-4));
        assertThat(hist(s).get(50).get(3)).isCloseTo(1.0 / 3, within(1e-4));
    }
    @Test void identidadNoTieneEstacionariaUnica() {
        var s = r("{\"P\":[[1,0],[0,1]],\"inicial\":[0.5,0.5],\"n\":1}");
        assertThat(pi(s).stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(1, within(TOL));
        assertThat(s.resultado().get("estacionariaUnica")).isEqualTo(false); assertThat(s.resultado().get("absorbentes")).asList().containsExactly(0, 1);
    }
    @Test void cadenaPeriodicaTieneEstacionariaPeroNoConverge() {
        var s = r("{\"P\":[[0,1],[1,0]],\"inicial\":[1,0],\"n\":3}");
        igual(pi(s), 0.5, 0.5);
        assertThat(hist(s).get(1)).containsExactly(0.0, 1.0); assertThat(hist(s).get(2)).containsExactly(1.0, 0.0); assertThat(hist(s).get(3)).containsExactly(0.0, 1.0);
    }
    @Test void cerosPasosDevuelveSoloLaInicial() {
        var s = r("{\"P\":[[0.8,0.2],[0.3,0.7]],\"inicial\":[0.25,0.75],\"n\":0}");
        assertThat(hist(s)).hasSize(1); assertThat(hist(s).get(0)).containsExactly(0.25, 0.75); assertThat(s.metricas().get(0).etiqueta()).contains("0 pasos");
    }
    @Test void normalizaElRedondeoPermitido() {
        var s = r("{\"P\":[[0.8,0.2000001],[0.3,0.7]],\"inicial\":[0.5,0.5000001],\"n\":1}");
        assertThat(pi(s).get(0)).isCloseTo(0.6, within(1e-6));
        assertThat(hist(s).get(0).stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(1, within(TOL));
    }
    @Test void doceEstadosCumplenPiPEqPi() {
        int n = 12; double[][] p = new double[n][n]; var sb = new StringBuilder("{\"P\":[");
        for (int i = 0; i < n; i++) {
            double suma = 0; for (int k = 0; k < n; k++) { p[i][k] = 1 + (i * 7 + k * 13) % 5; suma += p[i][k]; }
            sb.append(i > 0 ? "," : "").append("[");
            for (int k = 0; k < n; k++) { p[i][k] /= suma; sb.append(k > 0 ? "," : "").append(p[i][k]); }
            sb.append("]");
        }
        var ini = new StringBuilder(); for (int i = 0; i < n; i++) ini.append(i > 0 ? "," : "").append(i == 0 ? 1 : 0);
        var s = r(sb + "],\"inicial\":[" + ini + "],\"n\":500}");
        var pi = pi(s);
        for (int k = 0; k < n; k++) { double suma = 0; for (int i = 0; i < n; i++) suma += pi.get(i) * p[i][k]; assertThat(suma).isCloseTo(pi.get(k), within(1e-8)); }
        assertThat(hist(s).get(500).get(0)).isCloseTo(pi.get(0), within(1e-6));
    }
    @Test void rechazaMatricesInvalidas() {
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[0.8,0.3],[0.3,0.7]],\"inicial\":[1,0],\"n\":1}")).withMessageContaining("sumar 1");
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[1,0,0],[0,1,0]],\"inicial\":[1,0],\"n\":1}")).withMessageContaining("cuadrada");
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[-0.1,1.1],[0.3,0.7]],\"inicial\":[1,0],\"n\":1}")).withMessageContaining("entre 0 y 1");
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[1.5,-0.5],[0.3,0.7]],\"inicial\":[1,0],\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[1,0],[0.5]],\"inicial\":[1,0],\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[],\"inicial\":[],\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"P\":[[\"a\"]],\"inicial\":[1],\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r("{\"inicial\":[1],\"n\":1}"));
    }
    @Test void rechazaInicialYPasosInvalidos() {
        String p = "{\"P\":[[0.8,0.2],[0.3,0.7]],";
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[0.5,0.3],\"n\":1}")).withMessageContaining("sumar");
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1],\"n\":1}")).withMessageContaining("dimensión");
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1.5,-0.5],\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"n\":1}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1,0],\"n\":-1}")).withMessageContaining("entero");
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1,0],\"n\":1.5}")).withMessageContaining("entero");
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1,0],\"n\":1001}"));
        assertThatIllegalArgumentException().isThrownBy(() -> r(p + "\"inicial\":[1,0]}"));
    }
    @Test void limitaElNumeroDeEstadosYLaEntradaNula() {
        int n = 51; var sb = new StringBuilder("{\"P\":["); var ini = new StringBuilder();
        for (int i = 0; i < n; i++) { sb.append(i > 0 ? "," : "").append("["); ini.append(i > 0 ? "," : "").append(i == 0 ? 1 : 0); for (int k = 0; k < n; k++) sb.append(k > 0 ? "," : "").append(k == i ? 1 : 0); sb.append("]"); }
        assertThatIllegalArgumentException().isThrownBy(() -> r(sb + "],\"inicial\":[" + ini + "],\"n\":1}")).withMessageContaining("50");
        assertThatIllegalArgumentException().isThrownBy(() -> MarkovSolver.resolver("discreto", null));
        assertThatIllegalArgumentException().isThrownBy(() -> MarkovSolver.resolver("continuo", j("{}"))).withMessageContaining("continuo");
        assertThatIllegalArgumentException().isThrownBy(() -> MarkovSolver.resolver(null, j("{}")));
    }
}
