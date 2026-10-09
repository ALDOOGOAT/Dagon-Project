package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class NoLinealSolverTest {
    private final ObjectMapper json = new ObjectMapper();

    private IoSolucion r(String metodo, String datos) throws Exception {
        IoSolucion s = NoLinealSolver.resolver(metodo, json.readTree(datos));
        soloTiposSimples(s.resultado()); s.metricas().forEach(m -> soloTiposSimples(m.valor())); s.pasos().forEach(p -> soloTiposSimples(p.tabla()));
        assertThat(s.tipo()).isEqualTo("noLineal"); assertThat(s.metodo()).isEqualTo(metodo);
        assertThat(s.resumen()).isNotBlank();
        return s;
    }
    /** Jackson 3 no serializa nodos de Jackson 2 ni arreglos primitivos, y JSON no admite NaN/Infinity. */
    private static void soloTiposSimples(Object o) {
        if (o == null || o instanceof String || o instanceof Boolean || o instanceof Integer) return;
        if (o instanceof Double d) { assertThat(d.isNaN() || d.isInfinite()).as("valor no finito").isFalse(); return; }
        if (o instanceof Map<?, ?> m) { m.forEach((k, v) -> { assertThat(k).isInstanceOf(String.class); soloTiposSimples(v); }); return; }
        if (o instanceof List<?> l) { l.forEach(NoLinealSolverTest::soloTiposSimples); return; }
        fail("Tipo no permitido en la solución: " + o.getClass());
    }
    private static double num(Map<String, Object> m, String clave) { return ((Number) m.get(clave)).doubleValue(); }
    @SuppressWarnings("unchecked") private static Map<String, Object> mapa(Object o) { return (Map<String, Object>) o; }
    @SuppressWarnings("unchecked") private static List<Object> lista(Object o) { return (List<Object>) o; }
    private void invalido(String metodo, String datos) {
        assertThatThrownBy(() -> NoLinealSolver.resolver(metodo, json.readTree(datos))).as(metodo + " " + datos).isInstanceOf(IllegalArgumentException.class);
    }

    // ---------------------------------------------------------------- sección dorada
    @Test void doradaEncuentraElMaximoDeXPorCincoMenosX() throws Exception {
        var s = r("dorada", "{\"f\":\"x(5-x)\",\"a\":0,\"b\":5,\"objetivo\":\"max\"}");
        assertThat(num(s.resultado(), "x")).isCloseTo(2.5, within(1e-5));
        assertThat(num(s.resultado(), "fx")).isCloseTo(6.25, within(1e-9));
        assertThat(s.estado()).isEqualTo("aproximado");
        assertThat(lista(s.resultado().get("iteraciones")).size()).isGreaterThan(10);
        assertThat(mapa(lista(s.resultado().get("iteraciones")).get(0)).keySet()).containsExactly("a", "b", "x1", "x2", "f1", "f2");
        assertThat(s.metricas()).extracting(IoSolucion.Metrica::etiqueta).contains("x", "f(x)");
        assertThat(s.pasos()).isNotEmpty();
    }
    @Test void doradaMinimoDeParabola() throws Exception {
        var s = r("dorada", "{\"f\":\"(x-3)^2+2\",\"a\":-5,\"b\":10,\"objetivo\":\"min\"}");
        assertThat(num(s.resultado(), "x")).isCloseTo(3, within(1e-5));
        assertThat(num(s.resultado(), "fx")).isCloseTo(2, within(1e-9));
        assertThat(s.advertencias()).noneMatch(a -> a.contains("no parece unimodal"));
    }
    @Test void doradaAdviertePorFuncionNoUnimodalYExtremoDelIntervalo() throws Exception {
        assertThat(r("dorada", "{\"f\":\"sin(x)\",\"a\":0,\"b\":10,\"objetivo\":\"min\"}").advertencias()).anyMatch(a -> a.contains("no parece unimodal"));
        var borde = r("dorada", "{\"f\":\"x\",\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
        assertThat(num(borde.resultado(), "x")).isLessThan(1e-5);
        assertThat(borde.advertencias()).anyMatch(a -> a.contains("extremo"));
        // Unimodal pero para el otro objetivo: minimizar una campana converge a un extremo, no a un óptimo interior.
        assertThat(r("dorada", "{\"f\":\"-(x-2)^2\",\"a\":0,\"b\":5,\"objetivo\":\"min\"}").advertencias()).anyMatch(a -> a.contains("no parece unimodal"));
    }
    @Test void doradaAdvierteSiLaFuncionTieneUnPoloEnElIntervalo() throws Exception {
        assertThat(r("dorada", "{\"f\":\"1/x\",\"a\":-1,\"b\":1,\"objetivo\":\"min\"}").advertencias()).anyMatch(a -> a.contains("no está definida"));
    }
    @Test void doradaIntervalosEnormesYMuyEstrechosTerminan() throws Exception {
        var s = r("dorada", "{\"f\":\"(x-5)^2\",\"a\":-1e12,\"b\":1e12,\"objetivo\":\"min\"}");
        assertThat(num(s.resultado(), "x")).isCloseTo(5, within(1e-2));
        assertThat(lista(s.resultado().get("iteraciones")).size()).isLessThan(200);
        var estrecho = r("dorada", "{\"f\":\"x^2\",\"a\":0,\"b\":1e-9,\"objetivo\":\"min\"}");
        assertThat(lista(estrecho.resultado().get("iteraciones"))).hasSize(1);
    }
    @Test void doradaRechazaEntradasInvalidas() {
        invalido("dorada", "{\"f\":\"x\",\"a\":2,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x\",\"a\":1,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x\",\"a\":0,\"b\":1}");
        invalido("dorada", "{\"f\":\"x\",\"a\":0,\"b\":1,\"objetivo\":\"mínimo\"}");
        invalido("dorada", "{\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x\",\"a\":\"0\",\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x\",\"a\":null,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x\",\"a\":0,\"b\":1e13,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"y\",\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"sqrt(x)\",\"a\":-2,\"b\":-1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"java.lang.System.exit(0)\",\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":\"x;rm\",\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
        invalido("dorada", "{\"f\":5,\"a\":0,\"b\":1,\"objetivo\":\"min\"}");
    }

    // ---------------------------------------------------------------- Newton
    @Test void newtonCubicaDesdeCuatroLlegaAlMinimoLocalEnTres() throws Exception {
        var s = r("newton", "{\"f\":\"x^3-6x^2+9x+1\",\"x0\":4}");
        assertThat(num(s.resultado(), "x")).isCloseTo(3, within(1e-6));
        assertThat(num(s.resultado(), "fx")).isCloseTo(1, within(1e-9));
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
        assertThat(s.estado()).isEqualTo("estacionario");
    }
    @Test void newtonParabolaConvergeEnUnPasoYRegistraLaTabla() throws Exception {
        var s = r("newton", "{\"f\":\"(x-3)^2+2\",\"x0\":0}");
        var primera = mapa(lista(s.resultado().get("iteraciones")).get(0));
        assertThat(primera.keySet()).containsExactly("x", "fx", "d1", "d2");
        assertThat(num(primera, "x")).isEqualTo(0); assertThat(num(primera, "fx")).isCloseTo(11, within(1e-9));
        assertThat(num(primera, "d1")).isCloseTo(-6, within(1e-6)); assertThat(num(primera, "d2")).isCloseTo(2, within(1e-6));
        assertThat(num(s.resultado(), "x")).isCloseTo(3, within(1e-8));
    }
    @Test void newtonClasificaMaximoInflexionYPuntosPlanos() throws Exception {
        assertThat(r("newton", "{\"f\":\"-x^2\",\"x0\":2}").resultado().get("tipo")).isEqualTo("maximo");
        assertThat(r("newton", "{\"f\":\"x^3\",\"x0\":0}").resultado().get("tipo")).isEqualTo("inflexion");
        assertThat(r("newton", "{\"f\":\"x^4\",\"x0\":0}").resultado().get("tipo")).isEqualTo("minimo");
        assertThat(r("newton", "{\"f\":\"-x^4\",\"x0\":0}").resultado().get("tipo")).isEqualTo("maximo");
        assertThat(r("newton", "{\"f\":\"x^5\",\"x0\":0}").resultado().get("tipo")).isEqualTo("inflexion");
        assertThat(r("newton", "{\"f\":\"x^3+x^4\",\"x0\":0}").resultado().get("tipo")).isEqualTo("inflexion");
        assertThat(r("newton", "{\"f\":\"x^6\",\"x0\":0}").resultado().get("tipo")).isEqualTo("minimo");
    }
    @Test void newtonConFuncionesTrascendentes() throws Exception {
        var s = r("newton", "{\"f\":\"cos(x)\",\"x0\":3}");
        assertThat(num(s.resultado(), "x")).isCloseTo(Math.PI, within(1e-6));
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
        var e = r("newton", "{\"f\":\"exp(x)-2x\",\"x0\":0}");
        assertThat(num(e.resultado(), "x")).isCloseTo(Math.log(2), within(1e-6));
    }
    @Test void newtonConvergeLinealmenteEnRaicesMultiples() throws Exception {
        var s = r("newton", "{\"f\":\"x^4\",\"x0\":1}");
        assertThat(Math.abs(num(s.resultado(), "x"))).isLessThan(1e-3);
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
    }
    @Test void newtonFuncionConstanteNoEsConcluyente() throws Exception {
        var s = r("newton", "{\"f\":\"5\",\"x0\":2}");
        assertThat(s.resultado().get("tipo")).isEqualTo("no_concluyente");
        assertThat(s.advertencias()).anyMatch(a -> a.contains("concluyente"));
    }
    @Test void newtonAdviertePuntoFueraDelIntervalo() throws Exception {
        assertThat(r("newton", "{\"f\":\"(x-3)^2\",\"x0\":0,\"a\":0,\"b\":2}").advertencias()).anyMatch(a -> a.contains("fuera del intervalo"));
        assertThat(r("newton", "{\"f\":\"(x-3)^2\",\"x0\":0,\"a\":0,\"b\":5}").advertencias()).noneMatch(a -> a.contains("fuera del intervalo"));
    }
    @Test void newtonDetectaDivergenciaYEntradasInvalidas() {
        invalido("newton", "{\"f\":\"x\",\"x0\":0}");                 // lineal: segunda derivada nula
        invalido("newton", "{\"f\":\"exp(x)\",\"x0\":0}");            // sin punto estacionario: avanza a pasos de 1
        invalido("newton", "{\"f\":\"1/x\",\"x0\":1}");               // diverge
        invalido("newton", "{\"f\":\"log(x)\",\"x0\":-1}");           // fuera del dominio
        invalido("newton", "{\"f\":\"x^2\"}");
        invalido("newton", "{\"f\":\"x^2\",\"x0\":\"1\"}");
        invalido("newton", "{\"f\":\"x^2\",\"x0\":1,\"a\":0}");
        invalido("newton", "{\"f\":\"x^2\",\"x0\":1,\"a\":3,\"b\":2}");
        invalido("newton", "{\"f\":\"x^2+z\",\"x0\":1}");
        invalido("newton", "{\"f\":\"x^2; DROP TABLE\",\"x0\":1}");
    }

    // ---------------------------------------------------------------- Lagrange
    @Test void lagrangeProductoSobreLaRectaDaCincoCinco() throws Exception {
        var s = r("lagrange", "{\"f\":\"x*y\",\"g\":\"x+y\",\"c\":10}");
        assertThat(num(s.resultado(), "x")).isCloseTo(5, within(1e-6));
        assertThat(num(s.resultado(), "y")).isCloseTo(5, within(1e-6));
        assertThat(num(s.resultado(), "lambda")).isCloseTo(5, within(1e-6));
        assertThat(num(s.resultado(), "fxy")).isCloseTo(25, within(1e-6));
        assertThat(s.resultado().get("tipo")).isEqualTo("maximo");
        assertThat(s.estado()).isEqualTo("estacionario");
        assertThat(lista(s.resultado().get("puntos"))).hasSize(1);
    }
    @Test void lagrangeMinimoSobreUnaRecta() throws Exception {
        var s = r("lagrange", "{\"f\":\"x^2+y^2\",\"g\":\"x+y\",\"c\":2}");
        assertThat(num(s.resultado(), "x")).isCloseTo(1, within(1e-6));
        assertThat(num(s.resultado(), "lambda")).isCloseTo(2, within(1e-6));
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
    }
    @Test void lagrangeDevuelveTodosLosPuntosEstacionarios() throws Exception {
        var s = r("lagrange", "{\"f\":\"x+y\",\"g\":\"x^2+y^2\",\"c\":2}");
        var puntos = lista(s.resultado().get("puntos"));
        assertThat(puntos).hasSize(2);
        var maximo = puntos.stream().map(NoLinealSolverTest::mapa).filter(p -> p.get("tipo").equals("maximo")).findFirst().orElseThrow();
        var minimo = puntos.stream().map(NoLinealSolverTest::mapa).filter(p -> p.get("tipo").equals("minimo")).findFirst().orElseThrow();
        assertThat(num(maximo, "x")).isCloseTo(1, within(1e-6)); assertThat(num(maximo, "y")).isCloseTo(1, within(1e-6)); assertThat(num(maximo, "lambda")).isCloseTo(0.5, within(1e-6));
        assertThat(num(minimo, "x")).isCloseTo(-1, within(1e-6)); assertThat(num(minimo, "lambda")).isCloseTo(-0.5, within(1e-6));
        assertThat(s.advertencias()).anyMatch(a -> a.contains("2 puntos"));
        assertThat(Math.abs(num(s.resultado(), "x"))).isCloseTo(1, within(1e-6));
    }
    @Test void lagrangeRechazaSistemasSinSolucionOEntradasInvalidas() {
        invalido("lagrange", "{\"f\":\"x*y\",\"g\":\"0\",\"c\":10}");
        invalido("lagrange", "{\"f\":\"x*y\",\"g\":\"x^2+y^2\",\"c\":-1}");
        invalido("lagrange", "{\"f\":\"x*y\",\"g\":\"x+y\"}");
        invalido("lagrange", "{\"f\":\"x*y\",\"c\":1}");
        invalido("lagrange", "{\"f\":\"x*z\",\"g\":\"x+y\",\"c\":1}");
        invalido("lagrange", "{\"f\":\"x*y\",\"g\":\"x+y\",\"c\":\"10\"}");
        invalido("lagrange", "{\"f\":\"x*y\",\"g\":\"x+y;1\",\"c\":10}");
    }

    // ---------------------------------------------------------------- multivariable
    @Test void multivariableMinimoCuadratico() throws Exception {
        var s = r("multivariable", "{\"f\":\"x^2+y^2-4x-6y\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,0]}");
        var punto = mapa(s.resultado().get("punto"));
        assertThat(punto.keySet()).containsExactly("x", "y");
        assertThat(num(punto, "x")).isCloseTo(2, within(1e-7)); assertThat(num(punto, "y")).isCloseTo(3, within(1e-7));
        assertThat(num(s.resultado(), "fx")).isCloseTo(-13, within(1e-8));
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
        assertThat(lista(s.resultado().get("autovalores"))).allSatisfy(l -> assertThat(((Number) l).doubleValue()).isCloseTo(2, within(1e-5)));
        assertThat(lista(s.resultado().get("hessiano"))).hasSize(2);
        assertThat(mapa(lista(s.resultado().get("iteraciones")).get(0)).keySet()).containsExactly("k", "x", "y", "f", "normaGradiente");
        assertThat(s.estado()).isEqualTo("estacionario");
    }
    @Test void multivariablePuntoSillaYMaximo() throws Exception {
        var silla = r("multivariable", "{\"f\":\"x^2-y^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[1,1]}");
        assertThat(silla.resultado().get("tipo")).isEqualTo("silla");
        var punto = mapa(silla.resultado().get("punto"));
        assertThat(num(punto, "x")).isCloseTo(0, within(1e-7)); assertThat(num(punto, "y")).isCloseTo(0, within(1e-7));
        var max = r("multivariable", "{\"f\":\"-(x-1)^2-(y+2)^2-(z-3)^2\",\"simbolos\":[\"x\",\"y\",\"z\"],\"inicio\":[0,0,0]}");
        assertThat(max.resultado().get("tipo")).isEqualTo("maximo");
        var p = mapa(max.resultado().get("punto"));
        assertThat(num(p, "x")).isCloseTo(1, within(1e-7)); assertThat(num(p, "y")).isCloseTo(-2, within(1e-7)); assertThat(num(p, "z")).isCloseTo(3, within(1e-7));
    }
    @Test void multivariableNoCuadraticaYUnaVariable() throws Exception {
        var s = r("multivariable", "{\"f\":\"exp(x)-2x+y^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,1]}");
        var p = mapa(s.resultado().get("punto"));
        assertThat(num(p, "x")).isCloseTo(Math.log(2), within(1e-6)); assertThat(num(p, "y")).isCloseTo(0, within(1e-6));
        assertThat(s.resultado().get("tipo")).isEqualTo("minimo");
        var uno = r("multivariable", "{\"f\":\"t^2-4t\",\"simbolos\":[\"t\"],\"inicio\":[10]}");
        assertThat(num(mapa(uno.resultado().get("punto")), "t")).isCloseTo(2, within(1e-7));
        var cuatro = r("multivariable", "{\"f\":\"(a-1)^2+(b-2)^2+(c-3)^2+(d-4)^2+a*b\",\"simbolos\":[\"a\",\"b\",\"c\",\"d\"],\"inicio\":[0,0,0,0]}");
        assertThat(num(mapa(cuatro.resultado().get("punto")), "d")).isCloseTo(4, within(1e-6));
    }
    @Test void multivariableConHessianoSingularEnElPuntoEstacionarioNoEsConcluyente() throws Exception {
        assertThat(r("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,0]}").resultado().get("tipo")).isEqualTo("no_concluyente");
    }
    @Test void multivariableAdviertePorObjetivoQueNoCoincide() throws Exception {
        var s = r("multivariable", "{\"f\":\"x^2+y^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[1,1],\"objetivo\":\"max\"}");
        assertThat(s.advertencias()).anyMatch(a -> a.contains("máximo"));
        assertThat(r("multivariable", "{\"f\":\"x^2+y^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[1,1],\"objetivo\":\"min\"}").advertencias()).noneMatch(a -> a.contains("Se pidió"));
    }
    @Test void multivariableRechazaEntradasInvalidas() {
        invalido("multivariable", "{\"f\":\"a+b+c+d+e1\",\"simbolos\":[\"a\",\"b\",\"c\",\"d\",\"e1\"],\"inicio\":[0,0,0,0,0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[],\"inicio\":[]}");
        invalido("multivariable", "{\"f\":\"x^2+y^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"x\",\"x\"],\"inicio\":[0,0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"sin\"],\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"1x\"],\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":\"x\",\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"x^2+y^2\",\"simbolos\":[\"x\"],\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"x\"],\"inicio\":[\"0\"]}");
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"x\"],\"inicio\":[0],\"objetivo\":\"maximo\"}");
        invalido("multivariable", "{\"f\":\"x+y\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,0]}");          // Hessiano nulo
        invalido("multivariable", "{\"f\":\"x^2\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[1,0]}");          // Hessiano singular lejos del estacionario
        invalido("multivariable", "{\"f\":\"java.lang.Runtime.getRuntime()\",\"simbolos\":[\"x\"],\"inicio\":[0]}");
        invalido("multivariable", "{\"f\":\"log(x)\",\"simbolos\":[\"x\"],\"inicio\":[-1]}");
    }

    // ---------------------------------------------------------------- generales
    @Test void rechazaMetodoDesconocidoDatosNulosYNoObjetos() {
        assertThatThrownBy(() -> NoLinealSolver.resolver("simplex", json.readTree("{}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> NoLinealSolver.resolver(null, json.readTree("{}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> NoLinealSolver.resolver("dorada", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> NoLinealSolver.resolver("dorada", json.readTree("[1,2]"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> NoLinealSolver.resolver("newton", json.nullNode())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void ignoraClavesAjenasYAceptaOpcionalesNulos() throws Exception {
        var s = r("newton", "{\"f\":\"(x-1)^2\",\"x0\":5,\"a\":null,\"b\":null,\"solucion\":42,\"__proto__\":\"x\"}");
        assertThat(num(s.resultado(), "x")).isCloseTo(1, within(1e-6));
    }
    @Test void formulaGrandeSeEvaluaRapido() throws Exception {
        String larga = "x*x+".repeat(100) + "1";                      // ~400 caracteres
        long t0 = System.nanoTime();
        var s = r("dorada", "{\"f\":\"" + larga + "\",\"a\":-3,\"b\":4,\"objetivo\":\"min\"}");
        assertThat(num(s.resultado(), "x")).isCloseTo(0, within(1e-5));
        assertThat((System.nanoTime() - t0) / 1e9).isLessThan(5.0);
    }
}
