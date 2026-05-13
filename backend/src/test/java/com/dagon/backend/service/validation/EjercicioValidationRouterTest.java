package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EjercicioValidationRouterTest {

    private final EjercicioValidationRouter router = new EjercicioValidationRouter(List.of(
            new ValidadorSelect(),
            new ValidadorDml(),
            new ValidadorDdl(),
            new ValidadorDiagrama(),
            new ValidadorTransaccion(),
            new ValidadorPracticaRapida(),
            new ValidadorTextual()
    ));

    @Test
    void resuelveValidadoresPorTipo() {
        assertThat(router.resolverTipo(ejercicio(null, null, null), "SELECT * FROM alumnos;"))
                .isEqualTo(TipoValidacionEjercicio.SELECT);
        assertThat(router.resolverTipo(ejercicio(null, null, null), "UPDATE alumnos SET nombre = 'Ana';"))
                .isEqualTo(TipoValidacionEjercicio.DML);
        assertThat(router.resolverTipo(ejercicio(null, null, null), "CREATE TABLE prueba(id int);"))
                .isEqualTo(TipoValidacionEjercicio.DDL);
        assertThat(router.resolverTipo(ejercicio("diagram", null, null), "{\"nodes\":[],\"edges\":[]}"))
                .isEqualTo(TipoValidacionEjercicio.DIAGRAMA);
        assertThat(router.resolverTipo(ejercicio(null, "RAPIDA", null), "SELECT 1;"))
                .isEqualTo(TipoValidacionEjercicio.PRACTICA_RAPIDA);
        assertThat(router.resolverTipo(ejercicio(null, null, "{\"tipo_validacion\":\"TEXTUAL\"}"), "DROP TABLE demo;"))
                .isEqualTo(TipoValidacionEjercicio.TEXTUAL);
    }

    @Test
    void prevalidacionBloqueaMutacionesASchemasInternos() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null),
                "DROP TABLE lms_core.usuarios;",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("success")).isEqualTo(false);
        assertThat(error.get().get("message").toString()).contains("Interferencia");
    }

    @Test
    void prevalidacionDetectaDiagramaJsonInvalido() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio("diagram", null, null),
                "{ no-es-json",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("diagrama");
    }

    private EjercicioPractico ejercicio(String formato, String tipoMision, String configuracionExtra) {
        EjercicioPractico ejercicio = new EjercicioPractico();
        ejercicio.setFormato(formato);
        ejercicio.setTipoMision(tipoMision);
        ejercicio.setConfiguracionExtra(configuracionExtra);
        ejercicio.setQueryMaestra("SELECT 1;");
        ejercicio.setEnunciado("Consulta de prueba");
        return ejercicio;
    }
}
