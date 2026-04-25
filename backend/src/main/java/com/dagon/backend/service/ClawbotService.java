package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ClawbotService {

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String SYSTEM_PROMPT_CHAT = 
        "Eres Clawbot, tutor de SQL. " +
        "Tu misi├⌐n es ENSE├R Preguntando, NO dando respuestas. " +
        "REGLAS: " +
        "1. Cuando pergunten algo, explica el concepto con 1 pregunta. " + 
        "2. Da solo 1 ejemplo b├ąsico, NO muchos. " +
        "3. Haz preguntas: '┬┤Qu├ę pasar├şa si...?' o '┬┤Para qu├ę sirve X?' " +
        "4. NUNCA des la soluci├│n completa. " +
        "5. M├ąximo 3 lineas. " +
        "6. En espa├▒ol. " +
        "7. Sin HTML, usa ` ` `sql para c├│digo.";
        "15. El formato es importante - haz respuestas bonitas.";

    private static final String SYSTEM_PROMPT_ANALYSIS = 
        "Eres Dagon, maestro de SQL. El usuario falló un ejercicio. " +
        "Tu misi├│n es que DESCUBRA su error Ăşic├ąndolo con PREGUNTAS. " +
        "REGLAS: " +
        "1. NUNCA digas la respuesta. " +
        "2. NUNCA muestres la consulta correcta. " +
        "3. Haz UNA pregunta que revele el error: '┬┤Qu├ę falta aqu├ş?' o '┬┤Qu├ę est├ą mal en X?' " +
        "4. S├ę breve - maximo 2 lineas. " +
        "5. En espanol. " +
        "Formato solo: PISTA: [1 pregunta guia]";

    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos) {
        // Intentar Gemini primero
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                String respuesta = callGeminiAnalysis(descripcion, queryMaestra, queryAlumno, errorDb, intentos);
                if (respuesta != null && !respuesta.isEmpty()) {
                    return formatearRespuestaAnalisis(respuesta);
                }
            } catch (Exception e) {
                System.err.println("Clawbot: Error con Gemini - " + e.getMessage());
            }
        }

        // Groq como fallback (gratis, rápido)
        if (groqApiKey != null && !groqApiKey.isEmpty()) {
            try {
                String respuesta = callGroqChat(SYSTEM_PROMPT_ANALYSIS + "\n\nEJERCICIO: " + descripcion + "\nCONSULTA CORRECTA: " + queryMaestra + "\nTU CONSULTA: " + queryAlumno + "\nERROR: " + errorDb);
                if (respuesta != null && !respuesta.isEmpty()) {
                    return formatearRespuestaAnalisis(respuesta);
                }
            } catch (Exception e) {
                System.err.println("Clawbot: Error con Groq - " + e.getMessage());
            }
        }

        // Fallback pre-cargado
        return buildFallbackResponse(descripcion, queryMaestra, errorDb, intentos);
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        // Intentar Gemini primero
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                String respuesta = callGeminiChat(mensajeUsuario);
                if (respuesta != null && !respuesta.isEmpty()) {
                    return formatearRespuestaChat(respuesta);
                }
            } catch (Exception e) {
                System.err.println("Clawbot: Error con Gemini - " + e.getMessage());
            }
        }

        // Groq como fallback
        if (groqApiKey != null && !groqApiKey.isEmpty()) {
            try {
                String respuesta = callGroqChat(SYSTEM_PROMPT_CHAT + "\nUsuario: " + mensajeUsuario);
                if (respuesta != null && !respuesta.isEmpty()) {
                    return formatearRespuestaChat(respuesta);
                }
            } catch (Exception e) {
                System.err.println("Clawbot: Error con Groq - " + e.getMessage());
            }
        }

        return helpForQuestion(mensajeUsuario.toLowerCase());
    }

    private String callGeminiChat(String question) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            System.out.println("Clawbot: Gemini API key no configurada");
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;
            
            // Usar el modelo gemini-1.5-flash que es más económico
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            String fullPrompt = SYSTEM_PROMPT_CHAT + "\n\nUsuario pregunta: " + question;

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", fullPrompt));
            content.put("parts", parts);
            contents.add(content);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 800,
                "topP", 0.95,
                "topK", 40
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> candidateContent = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> candidateParts = (List<Map<String, Object>>) candidateContent.get("parts");
                    if (!candidateParts.isEmpty()) {
                        String result = candidateParts.get(0).get("text").toString();
                        System.out.println("Clawbot: Respuesta Gemini recibida, longitud: " + result.length());
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Clawbot: Gemini API error - " + e.getMessage());
        }
        return null;
    }

    private String callGeminiAnalysis(String desc, String queryM, String queryA, String error, int intentos) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            String prompt = SYSTEM_PROMPT_ANALYSIS + "\n\nEJERCICIO: " + desc + "\n" +
                "CONSULTA CORRECTA: " + queryM + "\n" +
                "TU CONSULTA: " + queryA + "\n" +
                "ERROR: " + (error != null ? error : "Sin error") + "\n" +
                "INTENTO #: " + intentos + "\n\nAnaliza con metodo socratico. Dame pistas claras para que el usuario pueda corregir su consulta.";

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", prompt));
            content.put("parts", parts);
            contents.add(content);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 500,
                "topP", 0.9
            ));

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> candidateContent = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> candidateParts = (List<Map<String, Object>>) candidateContent.get("parts");
                    if (!candidateParts.isEmpty()) {
                        String result = candidateParts.get(0).get("text").toString();
                        System.out.println("Clawbot: Análisis Gemini recibido para intento " + intentos);
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Clawbot: Gemini Analysis error - " + e.getMessage());
        }
        return null;
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

    private String callGroqChat(String prompt) {
        try {
            String url = "https://api.groq.com/openai/v1/chat/completions";

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", prompt));

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama-3.1-8b-instant");
            body.put("messages", messages);
            body.put("temperature", 0.3);
            body.put("max_tokens", 150);
            body.put("top_p", 0.8);

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("Authorization", "Bearer " + groqApiKey);
            HttpEntity<Map<String, Object>> e = new HttpEntity<>(body, h);

            ResponseEntity<Map> r = restTemplate.postForEntity(url, e, Map.class);
            Map<String, Object> resp = r.getBody();

            if (resp != null && resp.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> msg = (Map<String, Object>) choice.get("message");
                    return msg.get("content").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("Groq API error: " + e.getMessage());
        }
        return null;
    }

    private String formatearRespuestaChat(String respuesta) {
        if (respuesta == null) return "";
        respuesta = respuesta.replaceAll("<[^>]+>", "");
        respuesta = respuesta.replaceAll("<[^>]*>", "");
        respuesta = respuesta.replaceAll("&nbsp;", " ");
        respuesta = respuesta.replaceAll("&lt;", "<");
        respuesta = respuesta.replaceAll("&gt;", ">");
        respuesta = respuesta.replaceAll("&amp;", "&");
        respuesta = respuesta.replaceAll("font-weight:[^;]*;", "");
        respuesta = respuesta.replaceAll("font-size:[^;]*;", "");
        respuesta = respuesta.replaceAll("color:[^;]*;", "");
        respuesta = respuesta.replaceAll("font-semibold", "");
        respuesta = respuesta.replaceAll("font-bold", "");
        return respuesta.trim();
    }

    private String formatearRespuestaAnalisis(String respuesta) {
        if (respuesta == null) return "";
        respuesta = respuesta.replaceAll("<[^>]+>", "");
        respuesta = respuesta.replaceAll("<[^>]*>", "");
        respuesta = respuesta.replaceAll("&nbsp;", " ");
        respuesta = respuesta.replaceAll("&lt;", "<");
        respuesta = respuesta.replaceAll("&gt;", ">");
        respuesta = respuesta.replaceAll("font-weight:[^;]*;", "");
        respuesta = respuesta.replaceAll("font-size:[^;]*;", "");
        respuesta = respuesta.replaceAll("font-semibold", "");
        respuesta = respuesta.replaceAll("font-bold", "");
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

        return "## " + encouragement + "\n\n" + hint + "\n\n```sql\nSELECT columna FROM tabla WHERE condicion;```";
    }

    private String helpForQuestion(String question) {
        if (question.contains("join")) {
            return "## JOIN en SQL\n\nLos JOINs combinan datos de multiple tablas.\n\n### INNER JOIN (mas comun)\n```sql\nSELECT u.nombre, p.total\nFROM usuarios u\nINNER JOIN pedidos p ON u.id = p.usuario_id;\n```\n\n*Solo muestra filas con coincidencia.*\n\n### LEFT JOIN\n```sql\nSELECT u.nombre, p.total\nFROM usuarios u\nLEFT JOIN pedidos p ON u.id = p.usuario_id;\n```\n\n*Muestra todos los usuarios.*\n\n## Consejo\nEl ON define la condicion, no uses WHERE.";
        }
        if (question.contains("where")) {
            return "## WHERE - Filtrar Resultados\n\nWHERE filtra segun condiciones.\n\n### Igual\n```sql\nSELECT * FROM usuarios WHERE activo = true;\n```\n\n### Comparaciones\n```sql\nSELECT * FROM productos WHERE precio > 100;\n```\n\n### Textos (LIKE)\n```sql\nSELECT * FROM usuarios WHERE nombre LIKE 'A%';\n```\n\n### Listas (IN)\n```sql\nSELECT * FROM productos WHERE categoria IN ('A', 'B');\n```\n\n### Multiples\n```sql\nSELECT * FROM productos WHERE precio > 100 AND categoria = 'electronics';```";
        }
        if (question.contains("select")) {
            return "## SELECT - Seleccionar Datos\n\n### Columnas especificas\n```sql\nSELECT nombre, email FROM usuarios;\n```\n\n### Todas las columnas\n```sql\nSELECT * FROM usuarios;\n```\n\n### Con alias (AS)\n```sql\nSELECT nombre AS 'Nombre', email AS 'Correo' FROM usuarios;\n```\n\n### Sin duplicados (DISTINCT)\n```sql\nSELECT DISTINCT categoria FROM productos;\n```\n\n### Con calculos\n```sql\nSELECT nombre, precio * 1.16 AS 'Con IVA' FROM productos;```";
        }
        if (question.contains("null")) {
            return "## NULL - Valores Nulos\n\nNULL es ausencia de valor.\n\n### Filtrar NULL\n```sql\nSELECT * FROM usuarios WHERE telefono IS NOT NULL;\nSELECT * FROM usuarios WHERE telefono IS NULL;\n```\n\n### ERROR comun\n```sql\n-- INCORRECTO:\nSELECT * FROM usuarios WHERE telefono = NULL;\n\n-- CORRECTO:\nSELECT * FROM usuarios WHERE telefono IS NULL;\n```\n\n### Funciones util\n```sql\nSELECT COALESCE(telefono, 'No proporcionado') FROM usuarios;```";
        }
        if (question.contains("group")) {
            return "## GROUP BY - Agrupar\n\n### Ejemplo basico\n```sql\nSELECT categoria, COUNT(*) as total\nFROM productos\nGROUP BY categoria;\n```\n\n### Con HAVING\n```sql\nSELECT categoria, COUNT(*) as total\nFROM productos\nGROUP BY categoria\nHAVING COUNT(*) > 5;\n```\n\n### Con funciones\n```sql\nSELECT categoria, COUNT(*), AVG(precio), SUM(stock)\nFROM productos\nGROUP BY categoria;\n```\n\n## Regla\nColumnas en SELECT deben: (1) estar en GROUP BY, o (2) ser funciones de agregado.";
        }
        if (question.contains("order")) {
            return "## ORDER BY - Ordenar\n\n### Ascendente (default)\n```sql\nSELECT nombre, precio FROM productos ORDER BY precio ASC;\n```\n\n### Descendente\n```sql\nSELECT nombre, precio FROM productos ORDER BY precio DESC;\n```\n\n### Multiples\n```sql\nSELECT nombre, categoria, precio\nFROM productos\nORDER BY categoria ASC, precio DESC;\n```\n\n## Nota\nVa SIEMPRE al final de la consulta.";
        }
        if (question.contains("insert")) {
            return "## INSERT - Agregar Datos\n\n### Una fila\n```sql\nINSERT INTO usuarios (nombre, email)\nVALUES ('Juan', 'juan@email.com');\n```\n\n### Multiples filas\n```sql\nINSERT INTO usuarios (nombre, email)\nVALUES \n  ('Ana', 'ana@email.com'),\n  ('Pedro', 'pedro@email.com');```";
        }
        if (question.contains("update")) {
            return "## UPDATE - Modificar Datos\n\n### Ejemplo\n```sql\nUPDATE usuarios\nSET telefono = '555-9999'\nWHERE id = 1;\n```\n\n### Multiples columnas\n```sql\nUPDATE usuarios\nSET nombre = 'Juan Garcia', telefono = '555-1234'\nWHERE id = 1;\n```\n\n## IMPORTANTE\nUsa WHERE para no actualizar todo!";
        }
        if (question.contains("delete")) {
            return "## DELETE - Borrar Datos\n\n### Ejemplo\n```sql\nDELETE FROM usuarios WHERE id = 1;\n```\n\n### Con condiciones\n```sql\nDELETE FROM pedidos WHERE status = 'cancelado';\n```\n\n## PELIGRO\nSin WHERE borra TODO:\n```sql\nDELETE FROM usuarios;  -- BORRA TODO!\n```\n\n## Mejor practica\nVerifica primero con SELECT, luego borra.";
        }

        return "## Soy Clawbot!\n\nPuedo ayudarte con:\n- SELECT - seleccionar datos\n- WHERE - filtrar\n- JOIN - combinar tablas\n- GROUP BY - agrupar\n- ORDER BY - ordenar\n- INSERT - agregar\n- UPDATE - modificar\n- DELETE - borrar\n- NULL - valores nulos\n\nPregunta sobre cualquier tema!";
    }
}