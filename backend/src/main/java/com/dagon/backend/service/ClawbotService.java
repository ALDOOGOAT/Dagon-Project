package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class ClawbotService {

    @Value("${gemini.api.key}")
    private String apiKey;

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

    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos) {
        try {
            String ollamaResponse = callOllamaWithContext(descripcion, queryMaestra, queryAlumno, errorDb, intentos);
            if (ollamaResponse != null && !ollamaResponse.isEmpty()) {
                return ollamaResponse;
            }
        } catch (Exception e) {
            System.err.println("Ollama error: " + e.getMessage());
        }

        return buildFallbackResponse(descripcion, queryMaestra, errorDb, intentos);
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        try {
            String ollamaResponse = callOllamaChat(mensajeUsuario);
            if (ollamaResponse != null && !ollamaResponse.isEmpty()) {
                return ollamaResponse;
            }
        } catch (Exception e) {
            System.err.println("Ollama error: " + e.getMessage());
        }

        return helpForQuestion(mensajeUsuario.toLowerCase());
    }

    private String callOllamaWithContext(String desc, String queryM, String queryA, String error, int intentos) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = "You are Clawbot, a friendly SQL tutor for a game called Dagon. " +
                "A student made an error in PostgreSQL.\n\n" +
                "Error: " + error + "\n" +
                "Expected query: " + queryM + "\n" +
                "Student query: " + queryA + "\n" +
                "Attempts: " + intentos + "\n\n" +
                "Instructions:\n" +
                "1. Give a short hint (question) to make them think\n" +
                "2. Show a relevant SQL example\n" +
                "3. Be encouraging, use emojis\n" +
                "4. Max 3 sentences\n\n" +
                "Respond in Spanish.";

            Map<String, Object> msg = new HashMap<>();
            msg.put("role", "user");
            msg.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama3:latest");
            body.put("messages", Collections.singletonList(msg));
            body.put("stream", false);
            body.put("options", Map.of("temperature", 0.7, "num_predict", 200));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("message")) {
                Map<String, Object> m = (Map<String, Object>) resp.get("message");
                String content = m.get("content").toString();
                return enrichResponseWithExample(content, queryM.toLowerCase());
            }
        } catch (Exception ex) {
            System.err.println("Ollama call error: " + ex.getMessage());
        }
        return null;
    }

    private String callOllamaChat(String question) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = "You are Clawbot, a friendly SQL tutor for a game called Dagon. " +
                "Answer the user's question about SQL. " +
                "Rules:\n" +
                "1. Be helpful and encouraging\n" +
                "2. Show SQL examples when relevant\n" +
                "3. Use emojis\n" +
                "4. Never give the complete answer to exercises\n" +
                "5. Guide with questions (socratic method)\n" +
                "6. Max 4 sentences\n\n" +
                "Respond in Spanish.\n\nUser: " + question;

            Map<String, Object> msg = new HashMap<>();
            msg.put("role", "user");
            msg.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama3:latest");
            body.put("messages", Collections.singletonList(msg));
            body.put("stream", false);
            body.put("options", Map.of("temperature", 0.7, "num_predict", 300));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("message")) {
                Map<String, Object> m = (Map<String, Object>) resp.get("message");
                return m.get("content").toString();
            }
        } catch (Exception ex) {
            System.err.println("Ollama chat error: " + ex.getMessage());
        }
        return null;
    }

    private String enrichResponseWithExample(String response, String queryLower) {
        String example = SQL_EXAMPLES.get("select");
        
        if (queryLower.contains("join")) example = SQL_EXAMPLES.get("join");
        else if (queryLower.contains("where")) example = SQL_EXAMPLES.get("where");
        else if (queryLower.contains("order")) example = SQL_EXAMPLES.get("order by");
        else if (queryLower.contains("group")) example = SQL_EXAMPLES.get("group by");
        else if (queryLower.toLowerCase().contains("null")) example = SQL_EXAMPLES.get("null");

        return response + "\n\n📋 Ejemplo SQL:\n```sql\n" + example + "\n```";
    }

    private String buildFallbackResponse(String desc, String queryM, String error, int intentos) {
        String[] encouragements = {
            "Cada error te hace mas fuerte. Piensa: falta una coma o parentesis?",
            "Vas bien! Solo es cosa de encontrar el detalle.",
            "Casi lo tienes! El debug es tu superpoder.",
            "Los errores son XP oculto! Sigue buscando."
        };

        String[] hints = {
            "Revisa el nombre de las tablas.",
            "Las columnas existen en esa tabla?",
            "Falta un JOIN para conectar las tablas?",
            "Usaste IS NULL en lugar de = NULL?"
        };

        String encouragement = encouragements[intentos % encouragements.length];
        String hint = hints[intentos % hints.length];

        String example = getExampleForQuery(queryM);

        return encouragement + "\n\n💭 " + hint + "\n\n📋 Ejemplo:\n```sql\n" + example + "\n```";
    }

    private String getExampleForQuery(String query) {
        String q = query.toLowerCase();
        if (q.contains("join")) return SQL_EXAMPLES.get("join");
        if (q.contains("where")) return SQL_EXAMPLES.get("where");
        if (q.contains("order")) return SQL_EXAMPLES.get("order by");
        if (q.contains("group")) return SQL_EXAMPLES.get("group by");
        if (q.toLowerCase().contains("null")) return SQL_EXAMPLES.get("null");
        return SQL_EXAMPLES.get("select");
    }

    private String helpForQuestion(String question) {
        if (question.contains("join")) {
            return "Los JOINs conectan tablas. Piensa: que campo tienen en comun?\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("join") + "\n```\n\n" +
                   "💡 El campo comun va en ON";
        }
        if (question.contains("where")) {
            return "WHERE filtra resultados. Operadores: =, <>, <, >, LIKE, IN\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("where") + "\n```";
        }
        if (question.contains("select")) {
            return "SELECT elige columnas para mostrar.\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("select") + "\n```";
        }
        if (question.contains("null")) {
            return "Cuidado con NULL! Usa IS NULL o IS NOT NULL, nunca =\n\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("null") + "\n```";
        }
        if (question.contains("group")) {
            return "GROUP BY agrupa registros.\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("group by") + "\n```";
        }
        if (question.contains("order")) {
            return "ORDER BY ordena. ASC = ascendente, DESC = descendente\n\n" +
                   "Ejemplo:\n```sql\n" + SQL_EXAMPLES.get("order by") + "\n```";
        }

        return "Soy Clawbot, tu tutor SQL!\n\n" +
               "Preguntame sobre:\n" +
               "- SELECT, WHERE\n" +
               "- JOIN (INNER, LEFT, RIGHT)\n" +
               "- GROUP BY, ORDER BY\n" +
               "- NULL e IS\n\n" +
               "Recuerden: Los errores son oportunidades de aprendizaje!";
    }
}