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
            new ValidadorDiagrama(new com.dagon.backend.service.ModelingService()),
            new ValidadorTransaccion(),
            new ValidadorPracticaRapida(),
            new ValidadorTextual()
    ));

    @Test
    void resuelveValidadoresPorTipo() {
        assertThat(router.resolverTipo(ejercicio(null, null, null, "SELECT * FROM alumnos;"), "SELECT * FROM alumnos;"))
                .isEqualTo(TipoValidacionEjercicio.SELECT);
        assertThat(router.resolverTipo(ejercicio(null, null, null, "UPDATE alumnos SET nombre = 'Ana';"), "SELECT * FROM alumnos;"))
                .isEqualTo(TipoValidacionEjercicio.DML);
        assertThat(router.resolverTipo(ejercicio(null, null, null, "CREATE TABLE prueba(id int);"), "SELECT * FROM alumnos;"))
                .isEqualTo(TipoValidacionEjercicio.DDL);
        assertThat(router.resolverTipo(ejercicio("diagram", null, null, "SELECT 1;"), "{\"nodes\":[],\"edges\":[]}"))
                .isEqualTo(TipoValidacionEjercicio.DIAGRAMA);
        assertThat(router.resolverTipo(ejercicio(null, "RAPIDA", null, "SELECT 1;"), "UPDATE alumnos SET nombre = 'Ana';"))
                .isEqualTo(TipoValidacionEjercicio.PRACTICA_RAPIDA);
        assertThat(router.resolverTipo(ejercicio(null, "RAPIDA", null, "DELETE FROM alumnos WHERE id = 1;"), "SELECT 1;"))
                .isEqualTo(TipoValidacionEjercicio.DML);
        assertThat(router.resolverTipo(ejercicio(null, null, "{\"tipo_validacion\":\"TEXTUAL\"}", "DROP TABLE demo;"), "DROP TABLE demo;"))
                .isEqualTo(TipoValidacionEjercicio.TEXTUAL);
    }

    @Test
    void prevalidacionBloqueaMutacionesASchemasInternos() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "DROP TABLE lms_core.usuarios;"),
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
                ejercicio("diagram", null, null, "SELECT 1;"),
                "{ no-es-json",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("diagrama");
    }

    @Test
    void prevalidacionBloqueaOperacionDistintaALaMaestra() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "CREATE TABLE pociones(id INT);"),
                "DELETE FROM aventureros;",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("operación");
    }

    @Test
    void prevalidacionBloqueaDmlEnTablaFueraDelContrato() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "DELETE FROM aventureros WHERE id_aventurero = 1;"),
                "DELETE FROM equipamiento WHERE id_aventurero = 1;",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("fuera del contexto");
    }

    @Test
    void prevalidacionBloqueaInyeccionMultiSentencia() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "SELECT * FROM aventureros;"),
                "SELECT * FROM aventureros; DROP TABLE equipamiento;",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("sentencia");
    }

    @Test
    void prevalidacionPermiteDmlEnTablaEsperada() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "UPDATE aventureros SET nivel = 2 WHERE nombre = 'Ana';"),
                "UPDATE aventureros SET nivel = 3 WHERE nombre = 'Ana';",
                UUID.randomUUID().toString()
        );

        assertThat(error).isEmpty();
    }

    @Test
    void prevalidacionBloqueaDropCuandoElDdlEsperadoEsCreate() {
        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, "CREATE TABLE pociones(id INT);"),
                "DROP TABLE pociones;",
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("operación");
    }

    @Test
    void prevalidacionRespetaBloquesPlpgsqlConPuntoYComaInterno() {
        String maestra = """
                CREATE OR REPLACE FUNCTION fn_auditar() RETURNS trigger AS $$
                BEGIN
                    INSERT INTO log_cambios(tabla) VALUES ('aventureros');
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """;

        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, maestra),
                maestra,
                UUID.randomUUID().toString()
        );

        assertThat(error).isEmpty();
    }

    @Test
    void prevalidacionBloqueaTablaIncorrectaDentroDeFuncion() {
        String maestra = """
                CREATE OR REPLACE FUNCTION fn_auditar() RETURNS trigger AS $$
                BEGIN
                    INSERT INTO log_cambios(tabla) VALUES ('aventureros');
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """;
        String alumno = """
                CREATE OR REPLACE FUNCTION fn_auditar() RETURNS trigger AS $$
                BEGIN
                    INSERT INTO equipamiento(nombre) VALUES ('espada');
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """;

        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, maestra),
                alumno,
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("fuera del contexto");
    }

    @Test
    void prevalidacionBloqueaDdlOcultoDentroDeFuncion() {
        String maestra = """
                CREATE OR REPLACE FUNCTION fn_saludo() RETURNS text AS $$
                BEGIN
                    RETURN 'hola';
                END;
                $$ LANGUAGE plpgsql;
                """;
        String alumno = """
                CREATE OR REPLACE FUNCTION fn_saludo() RETURNS text AS $$
                BEGIN
                    DROP TABLE aventureros;
                    RETURN 'hola';
                END;
                $$ LANGUAGE plpgsql;
                """;

        Optional<java.util.Map<String, Object>> error = router.prevalidar(
                ejercicio(null, null, null, maestra),
                alumno,
                UUID.randomUUID().toString()
        );

        assertThat(error).isPresent();
        assertThat(error.get().get("message").toString()).contains("operación");
    }

    private EjercicioPractico ejercicio(String formato, String tipoMision, String configuracionExtra) {
        return ejercicio(formato, tipoMision, configuracionExtra, "SELECT 1;");
    }

    private EjercicioPractico ejercicio(String formato, String tipoMision, String configuracionExtra, String queryMaestra) {
        EjercicioPractico ejercicio = new EjercicioPractico();
        ejercicio.setFormato(formato);
        ejercicio.setTipoMision(tipoMision);
        ejercicio.setConfiguracionExtra(configuracionExtra);
        ejercicio.setQueryMaestra(queryMaestra);
        ejercicio.setEnunciado("Consulta de prueba");
        return ejercicio;
    }
}
