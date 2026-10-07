package com.dagon.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocenteMisionNumericaTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void normalizaCamposRespuestasFraccionesYTolerancia() throws Exception {
        String salida = DocenteService.normalizarMisionNumerica("""
                {"campos":[{"clave":"z","etiqueta":"Z óptima","tipo":"numero","extra":1},
                           {"clave":"metodo","etiqueta":"Método","tipo":"opcion","opciones":["simplex","gráfico"]}],
                 "respuestas":{"z":"36","metodo":"simplex"},"tolerancia":{"abs":0.01,"rel":0.001},"script":"<x>"}
                """);
        var nodo = json.readTree(salida);
        assertThat(nodo.path("tipo_validacion").asText()).isEqualTo("NUMERICO");
        assertThat(nodo.path("respuestas").path("z").asDouble()).isEqualTo(36.0);
        assertThat(nodo.path("campos").get(0).has("extra")).isFalse();
        assertThat(nodo.has("script")).isFalse();
        assertThat(DocenteService.normalizarMisionNumerica("{\"campos\":[{\"clave\":\"p\",\"etiqueta\":\"P\"}],\"respuestas\":{\"p\":\"3/4\"}}"))
                .contains("\"p\":0.75");
    }

    @Test
    void rechazaConfiguracionesIncompletasOInconsistentes() {
        for (String malo : new String[]{
                null,
                "no es json",
                "{\"campos\":[],\"respuestas\":{}}",
                "{\"campos\":[{\"clave\":\"z\",\"etiqueta\":\"Z\"}],\"respuestas\":{}}",
                "{\"campos\":[{\"clave\":\"z\",\"etiqueta\":\"Z\"}],\"respuestas\":{\"z\":\"abc\"}}",
                "{\"campos\":[{\"clave\":\"z\",\"etiqueta\":\"Z\"}],\"respuestas\":{\"z\":1,\"w\":2}}",
                "{\"campos\":[{\"clave\":\"m\",\"etiqueta\":\"M\",\"tipo\":\"opcion\",\"opciones\":[\"a\",\"b\"]}],\"respuestas\":{\"m\":\"c\"}}",
                "{\"campos\":[{\"clave\":\"1z\",\"etiqueta\":\"Z\"}],\"respuestas\":{\"1z\":1}}",
                "{\"campos\":[{\"clave\":\"z\",\"etiqueta\":\"Z\"}],\"respuestas\":{\"z\":1},\"tolerancia\":{\"rel\":5}}",
        }) {
            assertThatThrownBy(() -> DocenteService.normalizarMisionNumerica(malo)).as(String.valueOf(malo)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
