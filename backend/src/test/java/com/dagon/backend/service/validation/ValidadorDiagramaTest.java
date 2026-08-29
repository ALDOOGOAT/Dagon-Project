package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.service.ModelingService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidadorDiagramaTest {

    private final ValidadorDiagrama validador = new ValidadorDiagrama(new ModelingService());

    private EjercicioPractico ejercicio(String queryMaestra, String configuracionExtra) {
        EjercicioPractico ejercicio = new EjercicioPractico();
        ejercicio.setEnunciado("Enunciado de prueba");
        ejercicio.setQueryMaestra(queryMaestra);
        ejercicio.setConfiguracionExtra(configuracionExtra);
        return ejercicio;
    }

    private String diagrama(String... entidadesJson) {
        return "{\"nodes\":[" + String.join(",", entidadesJson) + "],\"edges\":[]}";
    }

    private static final String DDL_GREMIO = """
            CREATE TABLE Gremio (
              id_gremio INT PRIMARY KEY,
              nombre_gremio VARCHAR(50)
            );
            CREATE TABLE Aventurero (
              id_aventurero INT PRIMARY KEY,
              nombre VARCHAR(50),
              id_gremio INT REFERENCES Gremio(id_gremio)
            );
            """;

    private static final String DIAGRAMA_GREMIO_OK = """
            {"nodes":[
              {"id":"n1","data":{"label":"Gremio","columns":[
                 {"name":"id_gremio","role":"pk"},{"name":"nombre","role":"normal"}]}},
              {"id":"n2","data":{"label":"Aventurero","columns":[
                 {"name":"id_aventurero","role":"pk"},{"name":"id_gremio","role":"fk"}]}}
            ],"edges":[
              {"source":"n2","target":"n1","data":{"cardinality":"1:N"}}
            ]}
            """;

    @Test
    void deduceLasReglasDelDdlMaestroCuandoElDocenteNoEscribioNinguna() {
        // Sin configuracion_extra, el ejercicio 125 aprobaba con dos cajas cualesquiera.
        var resultado = validador.analizar(ejercicio(DDL_GREMIO, null), """
                {"nodes":[
                  {"id":"n1","data":{"label":"Cosa","columns":[{"name":"id","role":"pk"}]}},
                  {"id":"n2","data":{"label":"Otra","columns":[{"name":"id","role":"pk"}]}}
                ],"edges":[{"source":"n1","target":"n2","data":{"cardinality":"1:N"}}]}
                """);

        assertFalse(resultado.esValido());
        assertTrue(resultado.problemas().stream().anyMatch(p -> p.contains("gremio")),
                "debe exigir la entidad gremio: " + resultado.problemas());
        assertTrue(resultado.problemas().stream().anyMatch(p -> p.contains("aventurero")),
                "debe exigir la entidad aventurero: " + resultado.problemas());
    }

    @Test
    void aceptaElDiagramaQueCoincideConElDdlMaestro() {
        var resultado = validador.analizar(ejercicio(DDL_GREMIO, null), DIAGRAMA_GREMIO_OK);
        assertTrue(resultado.esValido(), "problemas inesperados: " + resultado.problemas());
        assertEquals(2, resultado.resumen().get("entidades"));
        assertEquals(1, resultado.resumen().get("relaciones"));
    }

    @Test
    void aceptaLaRelacionDibujadaEnSentidoContrario() {
        String invertido = DIAGRAMA_GREMIO_OK.replace("\"source\":\"n2\",\"target\":\"n1\"",
                "\"source\":\"n1\",\"target\":\"n2\"");
        var resultado = validador.analizar(ejercicio(DDL_GREMIO, null), invertido);
        assertTrue(resultado.esValido(), "problemas inesperados: " + resultado.problemas());
    }

    @Test
    void reportaTodosLosProblemasDeUnaVezYNoSoloElPrimero() {
        String config = """
                {"min_entidades":3,"min_relaciones":2,"requiere_pk":true,
                 "min_atributos_por_entidad":2,
                 "entidades_requeridas":[["huesped","huespedes"],["habitacion","habitaciones"]]}
                """;
        var resultado = validador.analizar(ejercicio("{\"diagrama\":\"validado\"}", config), diagrama(
                "{\"id\":\"n1\",\"data\":{\"label\":\"Huespedes\",\"columns\":[{\"name\":\"id\",\"role\":\"normal\"}]}}"
        ));

        assertFalse(resultado.esValido());
        // entidades insuficientes + relaciones + atributos por entidad + falta PK + falta habitacion
        assertTrue(resultado.problemas().size() >= 5, "problemas: " + resultado.problemas());
    }

    @Test
    void ignoraAcentosYMayusculasEnLosNombresDeEntidad() {
        String config = "{\"entidades_requeridas\":[[\"habitacion\"]],\"min_entidades\":1,\"min_relaciones\":0}";
        var resultado = validador.analizar(ejercicio("{\"diagrama\":\"validado\"}", config), diagrama(
                "{\"id\":\"n1\",\"data\":{\"label\":\"Habitación\",\"columns\":[{\"name\":\"id\",\"role\":\"pk\"}]}}"
        ));
        assertTrue(resultado.esValido(), "problemas inesperados: " + resultado.problemas());
    }

    @Test
    void noRevientaConAristasHuerfanasNiNodosSinDatos() {
        String roto = "{\"nodes\":[{\"id\":\"n1\"}],\"edges\":[{\"source\":\"fantasma\"}]}";
        var resultado = validador.analizar(ejercicio("{\"diagrama\":\"validado\"}", null), roto);
        assertFalse(resultado.esValido());
        assertTrue(resultado.problemas().stream().anyMatch(p -> p.contains("sin nombre")),
                "problemas: " + resultado.problemas());
    }

    @Test
    void noCuentaComoAtributoUnaColumnaSinNombre() {
        String config = "{\"min_entidades\":1,\"min_relaciones\":0,\"min_atributos\":2}";
        var resultado = validador.analizar(ejercicio("{\"diagrama\":\"validado\"}", config), diagrama(
                "{\"id\":\"n1\",\"data\":{\"label\":\"Cosa\",\"columns\":[{\"name\":\"id\",\"role\":\"pk\"},{\"name\":\"  \",\"role\":\"normal\"}]}}"
        ));
        assertFalse(resultado.esValido());
        assertEquals(1, resultado.resumen().get("atributos"));
    }
}
