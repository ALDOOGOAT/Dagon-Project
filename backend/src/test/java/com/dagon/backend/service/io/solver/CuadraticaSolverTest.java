package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class CuadraticaSolverTest {
    private final ObjectMapper json = new ObjectMapper();

    private ObjectNode datos(String objetivo, String... restricciones) {
        ObjectNode d = json.createObjectNode().put("objetivo", objetivo);
        var r = d.putArray("restricciones");
        for (String s : restricciones) r.add(s);
        return d;
    }
    private IoSolucion r(String objetivo, String... restricciones) {
        IoSolucion s = CuadraticaSolver.resolver("kkt", datos(objetivo, restricciones));
        soloTiposSimples(s.resultado()); s.metricas().forEach(m -> soloTiposSimples(m.valor())); s.pasos().forEach(p -> soloTiposSimples(p.tabla()));
        assertThat(s.tipo()).isEqualTo("cuadratica"); assertThat(s.metodo()).isEqualTo("kkt"); assertThat(s.resumen()).isNotBlank();
        return s;
    }
    private void invalido(String objetivo, String... restricciones) {
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", datos(objetivo, restricciones))).as(objetivo + " " + List.of(restricciones)).isInstanceOf(IllegalArgumentException.class);
    }
    private static void soloTiposSimples(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double d) { assertThat(d.isNaN() || d.isInfinite()).as("valor no finito").isFalse(); return; }
        if (o instanceof Map<?, ?> m) { m.forEach((k, v) -> { assertThat(k).isInstanceOf(String.class); soloTiposSimples(v); }); return; }
        if (o instanceof List<?> l) { l.forEach(CuadraticaSolverTest::soloTiposSimples); return; }
        fail("Tipo no permitido en la solución: " + o.getClass());
    }
    private static double num(Object o) { return ((Number) o).doubleValue(); }
    @SuppressWarnings("unchecked") private static Map<String, Object> mapa(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") private static List<Object> lista(Object o) { return (List<Object>) o; }
    private static double x(IoSolucion s, String v) { return num(mapa(s.resultado().get("x")).get(v)); }
    private static double z(IoSolucion s) { return num(s.resultado().get("z")); }

    @Test void hillierLiebermanDa12Con9Y270() {
        var s = r("max z=15x1+30x2+4x1*x2-2x1^2-4x2^2", "x1+2x2<=30", "x1,x2>=0");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x1")).isCloseTo(12, within(1e-6)); assertThat(x(s, "x2")).isCloseTo(9, within(1e-6));
        assertThat(z(s)).isCloseTo(270, within(1e-6));
        assertThat(s.resultado().get("convexa")).isEqualTo(true);
        assertThat(num(mapa(s.resultado().get("multiplicadores")).get("R1"))).isGreaterThan(0);
        assertThat(lista(s.resultado().get("activas"))).containsExactly("R1");
        assertThat(mapa(s.resultado().get("x")).keySet()).containsExactly("x1", "x2");
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).containsExactly("x1", "x2", "Valor objetivo Z");
        assertThat(s.pasos()).hasSize(3);
    }
    @Test void minimoConUnaRestriccionActivaDaUnoCincoDosCinco() {
        var s = r("min z=x1^2+x2^2-4x1-6x2", "x1+x2<=4");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x1")).isCloseTo(1.5, within(1e-6)); assertThat(x(s, "x2")).isCloseTo(2.5, within(1e-6));
        assertThat(z(s)).isCloseTo(-12.5, within(1e-6));
    }
    @Test void proyeccionSobreUnSemiplano() {
        var s = r("min z=(x-3)^2+(y-2)^2", "x+y<=4");
        assertThat(x(s, "x")).isCloseTo(2.5, within(1e-6)); assertThat(x(s, "y")).isCloseTo(1.5, within(1e-6));
        assertThat(z(s)).isCloseTo(0.5, within(1e-6));
    }
    @Test void sinRestriccionesActivasElOptimoEsElPuntoEstacionarioInterior() {
        var s = r("max z=-(x-1)^2-(y-2)^2", "x+y<=10");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x")).isCloseTo(1, within(1e-6)); assertThat(x(s, "y")).isCloseTo(2, within(1e-6));
        assertThat(z(s)).isCloseTo(0, within(1e-9));
        assertThat(lista(s.resultado().get("activas"))).isEmpty();
        assertThat(mapa(s.resultado().get("multiplicadores"))).isEmpty();
    }
    @Test void sinRestriccionesEnAbsoluto() {
        var s = r("min z=(x-1)^2");
        assertThat(x(s, "x")).isCloseTo(1, within(1e-6));
    }
    @Test void igualdadYMultiplicadorConSigno() {
        var s = r("min z=x^2+2y^2", "x+y=3");
        assertThat(x(s, "x")).isCloseTo(2, within(1e-6)); assertThat(x(s, "y")).isCloseTo(1, within(1e-6)); assertThat(z(s)).isCloseTo(6, within(1e-6));
        assertThat(num(mapa(s.resultado().get("multiplicadores")).get("R1"))).isCloseTo(-4, within(1e-6));
        var tres = r("min z=x^2+y^2+w^2", "x+y+w=3");
        assertThat(x(tres, "x")).isCloseTo(1, within(1e-6)); assertThat(z(tres)).isCloseTo(3, within(1e-6));
    }
    @Test void noConvexaConRegionAcotadaEnumeraTodosLosKkt() {
        var s = r("max z=x^2+y^2", "x+y<=4");
        assertThat(s.resultado().get("convexa")).isEqualTo(false);
        assertThat(s.resultado().get("acotada")).isEqualTo(true);
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(z(s)).isCloseTo(16, within(1e-6));
        assertThat(lista(s.resultado().get("candidatos")).size()).isGreaterThan(1);
        assertThat(lista(s.resultado().get("candidatos")).stream().filter(c -> mapa(c).get("optimo").equals(true))).hasSize(1);
    }
    @Test void noConvexaConRegionNoAcotadaDevuelveElMejorKktComoEstacionario() {
        var s = r("min z=-x^2+2x", "x>=0");
        assertThat(s.estado()).isEqualTo("estacionario");
        assertThat(s.resultado().get("acotada")).isEqualTo(false);
        assertThat(x(s, "x")).isCloseTo(0, within(1e-9)); assertThat(z(s)).isCloseTo(0, within(1e-9));
        assertThat(s.advertencias()).anyMatch(a -> a.contains("global"));
    }
    @Test void objetivoLinealResuelveUnProblemaDePL() {
        var s = r("max z=3x1+5x2", "x1<=4", "2x2<=12", "3x1+2x2<=18");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x1")).isCloseTo(2, within(1e-6)); assertThat(x(s, "x2")).isCloseTo(6, within(1e-6)); assertThat(z(s)).isCloseTo(36, within(1e-6));
    }
    @Test void detectaInfactibleYNoAcotado() {
        var infactible = r("min z=x^2", "x>=3", "x<=1");
        assertThat(infactible.estado()).isEqualTo("infactible");
        assertThat(infactible.resultado().get("z")).isNull();
        assertThat(mapa(infactible.resultado().get("x")).get("x")).isEqualTo(0.0);
        var noAcotado = r("max z=x1+x2", "x1-x2<=1");
        assertThat(noAcotado.estado()).isEqualTo("no_acotado");
        assertThat(noAcotado.resultado().get("z")).isNull();
        assertThat(noAcotado.advertencias()).anyMatch(a -> a.contains("sin límite"));
        assertThat(r("min z=x^2", "x=2", "x=3").estado()).isEqualTo("infactible");
        assertThat(r("max z=x+y", "x+y=1", "x-y=1", "x=0").estado()).isEqualTo("infactible");   // más igualdades que variables, incompatibles
        assertThat(r("min z=x^2+y^2", "x+y=2", "x+y=3").estado()).isEqualTo("infactible");
    }
    @Test void igualdadesRedundantesNoRompenElSistemaKkt() {
        var s = r("min z=x^2+y^2", "x+y=2", "2x+2y=4", "x+y=2");
        assertThat(s.estado()).isEqualTo("optimo");
        assertThat(x(s, "x")).isCloseTo(1, within(1e-6)); assertThat(x(s, "y")).isCloseTo(1, within(1e-6)); assertThat(z(s)).isCloseTo(2, within(1e-6));
        assertThat(mapa(s.resultado().get("multiplicadores")).keySet()).containsExactly("R1");
        assertThat(x(r("max z=x1+x2", "x1=2", "x1=2", "x2<=3"), "x2")).isCloseTo(3, within(1e-6));
    }
    @Test void aceptaUnicodeFraccionesYOrdenNaturalDeVariables() {
        var s = r("max z=-(x1-1)^2-(x2-1)^2-(x10-1)^2", "x1 ≤ 4", "x2 + x10 ≤ 10");
        assertThat(mapa(s.resultado().get("x")).keySet()).containsExactly("x1", "x2", "x10");
        assertThat(x(s, "x10")).isCloseTo(1, within(1e-6));
        assertThat(x(r("min z=0.5x^2-x"), "x")).isCloseTo(1, within(1e-6));
        assertThat(x(r("min z=(x-1/3)^2"), "x")).isCloseTo(1.0 / 3, within(1e-6));   // fracción escrita con paréntesis
        assertThat(x(r("MIN Z = x^2 - 2x"), "x")).isCloseTo(1, within(1e-6));
    }
    @Test void seisVariablesYDiezRestriccionesTerminanRapido() {
        String[] rs = {"x1+x2<=5", "x2+x3<=5", "x3+x4<=5", "x4+x5<=5", "x5+x6<=5", "x1+x6<=5", "x1+x3+x5<=6", "x2+x4+x6<=6", "x1-x4<=2", "x2-x5<=2"};
        long t0 = System.nanoTime();
        var s = r("max z=-(x1-3)^2-(x2-3)^2-(x3-3)^2-(x4-3)^2-(x5-3)^2-(x6-3)^2", rs);
        assertThat((System.nanoTime() - t0) / 1e9).isLessThan(10.0);
        assertThat(s.estado()).isEqualTo("optimo");
        // Proyectar (3,..,3) sobre x1+x3+x5<=6 y x2+x4+x6<=6 da xi=2; las demás restricciones quedan holgadas.
        for (String v : List.of("x1", "x2", "x3", "x4", "x5", "x6")) assertThat(x(s, v)).isCloseTo(2, within(1e-6));
        assertThat(z(s)).isCloseTo(-6, within(1e-6));
    }
    @Test void limitaDesigualdadesDeLaEnumeracion() {
        String[] rs = new String[11];
        for (int i = 0; i < rs.length; i++) rs[i] = "x1+x2+x3+x4+x5+x6<=" + (100 + i);
        invalido("max z=-x1^2-x2^2-x3^2-x4^2-x5^2-x6^2", rs);     // 11 + 6 no negatividades > 16
    }
    @Test void rechazaModelosInvalidos() {
        invalido("max z=x^3", "x<=2");
        invalido("max z=x1+x2+x1x2", "x1+x2<=3");                  // x1x2 parece un producto de variables
        invalido("z=x^2", "x<=2");
        invalido("maximize x^2", "x<=2");
        invalido("max z=5", "x<=2");
        invalido("max z=x1+x2+x3+x4+x5+x6+x7", "x1<=1");
        invalido("max z=sin(x)", "x<=2");
        invalido("max z=1/x", "x<=2");
        invalido("max z=sqrt(x)", "x<=2");
        invalido("max z=exp(x)", "x<=2");
        invalido("max z=x^2", "x<=2", "x enteras");
        invalido("max z=x^2", "x<=2", "x binaria");
        invalido("max z=x^2", "x");
        invalido("max z=x^2", "x<2");
        invalido("max z=x^2", "x**2<=2");
        invalido("max z=x^2", "x*y<=2");                            // restricción no lineal
        invalido("max z=x^2", "x^2<=2");
        invalido("max z=x^2", "x/y<=2");
        invalido("max z=1e13*x", "x<=2");
        invalido("max z=x", "x<=1e13");
        invalido("max z=x^2".repeat(80), "x<=2");                   // más de 500 caracteres
    }
    @Test void rechazaTextoPeligrosoEnObjetivoYRestricciones() {
        invalido("max z=java.lang.System.exit(0)", "x<=2");
        invalido("max z=x;rm", "x<=2");
        invalido("max z=x", "x<=2; DROP TABLE alumnos");
        invalido("max z=x", "java.lang.Runtime.getRuntime().exec('ls')<=2");
        invalido("max z=x", "x<=2`ls`");
        invalido("max z=x\nsystem(\"ls\")", "x<=2");
    }
    @Test void rechazaEstructuraDeDatosInvalida() {
        var json = new ObjectMapper();
        assertThatThrownBy(() -> CuadraticaSolver.resolver("simplex", datos("max z=x", "x<=1"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver(null, datos("max z=x", "x<=1"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("[1]"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("{\"restricciones\":[\"x<=1\"]}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("{\"objetivo\":5,\"restricciones\":[]}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("{\"objetivo\":\"max z=x\"}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("{\"objetivo\":\"max z=x\",\"restricciones\":\"x<=1\"}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuadraticaSolver.resolver("kkt", json.readTree("{\"objetivo\":\"max z=x\",\"restricciones\":[5]}"))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void ignoraClavesAjenas() throws Exception {
        var d = (ObjectNode) json.readTree("{\"objetivo\":\"min z=(x-1)^2\",\"restricciones\":[\"x<=5\"],\"solucion\":99,\"__proto__\":1}");
        assertThat(x(CuadraticaSolver.resolver("kkt", d), "x")).isCloseTo(1, within(1e-6));
    }
}
