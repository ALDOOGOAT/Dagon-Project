package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class IoModeloValidatorTest {
    private final ObjectMapper json = new ObjectMapper();
    private final IoModeloValidator validator = new IoModeloValidator();
    private final String enunciado = "Datos proporcionados por el alumno para este modelo.";
    private IoInterpretacion modelo(String tipo, String metodo, String datos) throws Exception {
        ObjectNode m = json.createObjectNode().put("tipo", tipo).put("metodo", metodo);
        m.set("datos", json.readTree(datos)); m.set("variables", json.createArrayNode());
        m.set("evidencias", json.readTree("[{\"campo\":\"datos\",\"texto\":\"Datos proporcionados por el alumno\"}]"));
        return new IoInterpretacion("listo", "groq", "Modelo", m, List.of(), List.of(), List.of());
    }
    @Test void validaLosOchoTiposYEliminaCamposAjenoAlContrato() throws Exception {
        var casos = List.of(
                modelo("pl", "simplex", "{\"objetivo\":\"max z=3x1+5x2\",\"restricciones\":[\"x1<=4\",\"x1,x2>=0\"]}"),
                modelo("transporte", "vogel", "{\"costos\":[[1,2],[2,3]],\"oferta\":[5,5],\"demanda\":[4,6],\"solucion\":123}"),
                modelo("asignacion", "hungaro", "{\"matriz\":[[1,2],[2,1]],\"objetivo\":\"min\"}"),
                modelo("redes", "cpm", "{\"actividades\":[{\"id\":\"A\",\"predecesoras\":[],\"duracion\":3,\"respuesta\":10}],\"plazo\":8}"),
                modelo("inventarios", "eoq", "{\"D\":1200,\"S\":50,\"H\":2,\"P\":10000}"),
                modelo("colas", "mm1", "{\"lambda\":10,\"mu\":15,\"s\":1}"),
                modelo("markov", "discreto", "{\"P\":[[0.8,0.2],[0.1,0.9]],\"inicial\":[1,0],\"n\":3}"),
                modelo("noLineal", "dorada", "{\"f\":\"x^2-4*x\",\"a\":0,\"b\":5,\"objetivo\":\"min\"}"));
        for (var caso : casos) assertThat(validator.validar(caso, enunciado).estado()).as(caso.modelo().path("tipo").asText()).isEqualTo("listo");
        assertThat(validator.validar(casos.get(1), enunciado).modelo().path("datos").has("solucion")).isFalse();
        assertThat(validator.validar(casos.get(3), enunciado).modelo().path("datos").has("plazo")).isFalse();
        assertThat(validator.validar(casos.get(4), enunciado).modelo().path("datos").has("P")).isFalse();
        assertThat(validator.validar(casos.get(5), enunciado).modelo().path("datos").has("s")).isFalse();
    }
    @Test void rechazaDimensionesNoFinitosColasInestablesYCostosParciales() throws Exception {
        for (var caso : List.of(
                modelo("transporte", "vogel", "{\"costos\":[[1,2]],\"oferta\":[5,5],\"demanda\":[4,6]}"),
                modelo("inventarios", "eoq", "{\"D\":1e400,\"S\":50,\"H\":2}"),
                modelo("colas", "mm1", "{\"lambda\":15,\"mu\":10}"),
                modelo("colas", "mm1", "{\"lambda\":10,\"mu\":15,\"cs\":10}"),
                modelo("markov", "discreto", "{\"P\":[[0.8,0.3],[0.1,0.9]],\"inicial\":[1,0],\"n\":3}"),
                modelo("redes", "cpm", "{\"actividades\":[{\"id\":\"A\",\"predecesoras\":[\"B\"],\"duracion\":3}]}"))) {
            var r = validator.validar(caso, enunciado); assertThat(r.estado()).isEqualTo("incompleto"); assertThat(r.modelo()).isNull();
        }
    }
    @Test void noPermiteInventarEvidenciasNiEjecutarFunciones() throws Exception {
        var e = modelo("inventarios", "eoq", "{\"D\":1200,\"S\":50,\"H\":2}");
        ((ObjectNode)e.modelo()).set("evidencias", json.readTree("[{\"campo\":\"datos\",\"texto\":\"Cita inventada\"}]"));
        assertThat(validator.validar(e, enunciado).estado()).isEqualTo("incompleto");
        var p = modelo("noLineal", "newton", "{\"f\":\"import(x)\",\"x0\":1}");
        assertThat(validator.validar(p, enunciado).estado()).isEqualTo("incompleto");
    }
    @Test void camposOpcionalesNullDelSchemaEstrictoSeEliminanAntesDelAdaptador() throws Exception {
        var r = validator.validar(modelo("colas", "mm1", "{\"lambda\":10,\"mu\":15,\"s\":null,\"cs\":null,\"cw\":null}"), enunciado);
        assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("datos").has("cs")).isFalse(); assertThat(r.modelo().path("datos").has("cw")).isFalse();
        var n = validator.validar(modelo("noLineal", "newton", "{\"f\":\"x^2-4*x\",\"x0\":1,\"a\":null,\"b\":null}"), enunciado);
        assertThat(n.estado()).isEqualTo("listo");
    }
    @Test void evidenciaObjetivoConceptualDebeSerLiteralYMetodoSigueValidadoEnRuntime() throws Exception {
        var m = modelo("transporte", "costo_minimo", "{\"costos\":[[1,2],[2,1]],\"oferta\":[5,5],\"demanda\":[5,5]}");
        ((ObjectNode)m.modelo()).set("evidencias", json.readTree("[{\"campo\":\"objetivo\",\"texto\":\"Minimizar el costo de transporte\"}]"));
        assertThat(validator.validar(m, "Minimizar el costo de transporte con los datos dados.").estado()).isEqualTo("listo");
        assertThat(validator.validar(m, "Enunciado sin esa frase literal.").estado()).isEqualTo("incompleto");
        ((ObjectNode)m.modelo()).put("metodo", "inventado");
        assertThat(validator.validar(m, "Minimizar el costo de transporte con los datos dados.").estado()).isEqualTo("incompleto");
    }
    @Test void parserLinealRechazaNoLinealYConservaFracciones() {
        assertThat(IoExpresionLineal.parsear("3/4*x1+2*(x2+1)").coeficientes()).containsEntry("x1", 0.75).containsEntry("x2", 2.0);
        assertThatThrownBy(() -> IoExpresionLineal.parsear("(x1+x2)*(x1+1)")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresionLineal.parsear("x1/x2")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresionLineal.parsear("1e400*x1")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void contratoAmpliadoAceptaEnterosCuadraticaGrafosDecisionesJuegosYMultivariable() throws Exception {
        var casos = List.of(
                modelo("pl", "branch_bound", "{\"objetivo\":\"max z=5x1+8x2\",\"restricciones\":[\"x1+x2<=6\",\"5x1+9x2<=45\",\"x1,x2>=0\"],\"enteras\":[\"x1\",\"x2\"],\"binarias\":null}"),
                modelo("pl", "simplex", "{\"objetivo\":\"max z=8y1+11y2\",\"restricciones\":[\"5y1+7y2<=14\",\"y1,y2 binarias\"]}"),
                modelo("cuadratica", "kkt", "{\"objetivo\":\"max z=15x1+30x2+4x1*x2-2x1^2-4x2^2\",\"restricciones\":[\"x1+2x2<=30\",\"x1,x2>=0\"]}"),
                modelo("grafos", "ruta_corta", "{\"aristas\":[{\"origen\":\"A\",\"destino\":\"B\",\"valor\":2,\"extra\":1}],\"origen\":\"A\",\"destino\":\"B\",\"dirigido\":null}"),
                modelo("grafos", "arbol_minimo", "{\"aristas\":[{\"origen\":\"A\",\"destino\":\"B\",\"valor\":2}],\"origen\":null,\"destino\":null,\"dirigido\":null}"),
                modelo("decisiones", "riesgo", "{\"pagos\":[[50,20],[30,25]],\"objetivo\":\"max\",\"probabilidades\":[0.4,0.6],\"alternativas\":[\"Grande\",\"Chica\"],\"estados\":null,\"alfa\":null}"),
                modelo("decisiones", "incertidumbre", "{\"pagos\":[[50,20],[30,25]],\"objetivo\":\"max\",\"alfa\":0.6,\"probabilidades\":null}"),
                modelo("juegos", "suma_cero", "{\"pagos\":[[2,-3],[-1,4]],\"filas\":null,\"columnas\":null}"),
                modelo("noLineal", "multivariable", "{\"f\":\"x^2+y^2-4*x\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,0],\"objetivo\":\"min\"}"));
        for (var caso : casos) assertThat(validator.validar(caso, enunciado).estado()).as(caso.modelo().path("tipo").asText() + "/" + caso.modelo().path("metodo").asText()).isEqualTo("listo");
        assertThat(validator.validar(casos.get(3), enunciado).modelo().path("datos").path("aristas").get(0).has("extra")).isFalse();
        assertThat(validator.validar(casos.get(5), enunciado).modelo().path("datos").has("alfa")).isFalse();
    }
    @Test void contratoAmpliadoRechazaModelosInconsistentes() throws Exception {
        for (var caso : List.of(
                modelo("pl", "branch_bound", "{\"objetivo\":\"max z=x1\",\"restricciones\":[\"x1<=3\",\"x1>=0\"]}"),
                modelo("pl", "simplex", "{\"objetivo\":\"max z=x1\",\"restricciones\":[\"x1<=3\",\"x1>=0\"],\"enteras\":[\"x9\"]}"),
                modelo("grafos", "ruta_corta", "{\"aristas\":[{\"origen\":\"A\",\"destino\":\"B\",\"valor\":-2}],\"origen\":\"A\",\"destino\":\"B\"}"),
                modelo("grafos", "flujo_maximo", "{\"aristas\":[{\"origen\":\"A\",\"destino\":\"B\",\"valor\":2}],\"origen\":\"A\",\"destino\":\"Z\"}"),
                modelo("decisiones", "riesgo", "{\"pagos\":[[50,20],[30,25]],\"objetivo\":\"max\",\"probabilidades\":[0.4,0.4]}"),
                modelo("noLineal", "multivariable", "{\"f\":\"x^2+w\",\"simbolos\":[\"x\",\"y\"],\"inicio\":[0,0]}"),
                modelo("cuadratica", "kkt", "{\"objetivo\":\"max z=x1^3\",\"restricciones\":[\"x1<=3\",\"x1>=0\"]}"),
                modelo("cuadratica", "kkt", "{\"objetivo\":\"max z=sin(x1)\",\"restricciones\":[\"x1<=3\",\"x1>=0\"]}"))) {
            assertThat(validator.validar(caso, enunciado).estado()).as(caso.modelo().toString()).isEqualTo("incompleto");
        }
    }
    @Test void citasToleranMayusculasYPuntuacionFinalPeroNoCifrasInventadas() {
        String enunciado = "Los beneficios son 8, 11, 6 y 4 millones; los costos son 5, 7, 4 y 3 millones.";
        assertThat(enunciado.toLowerCase().contains(IoModeloValidator.normalizarCita("Los costos son 5, 7, 4 y 3 millones."))).isTrue();
        assertThat(IoModeloValidator.normalizarCita(enunciado).contains(IoModeloValidator.normalizarCita("Los costos son 5, 7, 4 y 9 millones."))).isFalse();
    }
    @Test void enTiposSinFormulasSeOmitenSimbolosDescriptivosInvalidos() throws Exception {
        var m = modelo("juegos", "suma_cero", "{\"pagos\":[[2,-3],[-1,4]]}");
        ((ObjectNode) m.modelo()).set("variables", json.readTree("[{\"simbolo\":\"p(A1)\",\"nombre\":\"Prob. A1\"},{\"simbolo\":\"q1\",\"nombre\":\"Prob. B1\"}]"));
        var r = validator.validar(m, enunciado);
        assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("variables").size()).isEqualTo(1);
    }
    @Test void paráfrasisSinCifrasSeOmiteYConCifrasSeRechaza() throws Exception {
        var m = modelo("juegos", "suma_cero", "{\"pagos\":[[2,-3],[-1,4]]}");
        ((ObjectNode) m.modelo()).set("evidencias", json.readTree("[{\"campo\":\"datos\",\"texto\":\"Datos proporcionados por el alumno\"},{\"campo\":\"tipo\",\"texto\":\"Es un juego de suma cero\"}]"));
        var r = validator.validar(m, enunciado);
        assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("evidencias").size()).isEqualTo(1);
        assertThat(r.advertencias()).anyMatch(a -> a.contains("parafraseada"));
        ((ObjectNode) m.modelo()).set("evidencias", json.readTree("[{\"campo\":\"datos\",\"texto\":\"Los pagos son 2 y -3\"}]"));
        assertThat(validator.validar(m, enunciado).estado()).isEqualTo("incompleto");
    }
    @Test void citaParafraseadaConCifrasDelEnunciadoSeAcepta_perolaCifraInventadaSeRechaza() {
        String e = "Cada Frappuccino genera una utilidad de $50 y requiere 4 onzas de jarabe. Hay 120 onzas de jarabe.";
        assertThat(IoModeloValidator.cifrasContenidas("utilidad de 50 pesos por Frappuccino y 4 onzas", e)).isTrue();
        assertThat(IoModeloValidator.cifrasContenidas("hay un máximo de 120 onzas", e)).isTrue();
        assertThat(IoModeloValidator.cifrasContenidas("utilidad de 55 pesos", e)).isFalse();
    }
    @Test void citaParafraseadaConCifrasVerificadasSeConservaYSinCifrasNoSustenta() throws Exception {
        String e = "Cada Frappuccino genera una utilidad de $50 y requiere 4 onzas de jarabe. Hay 120 onzas de jarabe.";
        var m = modelo("pl", "simplex", "{\"objetivo\":\"max z=50x1\",\"restricciones\":[\"4x1<=120\",\"x1>=0\"]}");
        ((ObjectNode) m.modelo()).set("evidencias", json.readTree("[{\"campo\":\"datos.objetivo\",\"texto\":\"utilidad de 50 pesos por Frappuccino\"}]"));
        var r = validator.validar(m, e);
        assertThat(r.estado()).isEqualTo("listo");
        assertThat(r.modelo().path("evidencias").size()).isEqualTo(1);
        ((ObjectNode) m.modelo()).set("evidencias", json.readTree("[{\"campo\":\"datos.objetivo\",\"texto\":\"utilidad de 55 pesos por Frappuccino\"}]"));
        assertThat(validator.validar(m, e).estado()).isEqualTo("incompleto");
    }
}
