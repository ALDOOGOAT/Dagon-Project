package com.dagon.backend.service.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ValidadorNumericoTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final String CONFIG = """
            {"tipo_validacion":"NUMERICO",
             "campos":[{"clave":"z","etiqueta":"Z óptimo","tipo":"numero","unidad":"$"},
                       {"clave":"entra","etiqueta":"Variable que entra","tipo":"opcion","opciones":["x1","x2","s1"]}],
             "respuestas":{"z":36,"entra":"x2"},
             "tolerancia":{"abs":0.01,"rel":0.001}}
            """;

    private static JsonNode json(String texto) {
        try {
            return MAPPER.readTree(texto);
        } catch (Exception e) {
            throw new IllegalArgumentException(e);
        }
    }

    private static ValidadorNumerico.Resultado evaluar(String config, String respuesta) {
        return ValidadorNumerico.evaluar(json(config), json(respuesta));
    }

    @Test
    void aceptaRespuestaExactaYMarcaCadaCampo() {
        var r = evaluar(CONFIG, "{\"z\":36,\"entra\":\"x2\"}");

        assertThat(r.correcto()).isTrue();
        assertThat(r.campos()).containsOnly(java.util.Map.entry("z", true), java.util.Map.entry("entra", true));
    }

    @Test
    void numeroFueraDeToleranciaMarcaSoloEseCampo() {
        var r = evaluar(CONFIG, "{\"z\":40,\"entra\":\"x2\"}");

        assertThat(r.correcto()).isFalse();
        assertThat(r.campos()).containsEntry("z", false).containsEntry("entra", true);
    }

    @Test
    void toleranciaAbsolutaPorDefectoEsUnaCentesima() {
        String config = "{\"respuestas\":{\"z\":2}}";

        assertThat(evaluar(config, "{\"z\":2.01}").correcto()).isTrue();
        assertThat(evaluar(config, "{\"z\":2.02}").correcto()).isFalse();
    }

    @Test
    void toleranciaRelativaPermiteErrorProporcionalEnValoresGrandes() {
        String config = "{\"respuestas\":{\"costo\":10000}}";

        // rel por defecto 0.001 -> 10 unidades; abs 0.01 queda por debajo
        assertThat(evaluar(config, "{\"costo\":10009.9}").correcto()).isTrue();
        assertThat(evaluar(config, "{\"costo\":10011}").correcto()).isFalse();
    }

    @Test
    void usaLaToleranciaDeLaConfiguracion() {
        String config = "{\"respuestas\":{\"z\":100},\"tolerancia\":{\"abs\":5,\"rel\":0}}";

        assertThat(evaluar(config, "{\"z\":104.9}").correcto()).isTrue();
        assertThat(evaluar(config, "{\"z\":105.1}").correcto()).isFalse();
    }

    @Test
    void aceptaFraccionComaDecimalYEspacios() {
        assertThat(evaluar("{\"respuestas\":{\"p\":0.75}}", "{\"p\":\"3/4\"}").correcto()).isTrue();
        assertThat(evaluar("{\"respuestas\":{\"p\":0.75}}", "{\"p\":\" 3 / 4 \"}").correcto()).isTrue();
        assertThat(evaluar("{\"respuestas\":{\"p\":2.5}}", "{\"p\":\"2,5\"}").correcto()).isTrue();
        assertThat(evaluar("{\"respuestas\":{\"p\":2.5}}", "{\"p\":\" 2.5 \"}").correcto()).isTrue();
        assertThat(evaluar("{\"respuestas\":{\"p\":-0.5}}", "{\"p\":\"-1/2\"}").correcto()).isTrue();
    }

    @Test
    void respuestaEsperadaComoFraccionTambienSeCompara() {
        assertThat(evaluar("{\"respuestas\":{\"p\":\"1/3\"}}", "{\"p\":0.3333}").correcto()).isTrue();
    }

    @Test
    void textosIgnoranMayusculasYEspacios() {
        assertThat(evaluar(CONFIG, "{\"z\":36,\"entra\":\"  X2 \"}").correcto()).isTrue();
        assertThat(evaluar(CONFIG, "{\"z\":36,\"entra\":\"x 2\"}").correcto()).isTrue();
        assertThat(evaluar(CONFIG, "{\"z\":36,\"entra\":\"x1\"}").campos()).containsEntry("entra", false);
    }

    @Test
    void campoFaltanteONuloCuentaComoIncorrecto() {
        var faltante = evaluar(CONFIG, "{\"z\":36}");
        assertThat(faltante.correcto()).isFalse();
        assertThat(faltante.campos()).containsEntry("z", true).containsEntry("entra", false);

        assertThat(evaluar(CONFIG, "{\"z\":null,\"entra\":\"x2\"}").campos()).containsEntry("z", false);
    }

    @Test
    void textoNoNumericoEnCampoNumericoEsIncorrectoSinLanzar() {
        assertThat(evaluar(CONFIG, "{\"z\":\"abc\",\"entra\":\"x2\"}").campos()).containsEntry("z", false);
        assertThat(evaluar(CONFIG, "{\"z\":\"1/0\",\"entra\":\"x2\"}").campos()).containsEntry("z", false);
        assertThat(evaluar(CONFIG, "{\"z\":\"NaN\",\"entra\":\"x2\"}").campos()).containsEntry("z", false);
        assertThat(evaluar(CONFIG, "{\"z\":[36],\"entra\":{\"a\":1}}").correcto()).isFalse();
    }

    @Test
    void camposQueNoEstanEnLasRespuestasSeIgnoran() {
        var r = evaluar(CONFIG, "{\"z\":36,\"entra\":\"x2\",\"extra\":\"basura\"}");

        assertThat(r.correcto()).isTrue();
        assertThat(r.campos()).doesNotContainKey("extra");
    }

    @Test
    void sinRespuestasConfiguradasNuncaEsCorrecto() {
        assertThat(evaluar("{\"tipo_validacion\":\"NUMERICO\"}", "{\"z\":1}").correcto()).isFalse();
        assertThat(evaluar("{\"respuestas\":{}}", "{\"z\":1}").correcto()).isFalse();
        assertThat(ValidadorNumerico.evaluar(null, json("{\"z\":1}")).correcto()).isFalse();
        assertThat(ValidadorNumerico.evaluar(json(CONFIG), null).correcto()).isFalse();
    }

    @Test
    void noAceptaNumerosQueDesbordanNiToleranciasInfinitas() {
        assertThat(evaluar("{\"respuestas\":{\"z\":36}}", "{\"z\":1e400}").correcto()).isFalse();
        assertThat(evaluar("{\"respuestas\":{\"z\":36},\"tolerancia\":{\"abs\":1e400}}", "{\"z\":99999}").correcto()).isFalse();
        assertThat(evaluar("{\"respuestas\":{\"z\":1e400}}", "{\"z\":36}").correcto()).isFalse();
    }

    @Test
    void todosLosCamposDebenCoincidir() {
        var r = evaluar(CONFIG, "{\"z\":35,\"entra\":\"s1\"}");

        assertThat(r.correcto()).isFalse();
        assertThat(r.campos()).containsEntry("z", false).containsEntry("entra", false);
    }

    @Test
    void prevalidarExigeObjetoJsonNoVacio() {
        var validador = new ValidadorNumerico();

        assertThat(validador.soporta(TipoValidacionEjercicio.NUMERICO)).isTrue();
        assertThat(validador.soporta(TipoValidacionEjercicio.SELECT)).isFalse();
        assertThat(validador.prevalidar(contexto("{\"z\":1}"))).isEmpty();
        assertThat(validador.prevalidar(contexto("{}"))).isPresent();
        assertThat(validador.prevalidar(contexto("[1,2]"))).isPresent();
        assertThat(validador.prevalidar(contexto("no es json"))).isPresent();
        assertThat(validador.prevalidar(contexto("   "))).isPresent();
        assertThat(validador.prevalidar(contexto(null))).isPresent();
    }

    private static ContextoValidacionEjercicio contexto(String query) {
        return new ContextoValidacionEjercicio(null, query, "u1", TipoValidacionEjercicio.NUMERICO);
    }
}
