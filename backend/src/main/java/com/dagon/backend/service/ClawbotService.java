package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class ClawbotService {

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String SYSTEM_PROMPT_CHAT = 
        "Eres Clawbot, tutor amigable de SQL para el juego Dagon. " +
        "Tu objetivo es ENSENAR SQL de forma clara, extensa y con ejemplos detallados. " +
        "REGLAS: 1. NUNCA uses HTML, solo texto plano y bloques SQL. " +
        "2. Responde SIEMPRE en espanol. " +
        "3. Se EXTENSO y EXPLICATIVO - explica el concepto, luego ejemplos. " +
        "4. Usa bloques SQL con triple backtick. " +
        "5. Si el usuario pregunta, explica Y DA ejemplos detallados. " +
        "6. Usa tablas cuando sea util. " +
        "7. Muestra 2-3 ejemplos por tema. " +
        "8. NUNCA des la respuesta completa a ejercicios. " +
        "9. Explica POR QUE funciona asi. " +
        "10. Incluye avisos de errores comunes. " +
        "11. Cuando muestres codigo, explica cada linea. " +
        "12. Usa encabezados ## para seccionar. " +
        "13. Incluye casos de uso comunes. " +
        "14. Si hay variantes, muestralas. " +
        "15. El formato es importante - haz respuestas bonitas.";

    private static final String SYSTEM_PROMPT_ANALYSIS = 
        "Eres Dagon, maestro de SQL del juego. " +
        "Tu trabajo es analizar consultas incorrectas y DAR PISTAS educativas. " +
        "REGLAS: 1. Analiza la consulta del estudiante vs la correcta. " +
        "2. Identifica el error y EXPLICA por que falla. " +
        "3. Da una pista DIRECTA. " +
        "4. Muestra un ejemplo pequeno de correccion. " +
        "5. NUNCA uses HTML. " +
        "6. Siempre en espanol. " +
        "7. Se claro y educativo. " +
        "8. Explica el concepto atras del error. " +
        "Formato: ERROR: [explicacion] PISTA: [pista] EJEMPLO: [codigo]";

    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos) {
        try {
            String respuesta = callOllamaAnalysis(descripcion, queryMaestra, queryAlumno, errorDb, intentos);
            if (respuesta != null && !respuesta.isEmpty()) {
                return formatearRespuestaAnalisis(respuesta);
            }
        } catch (Exception e) {
            System.err.println("Ollama analysis error: " + e.getMessage());
        }

        return buildFallbackResponse(descripcion, queryMaestra, errorDb, intentos);
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        try {
            String respuesta = callOllamaChat(mensajeUsuario);
            if (respuesta != null && !respuesta.isEmpty()) {
                return formatearRespuestaChat(respuesta);
            }
        } catch (Exception e) {
            System.err.println("Ollama chat error: " + e.getMessage());
        }

        return helpForQuestion(mensajeUsuario.toLowerCase());
    }

    private String callOllamaChat(String question) {
        try {
            String url = ollamaUrl + "/api/chat";

            String fullPrompt = SYSTEM_PROMPT_CHAT + "\n\nUsuario pregunta: " + question;

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", fullPrompt));

            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen2.5-coder:7b");
            body.put("messages", messages);
            body.put("stream", false);
            body.put("options", Map.of(
                "temperature", 0.8,
                "num_predict", 1000,
                "top_p", 0.95
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("message")) {
                Map<String, Object> m = (Map<String, Object>) resp.get("message");
                return m.get("content").toString();
            }
        } catch (Exception e) {
            System.err.println("Ollama API error: " + e.getMessage());
        }
        return null;
    }

    private String callOllamaAnalysis(String desc, String queryM, String queryA, String error, int intentos) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = SYSTEM_PROMPT_ANALYSIS + "\n\nEJERCICIO: " + desc + "\n" +
                "CONSULTA CORRECTA: " + queryM + "\n" +
                "TU CONSULTA: " + queryA + "\n" +
                "ERROR: " + (error != null ? error : "Sin error") + "\n" +
                "INTENTO #: " + intentos + "\n\nAnaliza y da pista educativa.";

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", prompt));

            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen2.5-coder:7b");
            body.put("messages", messages);
            body.put("stream", false);
            body.put("options", Map.of(
                "temperature", 0.3,
                "num_predict", 500
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("message")) {
                Map<String, Object> m = (Map<String, Object>) resp.get("message");
                return m.get("content").toString();
            }
        } catch (Exception e) {
            System.err.println("Ollama analysis error: " + e.getMessage());
        }
        return null;
    }

    private String formatearRespuestaChat(String respuesta) {
        if (respuesta == null) return "";
        respuesta = respuesta.replaceAll("<[^>]+>", "");
        respuesta = respuesta.replaceAll("&nbsp;", " ");
        respuesta = respuesta.replaceAll("&lt;", "<");
        respuesta = respuesta.replaceAll("&gt;", ">");
        return respuesta.trim();
    }

    private String formatearRespuestaAnalisis(String respuesta) {
        if (respuesta == null) return "";
        respuesta = respuesta.replaceAll("<[^>]+>", "");
        return respuesta.trim();
    }

    private String buildFallbackResponse(String desc, String queryM, String error, int intentos) {
        String[] encouragements = {
            "Casi lo tiens! Revisa tu consulta con calma.",
            "Vas muy bien! El error te ayuda a aprender.",
            "No te rindas! Cada error te acerca a la respuesta.",
            "Sigue intentando! SQL es practica."
        };

        String[] hints = {
            "Revisa si falta alguna palabra clave",
            "Verifica que los nombres de columnas existan",
            "Para JOINs, usa ON para la condicion",
            "Para GROUP BY, columnas deben estar en SELECT o ser funciones",
            "Para texto, usa comillas simples",
            "Para null, usa IS NULL no = NULL",
            "ORDER BY va al final",
            "Verifica las comas entre columnas"
        };

        String encouragement = encouragements[intentos % encouragements.length];
        String hint = hints[intentos % hints.length];

        return "## " + encouragement + "\n\n" + hint + "\n\nsql\nSELECT columna FROM tabla WHERE condicion;";
    }

    private String helpForQuestion(String question) {
        if (question.contains("join")) {
            return "## JOIN en SQL\n\nLos JOINs combinan datos de multiple tablas.\n\n### INNER JOIN (mas comun)\nsql\nSELECT u.nombre, p.total\nFROM usuarios u\nINNER JOIN pedidos p ON u.id = p.usuario_id;\n\n*Solo muestra filas con coincidencia.*\n\n### LEFT JOIN\nsql\nSELECT u.nombre, p.total\nFROM usuarios u\nLEFT JOIN pedidos p ON u.id = p.usuario_id;\n\n*Muestra todos los usuarios.*\n\n## Consejo\nEl ON define la condicion, no uses WHERE.";
        }
        if (question.contains("where")) {
            return "## WHERE - Filtrar Resultados\n\nWHERE filtra segun condiciones.\n\n### Igualsql\nSELECT * FROM usuarios WHERE activo = true;\n\n### Comparacionessql\nSELECT * FROM productos WHERE precio > 100;\n\n### Textos (LIKE)\nsql\nSELECT * FROM usuarios WHERE nombre LIKE 'A%';\n\n### Listas (IN)\nsql\nSELECT * FROM productos WHERE categoria IN ('A', 'B');\n\n### Multiplessql\nSELECT * FROM productos WHERE precio > 100 AND categoria = 'electronics';";
        }
        if (question.contains("select")) {
            return "## SELECT - Seleccionar Datos\n\n### Columnas especificassql\nSELECT nombre, email FROM usuarios;\n\n### Todas las columnassql\nSELECT * FROM usuarios;\n\n### Con alias (AS)\nsql\nSELECT nombre AS 'Nombre', email AS 'Correo' FROM usuarios;\n\n\n### Sin duplicados (DISTINCT)\nsql\nSELECT DISTINCT categoria FROM productos;\n\n### Con calculossql\nSELECT nombre, precio * 1.16 AS 'Con IVA' FROM productos;";
        }
        if (question.contains("null")) {
            return "## NULL - Valores Nulos\n\nNULL es ausencia de valor.\n\n### Filtrar NULL\nsql\nSELECT * FROM usuarios WHERE telefono IS NOT NULL;\nSELECT * FROM usuarios WHERE telefono IS NULL;\n\n### ERROR comunsql\n-- INCORRECTO:\nSELECT * FROM usuarios WHERE telefono = NULL;\n\n-- CORRECTO:\nSELECT * FROM usuarios WHERE telefono IS NULL;\n\n### Funciones utilsql\nSELECT COALESCE(telefono, 'No proporcionado') FROM usuarios;";
        }
        if (question.contains("group")) {
            return "## GROUP BY - Agrupar\n\n### Ejemplo basicosql\nSELECT categoria, COUNT(*) as total\nFROM productos\nGROUP BY categoria;\n\n### Con HAVINGsql\nSELECT categoria, COUNT(*) as total\nFROM productos\nGROUP BY categoria\nHAVING COUNT(*) > 5;\n\n### Con funcionessql\nSELECT categoria, COUNT(*), AVG(precio), SUM(stock)\nFROM productos\nGROUP BY categoria;\n\n## Regla\nColumnas en SELECT deben: (1) estar en GROUP BY, o (2) ser funciones de agregado.";
        }
        if (question.contains("order")) {
            return "## ORDER BY - Ordenar\n\n### Ascendente (default)sql\nSELECT nombre, precio FROM productos ORDER BY precio ASC;\n\n### Descendente\nsql\nSELECT nombre, precio FROM productos ORDER BY precio DESC;\n\n### Multiplessql\nSELECT nombre, categoria, precio\nFROM productos\nORDER BY categoria ASC, precio DESC;\n\n## Nota\nVa SIEMPRE al final de la consulta.";
        }
        if (question.contains("insert")) {
            return "## INSERT - Agregar Datos\n\n### Una filasql\nINSERT INTO usuarios (nombre, email)\nVALUES ('Juan', 'juan@email.com');\n\n### Multiples filassql\nINSERT INTO usuarios (nombre, email)\nVALUES \n  ('Ana', 'ana@email.com'),\n  ('Pedro', 'pedro@email.com');";
        }
        if (question.contains("update")) {
            return "## UPDATE - Modificar Datos\n\n### Ejemplosql\nUPDATE usuarios\nSET telefono = '555-9999'\nWHERE id = 1;\n\n### Multiples columnassql\nUPDATE usuarios\nSET nombre = 'Juan Garcia', telefono = '555-1234'\nWHERE id = 1;\n\n## IMPORTANTE\nUsa WHERE para no actualizar todo!";
        }
        if (question.contains("delete")) {
            return "## DELETE - Borrar Datos\n\n### Ejemplosql\nDELETE FROM usuarios WHERE id = 1;\n\n### Con condicionessql\nDELETE FROM pedidos WHERE status = 'cancelado';\n\n## PELIGRO\nSin WHERE borra TODO:\nsql\nDELETE FROM usuarios;  -- BORRA TODO!\n\n## Mejor practica\nVerifica primero con SELECT, luego borra.";
        }

        return "## Soy Clawbot!\n\nPuedo ayudarte con:\n- SELECT - seleccionar datos\n- WHERE - filtrar\n- JOIN - combinar tablas\n- GROUP BY - agrupar\n- ORDER BY - ordenar\n- INSERT - agregar\n- UPDATE - modificar\n- DELETE - borrar\n- NULL - valores nulos\n\nPregunta sobre cualquier tema!";
    }
}