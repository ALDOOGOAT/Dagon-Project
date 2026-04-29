package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;
import java.nio.charset.StandardCharsets;

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
        "Eres Clawbot, tutor de SQL en espanol. " +
        "No resuelves ejercicios del alumno; guias con metodo socratico. " +
        "Siempre ayudas a pensar, no a copiar.\n\n" +
        "REGLAS:\n" +
        "1. Nunca des la respuesta exacta de un ejercicio evaluado ni una consulta completa que lo resuelva.\n" +
        "2. Explica el concepto de forma corta y clara.\n" +
        "3. Haz al menos una pregunta socratica para que el alumno deduzca el siguiente paso.\n" +
        "4. Si usas ejemplo SQL, debe ser ANALOGO, con tablas inventadas y diferente al problema real.\n" +
        "5. Cuando sea util, usa plantillas incompletas tipo ahorcado: SELECT ____ FROM ____ WHERE ____;\n" +
        "6. Usa bloques ```sql para plantillas o ejemplos.\n" +
        "7. Sin HTML. Sin markdown complejo. En espanol.\n\n" +
        "FORMATO IDEAL:\n" +
        "IDEA: [concepto breve]\n" +
        "PISTA: [pregunta o pista]\n" +
        "MINIEJEMPLO:\n```sql\n...ejemplo analogo con huecos...\n```";

private static final String SYSTEM_PROMPT_ANALYSIS =
        "Eres Clawbot, tutor socratico de SQL. " +
        "Debes ayudar a resolver el problema sin revelar la solucion real.\n\n" +
        "REGLAS INQUEBRANTABLES:\n" +
        "1. Nunca muestres la query correcta, la query maestra, ni una variante equivalente que resuelva el ejercicio.\n" +
        "2. Nunca completes la consulta real del alumno.\n" +
        "3. Explica que concepto SQL esta fallando con lenguaje claro y corto.\n" +
        "4. Haz preguntas socraticas concretas para obligar al alumno a pensar.\n" +
        "5. Da un ejemplo ANALOGO con tablas inventadas como frutas, libros, mascotas o planetas.\n" +
        "6. Ese ejemplo debe usar huecos tipo ahorcado cuando sea posible: SELECT ____ FROM ____ WHERE ____;\n" +
        "7. El ejemplo nunca debe usar los nombres reales del ejercicio.\n" +
        "8. Sin HTML. En espanol. Tono paciente y util.\n\n" +
        "FORMATO OBLIGATORIO:\n" +
        "ERROR: [que idea esta fallando]\n" +
        "CONCEPTO: [explicacion breve del concepto]\n" +
        "PISTA: [pregunta socratica concreta]\n" +
        "MINIEJEMPLO:\n```sql\n[ejemplo analogo con huecos]\n```\n" +
        "CIERRE: [una pregunta final para que el alumno intente corregirlo]\n\n" +
        "ADAPTACION POR INTENTOS:\n" +
        "- Intento 1: error + concepto breve + una pregunta. El miniejemplo puede ser muy corto.\n" +
        "- Intento 2: pista mas concreta y una plantilla con huecos.\n" +
        "- Intento 3 o mas: ejemplo analogo mas guiado, pero siempre incompleto.\n";


    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos, int nivelId, String tituloEjercicio) {
        // Construir contexto del nivel para la IA
        String contextoNivel = buildContextoNivel(nivelId, tituloEjercicio);

        // Intentar Gemini primero
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                String respuesta = callGeminiAnalysis(descripcion, queryMaestra, queryAlumno, errorDb, intentos, contextoNivel);
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
                String prompt = SYSTEM_PROMPT_ANALYSIS +
                    "\n\nCONTEXTO DEL NIVEL: " + contextoNivel +
                    "\nEJERCICIO: " + descripcion +
                    "\nLO QUE EL ALUMNO ESCRIBIÓ: " + queryAlumno +
                    "\nERROR OBTENIDO: " + errorDb +
                    "\nINTENTO #: " + intentos +
                    "\n\nRecuerda: NUNCA muestres la solución. Guía con preguntas.";
                String respuesta = callGroqChat(prompt);
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

    private String buildContextoNivel(int nivelId, String tituloEjercicio) {
        String tema;
        switch (nivelId) {
            case 1: tema = "Selección básica con SELECT, filtros WHERE, operadores de comparación y LIKE."; break;
            case 2: tema = "Funciones de agregación (COUNT, SUM, AVG, MIN, MAX), GROUP BY y HAVING."; break;
            case 3: tema = "JOINs (INNER, LEFT, RIGHT), relaciones entre tablas y aliases."; break;
            case 4: tema = "Subconsultas, INSERT, UPDATE, DELETE y manipulación de datos (DML)."; break;
            case 5: tema = "Modelado Entidad-Relación, CREATE TABLE, ALTER TABLE, claves primarias y foráneas (DDL)."; break;
            default: tema = "SQL general."; break;
        }
        return "Módulo " + nivelId + " - Tema: " + tema +
               (tituloEjercicio != null && !tituloEjercicio.isEmpty() ? " | Ejercicio: " + tituloEjercicio : "");
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        String promptChat = buildChatPrompt(mensajeUsuario, historial);

        // Intentar Gemini primero
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                String respuesta = callGeminiChat(promptChat);
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
                String respuesta = callGroqChat(promptChat);
                if (respuesta != null && !respuesta.isEmpty()) {
                    return formatearRespuestaChat(respuesta);
                }
            } catch (Exception e) {
                System.err.println("Clawbot: Error con Groq - " + e.getMessage());
            }
        }

        return helpForQuestion(mensajeUsuario.toLowerCase());
    }

    private String callGeminiChat(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            System.out.println("Clawbot: Gemini API key no configurada");
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;
            
            // Usar el modelo gemini-1.5-flash que es más económico
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", prompt));
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

    private String callGeminiAnalysis(String desc, String queryM, String queryA, String error, int intentos, String contextoNivel) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            // Construimos pistas progresivas segun el numero de intentos
            String nivelAyuda;
            if (intentos <= 1) {
                nivelAyuda = "Es su primer intento. Solo señala el error y hazle UNA pregunta para que reflexione. No des ejemplos aún.";
            } else if (intentos == 2) {
                nivelAyuda = "Es su segundo intento. Explica el CONCEPTO teórico involucrado y haz una pregunta más específica. Puedes dar una pista corta.";
            } else {
                nivelAyuda = "Lleva " + intentos + " intentos. Da un ejemplo con una tabla INVENTADA (mascotas, planetas, frutas) usando espacios en blanco (____) para que complete. NUNCA uses las tablas ni datos del ejercicio real.";
            }

            String prompt = buildAnalysisPrompt(desc, queryA, error, intentos, contextoNivel, nivelAyuda);

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

    private String callOllamaAnalysis(String desc, String queryA, String error, int intentos, String contextoNivel) {
        try {
            String url = ollamaUrl + "/api/chat";

            String prompt = buildAnalysisPrompt(
                desc,
                queryA,
                error != null ? error : "Sin error",
                intentos,
                contextoNivel,
                "Usa una explicacion progresiva y un ejemplo analogo incompleto."
            );

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
            body.put("temperature", 0.5);
            body.put("max_tokens", 300);
            body.put("top_p", 0.9);

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

    private String buildChatPrompt(String mensajeUsuario, List<Map<String, String>> historial) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_PROMPT_CHAT).append("\n\n");

        if (historial != null && !historial.isEmpty()) {
            sb.append("CONTEXTO RECIENTE:\n");
            int start = Math.max(0, historial.size() - 4);
            for (int i = start; i < historial.size(); i++) {
                Map<String, String> item = historial.get(i);
                String role = item.getOrDefault("role", "user");
                String content = item.getOrDefault("content", "");
                sb.append(role.equals("assistant") ? "Tutor: " : "Alumno: ")
                  .append(content)
                  .append("\n");
            }
            sb.append("\n");
        }

        sb.append("PREGUNTA ACTUAL DEL ALUMNO:\n")
          .append(mensajeUsuario)
          .append("\n\n")
          .append("Recuerda: explica, pregunta y da un miniejemplo analogo con huecos si aplica.");

        return sb.toString();
    }

    private String buildAnalysisPrompt(String desc, String queryA, String error, int intentos, String contextoNivel, String nivelAyuda) {
        return SYSTEM_PROMPT_ANALYSIS +
            "\nCONTEXTO DEL NIVEL: " + contextoNivel +
            "\nEJERCICIO REAL: " + desc +
            "\nCONSULTA DEL ALUMNO: " + queryA +
            "\nERROR O DESAJUSTE: " + (error != null ? error : "Sin error de sintaxis, pero el resultado no coincide") +
            "\nINTENTO ACTUAL: " + intentos +
            "\nNIVEL DE AYUDA: " + nivelAyuda +
            "\n\nRecuerda: no des la solucion real; usa ejemplo analogo y huecos.";
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
        StringBuilder sb = new StringBuilder();

        if (intentos <= 1) {
            sb.append("ERROR: Hay una idea de la consulta que no coincide con lo que pide el ejercicio.\n\n");
            sb.append("CONCEPTO: Antes de escribir SQL, conviene separar el problema en tabla, columnas y condicion.\n\n");
            sb.append("PISTA: Si lees otra vez el enunciado, ¿te pide seleccionar, filtrar, unir o agrupar?\n\n");
            sb.append("CIERRE: ¿Que clausula SQL crees que deberia aparecer primero en tu borrador?");
        } else if (intentos == 2) {
            sb.append("ERROR: Tu consulta aun no expresa correctamente la operacion que pide el ejercicio.\n\n");
            sb.append("CONCEPTO: ");
            if (error != null && error.toLowerCase().contains("syntax")) {
                sb.append("Revisa el orden de las clausulas. En SQL, la estructura importa tanto como los nombres.\n");
            } else if (error != null && error.toLowerCase().contains("column")) {
                sb.append("Los nombres de columnas deben coincidir exactamente con la tabla que estas consultando.\n");
            } else {
                sb.append("Compara lo que el ejercicio pide con lo que tu consulta realmente hace. Puede faltar un filtro, una tabla o una agrupacion.\n");
            }
            sb.append("\nPISTA: Si lo hicieras con una tabla de libros, ¿que pondrias aqui?\n\n");
            sb.append("```sql\nSELECT ____ FROM libros WHERE ____ = '____';\n```\n\n");
            sb.append("CIERRE: ¿Que parte de esa plantilla se parece mas a tu ejercicio real?");
        } else {
            sb.append("ERROR: Ya detectaste parte del camino, pero aun falta expresar bien la logica en SQL.\n\n");
            sb.append("CONCEPTO: Resuelve la consulta por capas: origen de datos, columnas necesarias y condicion exacta.\n\n");
            sb.append("PISTA: Prueba primero con un ejemplo analogo y luego traduce esa estructura a tu caso.\n\n");
            sb.append("MINIEJEMPLO:\n```sql\nSELECT ____\nFROM mascotas\nWHERE ____ = '____';\n```\n\n");
            sb.append("CIERRE: ¿Que iria en cada hueco si la meta fuera traer solo los nombres de las mascotas de tipo gato?");
        }

        return sb.toString();
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
