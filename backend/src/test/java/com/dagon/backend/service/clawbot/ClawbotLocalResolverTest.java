package com.dagon.backend.service.clawbot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * El valor del filtro esta en dos garantias: que atrape los errores deterministas (ahorro real)
 * y que NO atrape los errores de logica (ahi la IA si aporta).
 */
class ClawbotLocalResolverTest {

    private final ClawbotLocalResolver resolver = new ClawbotLocalResolver();

    @Test
    @DisplayName("Resuelve sin IA los errores tipicos de PostgreSQL, en ingles y humanizados")
    void resuelveErroresDeterministas() {
        assertTipo("syntax", "ERROR: syntax error at or near \"FORM\"");
        assertTipo("syntax", "Error de sintaxis cerca de \"WEHRE\". Revisa comas, parentesis o palabras clave.");
        assertTipo("table", "ERROR: relation \"clientess\" does not exist");
        assertTipo("table", "La tabla \"clientess\" no existe. Verifica el nombre o si aun no la creaste.");
        assertTipo("column", "ERROR: column \"nombre_completo\" does not exist");
        assertTipo("grouping", "ERROR: column \"p.categoria\" must appear in the GROUP BY clause");
        assertTipo("grouping", "ERROR: aggregate functions are not allowed in WHERE");
        assertTipo("join", "ERROR: missing FROM-clause entry for table \"c\"");
        assertTipo("types", "ERROR: operator does not exist: character varying = integer");
        assertTipo("constraint", "ERROR: duplicate key value violates unique constraint \"pk_clientes\"");
        assertTipo("constraint", "ERROR: null value in column \"email\" violates not-null constraint");
        assertTipo("subquery", "ERROR: more than one row returned by a subquery used as an expression");
        assertTipo("set_ops", "ERROR: each UNION query must have the same number of columns");
        assertTipo("performance", "ERROR: canceling statement due to statement timeout");
    }

    @Test
    @DisplayName("Resuelve los mensajes reales de PostgreSQL en es_ES, que es como responde la base del proyecto")
    void resuelveErroresEnEspanol() {
        assertTipo("syntax", "ERROR: error de sintaxis en o cerca de «FORM»");
        assertTipo("syntax", "ERROR: error de sintaxis al final de la entrada");
        assertTipo("syntax", "ERROR: una cadena de caracteres entre comillas está inconclusa en o cerca de «'sin cerrar»");
        assertTipo("table", "ERROR: no existe la relación «tabla_inexistente_xyz»");
        assertTipo("table", "ERROR: la relación «usuarios» ya existe");
        assertTipo("column", "ERROR: no existe la columna «columna_falsa»");
        assertTipo("grouping", "ERROR: la columna «usuarios.id_usuario» debe aparecer en la cláusula GROUP BY o ser usada en una función de agregación");
        assertTipo("grouping", "ERROR: no se permiten funciones de agregación en WHERE");
        assertTipo("join", "ERROR: falta una entrada para la tabla «u» en la cláusula FROM");
        assertTipo("types", "ERROR: el operador no existe: timestamp with time zone = integer");
        assertTipo("types", "ERROR: la sintaxis de entrada no es válida para tipo integer: «a»");
        assertTipo("types", "ERROR: la columna «id_usuario» es de tipo uuid pero la expresión es de tipo integer");
        assertTipo("constraint", "ERROR: el valor nulo en la columna «nombre» de la relación «usuarios» viola la restricción “not-null”");
        assertTipo("logic", "ERROR: división por cero");
        assertTipo("permission", "ERROR: permiso denegado al esquema lms_core");
        assertTipo("set_ops", "ERROR: cada consulta UNION debe tener el mismo número de columnas");
        assertTipo("subquery", "ERROR: una subconsulta utilizada como expresión retornó más de un registro");
    }

    @Test
    @DisplayName("Tambien resuelve el texto tal como llega desde el frontend, ya prefijado")
    void resuelveElTextoQueLlegaDelFrontend() {
        ClawbotLocalResolver.Diagnostico d = resolver
                .diagnosticar("Error de SQL: error de sintaxis en o cerca de «nivel»", null)
                .orElseThrow();
        assertEquals("syntax", d.errorType());
        assertTrue(d.concepto().contains("nivel"), "debe citar el token que rompio la consulta: " + d.concepto());
    }

    @Test
    @DisplayName("El detalle del error viaja al texto del diagnostico")
    void citaElIdentificadorDelError() {
        String texto = resolver.diagnosticar("ERROR: relation \"clientess\" does not exist", null)
                .orElseThrow()
                .concepto();
        assertTrue(texto.contains("clientess"), "el diagnostico debe nombrar el objeto que fallo: " + texto);
    }

    @Test
    @DisplayName("Detecta = NULL aunque la base no devuelva error")
    void detectaComparacionContraNull() {
        assertEquals("nulls",
                resolver.diagnosticar("", "SELECT * FROM clientes WHERE telefono = NULL;").orElseThrow().errorType());
    }

    @Test
    @DisplayName("Deja pasar a la IA los fallos de logica, que es donde el token vale la pena")
    void noAtrapaErroresDeLogica() {
        assertTrue(resolver.diagnosticar("Tu resultado no coincide con el esperado.", "SELECT nombre FROM clientes;").isEmpty());
        assertTrue(resolver.diagnosticar(null, null).isEmpty());
        assertTrue(resolver.diagnosticar("", "SELECT * FROM ventas WHERE total > 100;").isEmpty());
    }

    @Test
    @DisplayName("Responde la cortesia sin IA, pero no las preguntas reales")
    void filtraElChatTrivial() {
        assertTrue(resolver.responderChat("hola").isPresent());
        assertTrue(resolver.responderChat("Gracias!").isPresent());
        assertTrue(resolver.responderChat("quien eres?").isPresent());

        Optional<String> pregunta = resolver.responderChat("como uso un LEFT JOIN con tres tablas");
        assertTrue(pregunta.isEmpty(), "una duda tecnica real debe llegar al tutor");
    }

    private void assertTipo(String esperado, String errorDb) {
        ClawbotLocalResolver.Diagnostico diagnostico = resolver.diagnosticar(errorDb, null)
                .orElseThrow(() -> new AssertionError("sin diagnostico local para: " + errorDb));
        assertEquals(esperado, diagnostico.errorType(), "tipo incorrecto para: " + errorDb);
    }
}
