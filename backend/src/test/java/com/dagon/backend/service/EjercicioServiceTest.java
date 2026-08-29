package com.dagon.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EjercicioServiceTest {

    private final EjercicioService service = new EjercicioService();

    @Test
    void humanizaErrorDeSintaxis() {
        String crudo = "ERROR: syntax error at or near \"FORM\"\n  Position: 15";

        assertThat(service.humanizarErrorSql(crudo))
                .isEqualTo("Error de sintaxis cerca de \"FORM\". Revisa comas, paréntesis o palabras clave.");
    }

    @Test
    void humanizaTablaInexistente() {
        String crudo = "ERROR: relation \"usuarios_x\" does not exist\n  Position: 15";

        assertThat(service.humanizarErrorSql(crudo))
                .isEqualTo("La tabla \"usuarios_x\" no existe. Verifica el nombre o si aún no la creaste.");
    }

    @Test
    void dejaMensajesDesconocidosSinPrefijoDeError() {
        String crudo = "ERROR: algo raro pasó\n  Detail: nada más.";

        assertThat(service.humanizarErrorSql(crudo)).isEqualTo("algo raro pasó");
    }

    @Test
    void manejaMensajeNulo() {
        assertThat(service.humanizarErrorSql(null)).isEqualTo("Ocurrió un error al ejecutar la consulta.");
    }
}
