package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class ClawbotService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final Map<String, String> SQL_EXAMPLES = new HashMap<>();

    static {
        SQL_EXAMPLES.put("select", "SELECT nombre, email FROM usuarios WHERE activo = true;");
        SQL_EXAMPLES.put("join", "SELECT u.nombre, p.total FROM usuarios u INNER JOIN pedidos p ON u.id = p.usuario_id;");
        SQL_EXAMPLES.put("where", "SELECT * FROM productos WHERE precio > 100 AND categoria = 'electronics';");
        SQL_EXAMPLES.put("order by", "SELECT nombre, precio FROM productos ORDER BY precio DESC;");
        SQL_EXAMPLES.put("group by", "SELECT categoria, COUNT(*) as total FROM productos GROUP BY categoria;");
        SQL_EXAMPLES.put("null", "SELECT * FROM usuarios WHERE telefono IS NOT NULL;");
        SQL_EXAMPLES.put("inner join", "SELECT t1.campo, t2.campo FROM tabla1 t1 INNER JOIN tabla2 t2 ON t1.id = t2.campo_id;");
        SQL_EXAMPLES.put("left join", "SELECT * FROM tabla1 LEFT JOIN tabla2 ON tabla1.campo = tabla2.campo;");
    }

    private static final String SYSTEM_PROMPT_CHAT = "Eres Clawbot, asistente amigable de SQL para el juego Dagon. " +
        "REGLAS: 1. NUNCA uses HTML. 2. Responde en espanol. " +
        "3. Maximo 2 oraciones cortas. " +
        "4. Usa 1 emoji maximo. " +
        "5. Da ejemplos SQL simples entre backticks. " +
        "6. Si no sabes, di que no sabes. " +
        "7. NUNCA des la respuesta completa a ejercicios. " +
        "8. Usa metodo socratico: haz 1 pregunta para guiar. " +
        "9. Se muy breve y directo.";

    private static final String SYSTEM_PROMPT_ANALYSIS = "Eres Dagon, maestro de SQL. " +
        "Tu trabajo es analizar consultas incorrectas y DAR PISTAS. " +
        "REGLAS: 1. Analiza query vs correcta. " +
        "2. Identifica 1 error especifico. " +
        "3. Da UNA pista directa (no pregunta). " +
        "4. NUNCA uses HTML. 5. Espanol. " +
        "6. Maximo 2 oraciones. " +
        "7. Si es error sintaxis,INDICA cual. " +
        "8. Si es logico (WHERE/JOIN/etc), explica que falta. " +
        "Formato: ERROR: [breve] PISTA: [directa] CORRECCION: [sql parcial]";

    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos) {
        try {
            String respuesta = callGeminiAnalysis(descripcion, queryMaestra, queryAlumno, errorDb, intentos);
            if (respuesta != null && !respuesta.isEmpty() && !respuesta.contains("ERROR_DE_API")) {
                return formatearRespuestaAnalisis(respuesta);
            }
        } catch (Exception e) {
            System.err.println("Gemini analysis error: " + e.getMessage());
        }

        try {
            String respuesta = callOllamaWithContext(descripcion, queryMaestra, queryAlumno, errorDb, intentos);
            if (respuesta != null && !respuesta.isEmpty()) {
                return formatearRespuestaAnalisis(respuesta);
            }
        } catch (Exception e) {
            System.err.println("Ollama error: " + e.getMessage());
        }

        return buildFallbackResponse(descripcion, queryMaestra, errorDb, intentos);
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        mensajeUsuario = limpiarHtml(mensajeUsuario);

        try {
            String respuesta = callGeminiChat(mensajeUsuario, historial);
            if (respuesta != null && !respuesta.isEmpty() && !respuesta.contains("ERROR_DE_API")) {
                return formatearRespuestaChat(respuesta);
            }
        } catch (Exception e) {
            System.err.println("Gemini chat error: " + e.getMessage());
        }

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

    private String callGeminiChat(String mensaje, List<Map<String, String>> historial) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return "ERROR_DE_API";
        }
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            
            List<Map<String, String>> parts = new ArrayList<>();
            parts.add(Map.of("text", SYSTEM_PROMPT_CHAT + "\n\nUsuario: " + mensaje));
            userMessage.put("parts", parts);
            contents.add(userMessage);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 200,
                "topP", 0.9
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("candidates")) {
                List<?> candidates = (List<?>) resp.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) candidate.get("content");
                    List<?> partsResp = (List<?>) content.get("parts");
                    if (!partsResp.isEmpty()) {
                        Map<?, ?> part = (Map<?, ?>) partsResp.get(0);
                        return part.get("text").toString();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
        }
        return "ERROR_DE_API";
    }

    private String callGeminiAnalysis(String desc, String queryM, String queryA, String error, int intentos) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return "ERROR_DE_API";
        }
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;

            String prompt = SYSTEM_PROMPT_ANALYSIS + "\n\nMISION: " + desc + 
                "\nCONSULTA CORRECTA: " + queryM + 
                "\nTU CONSULTA: " + queryA + 
                "\nERROR: " + (error != null ? error : "Sin error especifico") + 
                "\nINTENTOS: " + intentos;

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            
            List<Map<String, String>> parts = new ArrayList<>();
            parts.add(Map.of("text", prompt));
            userMessage.put("parts", parts);
            contents.add(userMessage);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 300,
                "topP", 0.8
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("candidates")) {
                List<?> candidates = (List<?>) resp.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) candidate.get("content");
                    List<?> partsResp = (List<?>) content.get("parts");
                    if (!partsResp.isEmpty()) {
                        Map<?, ?> part = (Map<?, ?>) partsResp.get(0);
                        return part.get("text").toString();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Gemini analysis error: " + e.getMessage());
        }
        return "ERROR_DE_API";
    }

    private String callOllamaWithContext(String desc, String queryM, String queryA, String error, int intentos) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = "Eres Dagon, maestro de SQL. Analiza:\n" +
                "Mision: " + desc + "\n" +
                "Correcta: " + queryM + "\n" +
                "Tu query: " + queryA + "\n" +
                "Error: " + error + "\n" +
                "Intentos: " + intentos + "\n\n" +
                "Responde en maximo 2 oraciones. Da una pista directa.";

            Map<String, Object> msg = new HashMap<>();
            msg.put("role", "user");
            msg.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama3:latest");
            body.put("messages", Collections.singletonList(msg));
            body.put("stream", false);

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
            System.err.println("Ollama call error: " + e.getMessage());
        }
        return null;
    }

    private String callOllamaChat(String question) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = SYSTEM_PROMPT_CHAT + "\n\nUsuario: " + question;

            Map<String, Object> msg = new HashMap<>();
            msg.put("role", "user");
            msg.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama3:latest");
            body.put("messages", Collections.singletonList(msg));
            body.put("stream", false);

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
            System.err.println("Ollama chat error: " + e.getMessage());
        }
        return null;
    }

    private String formatearRespuestaChat(String respuesta) {
        respuesta = limpiarHtml(respuesta);
        respuesta = respuesta.replaceAll("<pre>.*?</pre>", "");
        respuesta = respuesta.replaceAll("<code>.*?</code>", "");

        String[] oraciones = respuesta.split("[.!?]");
        if (oraciones.length > 3) {
            respuesta = oraciones[0] + ". " + oraciones[1] + ". " + oraciones[2];
            if (oraciones.length > 3) {
                respuesta += "...";
            }
        }

        return respuesta.trim();
    }

    private String formatearRespuestaAnalisis(String respuesta) {
        respuesta = limpiarHtml(respuesta);

        if (respuesta.contains("ERROR:") || respuesta.contains("PISTA:")) {
            return respuesta;
        }

        return "ANALISIS: " + respuesta;
    }

    private String limpiarHtml(String texto) {
        if (texto == null) return "";
        texto = texto.replaceAll("<[^>]+>", "");
        texto = texto.replaceAll("&nbsp;", " ");
        texto = texto.replaceAll("&lt;", "<");
        texto = texto.replaceAll("&gt;", ">");
        texto = texto.replaceAll("&amp;", "&");
        return texto.trim();
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    private String buildFallbackResponse(String desc, String queryM, String error, int intentos) {
        String[] encouragements = {
            "Casi lo tienes! 💪",
            "Vas bien! Sigue",
            "No te rindas! Cada error te acerca a la respuesta",
            "Sigue intentando!"
        };

        String[] hints = getHintsForQuery(queryM, error);

        String encouragement = encouragements[intentos % encouragements.length];
        String hint = hints[intentos % hints.length];
        String example = getExampleForQuery(queryM);

        return encouragement + " " + hint + " Ejemplo: `" + example + "`";
    }

    private String[] getHintsForQuery(String queryM, String error) {
        String q = queryM.toLowerCase();
        String e = error != null ? error.toLowerCase() : "";

        if (e.contains("syntax") || e.contains("syntax error")) {
            return new String[]{
                "Revisa que no falte una coma, parentesis o punto y coma.",
                "Verifica que todas las palabras clave esten bien escritas.",
                "El error esta en la sintaxis."
            };
        }

        if (q.contains("join")) {
            return new String[]{
                "Falta el ON para conectar las tablas en el JOIN.",
                "Asegurate que los campos en el ON existan en ambas tablas.",
                "El JOIN necesita condiciones en ON, no en WHERE."
            };
        }

        if (q.contains("where")) {
            return new String[]{
                "Revisa los operadores de comparacion: =, <>, >, <, LIKE, IN.",
                "Si comparas con texto, usa comillas simples.",
                "Para null usa IS NULL, no = NULL."
            };
        }

        if (q.contains("group by")) {
            return new String[]{
                "Las columnas en SELECT deben estar en GROUP BY o ser funciones de agregacion.",
                "GROUP BY requiere funciones como COUNT, SUM, AVG, MAX, MIN.",
                "Verifica que todas las columnas del SELECT esten en GROUP BY."
            };
        }

        if (q.contains("order by")) {
            return new String[]{
                "ORDER BY va al final de la consulta.",
                "Usa ASC para ascendente y DESC para descendente.",
                "Las columnas en ORDER BY deben existir en el SELECT."
            };
        }

        return new String[]{
            "Revisa el nombre de las tablas y columnas.",
            "Verifica que estas usando las tablas correctas.",
            "El error puede estar en como combinas las condiciones."
        };
    }

    private String getExampleForQuery(String query) {
        String q = query.toLowerCase();
        if (q.contains("join")) return SQL_EXAMPLES.get("join");
        if (q.contains("where")) return SQL_EXAMPLES.get("where");
        if (q.contains("order")) return SQL_EXAMPLES.get("order by");
        if (q.contains("group")) return SQL_EXAMPLES.get("group by");
        if (q.contains("null")) return SQL_EXAMPLES.get("null");
        return SQL_EXAMPLES.get("select");
    }

    private String helpForQuestion(String question) {
        if (question.contains("join")) {
            return "Los JOINs conectan tablas. El campo comun va en ON: `SELECT * FROM t1 JOIN t2 ON t1.id = t2.id`";
        }
        if (question.contains("where")) {
            return "WHERE filtra. Usa: `SELECT * FROM t WHERE campo = 'valor'` o `WHERE edad > 18`";
        }
        if (question.contains("select")) {
            return "SELECT elige columnas: `SELECT nombre, email FROM usuarios`";
        }
        if (question.contains("null")) {
            return "CUIDADO! NULL usa IS: `WHERE campo IS NULL` (no = NULL)";
        }
        if (question.contains("group")) {
            return "GROUP BY agrupa: `SELECT tipo, COUNT(*) FROM productos GROUP BY tipo`";
        }
        if (question.contains("order")) {
            return "ORDER BY ordena: `ORDER BY precio ASC` o `ORDER BY nombre DESC`";
        }
        if (question.contains("insert")) {
            return "INSERT agrega: `INSERT INTO tabla (col1, col2) VALUES ('a', 'b')`";
        }
        if (question.contains("update")) {
            return "UPDATE cambia: `UPDATE usuarios SET nombre = 'nuevo' WHERE id = 1`";
        }
        if (question.contains("delete")) {
            return "DELETE borra: `DELETE FROM tabla WHERE id = 1` (cuidado!)";
        }

        return "Soy Clawbot! Ayudo con SELECT, WHERE, JOIN, GROUP BY, ORDER BY, INSERT, UPDATE, DELETE. Pregunta lo que necesites!";
    }
}