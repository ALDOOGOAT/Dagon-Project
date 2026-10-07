package com.dagon.backend.service;

import com.dagon.backend.service.clawbot.ClawbotCacheService;
import com.dagon.backend.service.clawbot.ClawbotLocalResolver;
import com.dagon.backend.service.clawbot.ClawbotPromptCatalog;
import com.dagon.backend.service.clawbot.ClawbotRateLimiter;
import com.dagon.backend.service.clawbot.ClawbotTelemetryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;

@Service
public class ClawbotService {

    private static final Logger logger = LoggerFactory.getLogger(ClawbotService.class);
    private static final int MAX_PROMPT_TEXT = 1200;

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${dagon.clawbot.ollama.enabled:false}")
    private boolean ollamaEnabled;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    // Groq retiro los modelos llama-3.x: el que estaba fijo aqui devolvia 404 model_not_found.
    @Value("${dagon.clawbot.groq.model:openai/gpt-oss-20b}")
    private String groqModel;

    // gemini-1.5/2.5-flash ya devuelven 404; el alias -latest lo mantiene Google al dia.
    @Value("${dagon.clawbot.gemini.model:gemini-flash-lite-latest}")
    private String geminiModel;

    @Value("${dagon.clawbot.ollama.model:qwen2.5-coder:7b}")
    private String ollamaModel;

    // Orden de proveedores: Groq principal; si falla, Gemini; Ollama solo si esta habilitado.
    @Value("${dagon.clawbot.providers:groq,gemini,ollama}")
    private String ordenProveedores = "groq,gemini,ollama";

    private final RestTemplate restTemplate = new RestTemplate(requestFactory());
    private final ClawbotPromptCatalog promptCatalog;
    private final ClawbotRateLimiter rateLimiter;
    private final ClawbotTelemetryService telemetryService;
    private final ClawbotLocalResolver localResolver;
    private final ClawbotCacheService cacheService;

    public ClawbotService(
            ClawbotPromptCatalog promptCatalog,
            ClawbotRateLimiter rateLimiter,
            ClawbotTelemetryService telemetryService,
            ClawbotLocalResolver localResolver,
            ClawbotCacheService cacheService
    ) {
        this.promptCatalog = promptCatalog;
        this.rateLimiter = rateLimiter;
        this.telemetryService = telemetryService;
        this.localResolver = localResolver;
        this.cacheService = cacheService;
    }

    public String obtenerAyudaSocratica(
            String descripcion,
            String queryMaestra,
            String queryAlumno,
            String errorDb,
            int intentos,
            int nivelId,
            String tituloEjercicio
    ) {
        return obtenerAyudaSocratica("sistema", descripcion, queryMaestra, queryAlumno, errorDb, intentos, nivelId, tituloEjercicio, null);
    }

    public String obtenerAyudaSocratica(
            String usuarioId,
            String descripcion,
            String queryMaestra,
            String queryAlumno,
            String errorDb,
            int intentos,
            int nivelId,
            String tituloEjercicio
    ) {
        return obtenerAyudaSocratica(usuarioId, descripcion, queryMaestra, queryAlumno, errorDb, intentos, nivelId, tituloEjercicio, null);
    }

    /** materia 'io' = Investigacion de Operaciones: sin resolver de PostgreSQL y con prompts propios. */
    public String obtenerAyudaSocratica(
            String usuarioId,
            String descripcion,
            String queryMaestra,
            String queryAlumno,
            String errorDb,
            int intentos,
            int nivelId,
            String tituloEjercicio,
            String materia
    ) {
        rateLimiter.consume(usuarioId, "analysis");

        boolean io = esMateriaIo(materia);
        // En IO el tipo de error SQL no aplica (y los ids 15/16 de "transaction" son de otra materia).
        String errorType = io ? "io" : detectarTipoError(errorDb, queryAlumno, descripcion, nivelId);
        telemetryService.recordAnalysis(nivelId, errorType);
        String contextoNivel = io
                ? "Investigacion de Operaciones. Ejercicio actual: " + sanitizeForPrompt(tituloEjercicio)
                : promptCatalog.moduleContext(nivelId, sanitizeForPrompt(tituloEjercicio));
        String nivelAyuda = buildNivelAyuda(intentos);

        // Filtro 1: el error de PostgreSQL ya dice que paso. Ninguna IA hace falta aqui.
        // (Sus patrones son de PostgreSQL: en IO se salta.)
        if (!io) {
            Optional<ClawbotLocalResolver.Diagnostico> diagnosticoLocal = localResolver.diagnosticar(errorDb, queryAlumno);
            if (diagnosticoLocal.isPresent()) {
                telemetryService.recordSource("local_resolver_analysis");
                return buildRespuestaDiagnostico(diagnosticoLocal.get(), intentos);
            }
        }

        // Filtro 2: alguien ya pago esta misma explicacion antes. Las claves SQL no cambian;
        // en IO la clave lleva la materia ("analisis_io") y el ejercicio y la respuesta del alumno,
        // porque ahi la explicacion depende de los valores enviados, no solo del tipo de error.
        String claveCache = io
                ? cacheService.clave("analisis_io", errorDb, descripcion, queryAlumno, String.valueOf(Math.min(intentos, 3)))
                : cacheService.clave("analisis", errorType, errorDb, String.valueOf(nivelId),
                        String.valueOf(Math.min(intentos, 3)));
        Optional<String> cacheada = cacheService.buscar(claveCache);
        if (cacheada.isPresent()) {
            telemetryService.recordSource("cache_analysis");
            return cacheada.get();
        }

        String prompt = buildAnalysisPrompt(descripcion, queryAlumno, errorDb, intentos, contextoNivel, errorType, nivelAyuda, io);
        // Una respuesta que filtra la solucion se descarta y se prueba el siguiente proveedor.
        Optional<RespuestaIa> ia = consultarIa(prompt, 0.25, 520, texto -> {
            if (!revelaSolucion(formatearRespuestaAnalisis(texto), queryMaestra)) return true;
            telemetryService.recordSource("guardrail_local_analysis");
            return false;
        });
        if (ia.isPresent()) {
            String segura = formatearRespuestaAnalisis(ia.get().texto());
            telemetryService.recordSource(ia.get().fuente() + "_analysis");
            cacheService.guardar(claveCache, segura, ia.get().fuente());
            return segura;
        }

        telemetryService.recordSource("local_analysis");
        return io ? buildFallbackResponseIo(intentos) : buildFallbackResponse(errorDb, intentos, errorType);
    }

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        return obtenerRespuestaClawbot("sistema", mensajeUsuario, historial);
    }

    public String obtenerRespuestaClawbot(String usuarioId, String mensajeUsuario, List<Map<String, String>> historial) {
        return obtenerRespuestaClawbot(usuarioId, mensajeUsuario, historial, null);
    }

    /** materia 'io' = Investigacion de Operaciones: prompt propio y clave de cache separada. */
    public String obtenerRespuestaClawbot(String usuarioId, String mensajeUsuario, List<Map<String, String>> historial, String materia) {
        rateLimiter.consume(usuarioId, "chat");
        telemetryService.recordQuestion(mensajeUsuario);
        boolean io = esMateriaIo(materia);

        // Filtro 1: saludos, agradecimientos y preguntas de identidad no aportan aprendizaje.
        // (Las respuestas locales hablan de SQL: en IO se salta.)
        if (!io) {
            Optional<String> respuestaLocal = localResolver.responderChat(mensajeUsuario);
            if (respuestaLocal.isPresent()) {
                telemetryService.recordSource("local_resolver_chat");
                return respuestaLocal.get();
            }
        }

        // Filtro 2: solo se cachea la pregunta suelta; con historial la respuesta depende del contexto.
        boolean cacheable = historial == null || historial.isEmpty();
        String claveCache = cacheable ? cacheService.clave(io ? "chat_io" : "chat", mensajeUsuario) : null;
        if (cacheable) {
            Optional<String> cacheada = cacheService.buscar(claveCache);
            if (cacheada.isPresent()) {
                telemetryService.recordSource("cache_chat");
                return cacheada.get();
            }
        }

        String promptChat = buildChatPrompt(mensajeUsuario, historial, io);

        Optional<RespuestaIa> ia = consultarIa(promptChat, 0.55, 700, texto -> true);
        if (ia.isPresent()) {
            telemetryService.recordSource(ia.get().fuente() + "_chat");
            return cachearChat(claveCache, formatearRespuestaChat(ia.get().texto()), ia.get().fuente());
        }

        telemetryService.recordSource("local_chat");
        return io ? buildFallbackChatIo() : helpForQuestion(mensajeUsuario);
    }

    public Map<String, Object> obtenerMetricas() {
        return telemetryService.snapshot();
    }

    public String analizarPlanEjecucion(
            String descripcion,
            String queryAlumno,
            String planJson,
            Map<String, Object> resumenMetricas
    ) {
        String prompt = buildPerformancePrompt(descripcion, queryAlumno, planJson, resumenMetricas);
        Optional<RespuestaIa> ia = consultarIa(prompt, 0.2, 520, texto -> true);
        if (ia.isPresent()) {
            telemetryService.recordSource(ia.get().fuente() + "_performance");
            return formatearRespuestaAnalisis(ia.get().texto());
        }

        telemetryService.recordSource("local_performance");
        return buildPerformanceFallback(resumenMetricas);
    }

    private record RespuestaIa(String fuente, String texto) {}

    /**
     * Recorre los proveedores en el orden de dagon.clawbot.providers (Groq primero por defecto)
     * y devuelve la primera respuesta con texto que el filtro acepte. Un proveedor sin clave,
     * caido o con modelo retirado simplemente cede el turno al siguiente.
     */
    private Optional<RespuestaIa> consultarIa(String prompt, double temperatura, int maxTokens, Predicate<String> aceptable) {
        for (String valor : ordenProveedores.split(",")) {
            String fuente = valor.trim().toLowerCase(Locale.ROOT);
            String texto;
            try {
                texto = switch (fuente) {
                    case "groq" -> callGroq(prompt, temperatura, maxTokens);
                    case "gemini" -> callGemini(prompt, temperatura, maxTokens);
                    case "ollama" -> ollamaEnabled ? callOllama(prompt, temperatura, maxTokens) : null;
                    default -> null;
                };
            } catch (Exception e) {
                // Solo el tipo: el mensaje de RestTemplate puede incluir la URL o el cuerpo remoto.
                logger.warn("Clawbot: {} no respondio ({})", fuente, e.getClass().getSimpleName());
                continue;
            }
            if (hasText(texto) && aceptable.test(texto)) {
                return Optional.of(new RespuestaIa(fuente, texto));
            }
        }
        return Optional.empty();
    }

    private String callGroq(String prompt, double temperatura, int maxTokens) {
        if (!hasText(groqApiKey)) {
            return null;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        body.put("temperature", temperatura);
        body.put("top_p", 0.9);
        if (groqModel.startsWith("openai/gpt-oss")) {
            // Modelo de razonamiento: el razonamiento consume max_tokens; se acota y se deja margen.
            body.put("reasoning_effort", "low");
            body.put("max_tokens", maxTokens + 1024);
        } else {
            body.put("max_tokens", maxTokens);
        }
        HttpHeaders headers = jsonHeaders();
        headers.setBearerAuth(groqApiKey);
        headers.set(HttpHeaders.USER_AGENT, "DagonClawbot/1.0");
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.groq.com/openai/v1/chat/completions", new HttpEntity<>(body, headers), Map.class);
        return extractGroqText(response.getBody());
    }

    private String callGemini(String prompt, double temperatura, int maxTokens) {
        if (!hasText(geminiApiKey) || !geminiModel.matches("[a-zA-Z0-9._-]+")) {
            return null;
        }
        // La clave va en cabecera, no en la URL: asi no aparece en logs de errores.
        HttpHeaders headers = jsonHeaders();
        headers.set("x-goog-api-key", geminiApiKey);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent";
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url, new HttpEntity<>(buildGeminiBody(prompt, temperatura, maxTokens), headers), Map.class);
        return extractGeminiText(response.getBody());
    }

    private String callOllama(String prompt, double temperatura, int maxTokens) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ollamaModel);
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        body.put("stream", false);
        body.put("options", Map.of("temperature", temperatura, "num_predict", maxTokens, "top_p", 0.9));
        ResponseEntity<Map> response = restTemplate.postForEntity(
                ollamaUrl + "/api/chat", new HttpEntity<>(body, jsonHeaders()), Map.class);
        Map<String, Object> resp = response.getBody();
        if (resp != null && resp.containsKey("message")) {
            return String.valueOf(asMap(resp.get("message")).getOrDefault("content", ""));
        }
        return null;
    }

    private Map<String, Object> buildGeminiBody(String prompt, double temperature, int maxOutputTokens) {
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of("parts", List.of(Map.of("text", prompt))));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", contents);
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("temperature", temperature);
        config.put("maxOutputTokens", maxOutputTokens);
        config.put("topP", 0.9);
        body.put("generationConfig", config);
        return body;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private static SimpleClientHttpRequestFactory requestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setReadTimeout(20_000);
        return factory;
    }

    private String buildChatPrompt(String mensajeUsuario, List<Map<String, String>> historial, boolean io) {
        StringBuilder sb = new StringBuilder();
        sb.append(io ? promptCatalog.systemChatPromptIo() : promptCatalog.systemChatPrompt()).append("\n\n");

        if (historial != null && !historial.isEmpty()) {
            sb.append("CONTEXTO RECIENTE, resumido y no vinculante:\n");
            int start = Math.max(0, historial.size() - 4);
            for (int i = start; i < historial.size(); i++) {
                Map<String, String> item = historial.get(i);
                String role = item.getOrDefault("role", "user");
                String content = sanitizeForPrompt(item.getOrDefault("content", ""));
                sb.append("assistant".equals(role) ? "Tutor: " : "Alumno: ")
                        .append(content)
                        .append("\n");
            }
            sb.append("\n");
        }

        sb.append("PREGUNTA ACTUAL DEL ALUMNO:\n")
                .append(sanitizeForPrompt(mensajeUsuario))
                .append("\n\n")
                .append(io
                        ? "Recuerda: si el alumno pide el resultado final, guialo con el procedimiento y una pregunta; nunca des la cifra."
                        : "Recuerda: si el alumno pide una respuesta completa, convierte eso en guia, pregunta y plantilla incompleta.");

        return sb.toString();
    }

    private String buildAnalysisPrompt(
            String descripcion,
            String queryAlumno,
            String error,
            int intentos,
            String contextoNivel,
            String errorType,
            String nivelAyuda,
            boolean io
    ) {
        return (io ? promptCatalog.systemAnalysisPromptIo() : promptCatalog.systemAnalysisPrompt()) +
                "\n\nCONTEXTO DEL MODULO:\n" + sanitizeForPrompt(contextoNivel) +
                "\n\nTIPO DE ERROR DETECTADO: " + errorType +
                "\nGUIA PARA ESTE ERROR: " + promptCatalog.errorGuidance(errorType) +
                "\n\nEJERCICIO REAL, solo para entender el objetivo. No copies nombres al miniejemplo:\n" + sanitizeForPrompt(descripcion) +
                (io ? "\n\nRESPUESTA DEL ALUMNO (JSON campo:valor), no la corrijas con cifras:\n"
                        : "\n\nCONSULTA DEL ALUMNO, no la completes:\n") + sanitizeForPrompt(queryAlumno) +
                "\n\nERROR O DESAJUSTE:\n" + sanitizeForPrompt(error != null ? error : "La consulta corrio, pero el resultado no coincide.") +
                "\n\nINTENTO ACTUAL: " + Math.max(1, intentos) +
                "\nNIVEL DE AYUDA: " + nivelAyuda +
                (io ? "\n\nLa solucion no se proporciona a proposito. No inventes ni reveles el valor numerico final."
                        : "\n\nLa query maestra no se proporciona a proposito. No inventes una solucion completa.");
    }

    private String buildPerformancePrompt(
            String descripcion,
            String queryAlumno,
            String planJson,
            Map<String, Object> resumenMetricas
    ) {
        StringBuilder resumen = new StringBuilder();
        if (resumenMetricas != null) {
            resumenMetricas.forEach((key, value) -> resumen
                    .append(key)
                    .append(": ")
                    .append(value)
                    .append("\n"));
        }

        return """
                Eres Clawbot, tutor de PostgreSQL especializado en rendimiento. El alumno ya resolvio correctamente el ejercicio; ahora debes ensenar eficiencia sin cambiar el objetivo funcional.

                Responde en espanol, didactico y breve, con este formato:
                DIAGNOSTICO: una frase sobre el plan.
                EVIDENCIA: menciona el nodo o metrica principal del EXPLAIN.
                OPTIMIZACION: una mejora concreta, sin escribir la solucion completa.
                SIGUIENTE RETO: una pregunta corta para que el alumno piense.

                No inventes indices que no puedas justificar. Si el plan es pequeno, dilo y enfoca la explicacion en el concepto.

                EJERCICIO:
                %s

                CONSULTA DEL ALUMNO:
                %s

                RESUMEN DE METRICAS:
                %s

                PLAN JSON DE POSTGRESQL:
                %s
                """.formatted(
                sanitizeForPrompt(descripcion),
                sanitizeForPrompt(queryAlumno),
                sanitizeForPrompt(resumen.toString(), 1600),
                sanitizeForPrompt(planJson, 4800)
        );
    }

    private String buildNivelAyuda(int intentos) {
        if (intentos <= 1) {
            return "Primer intento: una explicacion breve y una pregunta concreta. Evita ejemplos largos.";
        }
        if (intentos == 2) {
            return "Segundo intento: pista mas concreta y una plantilla incompleta con huecos.";
        }
        return "Tercer intento o mas: ejemplo analogo guiado, incompleto y sin nombres reales del ejercicio.";
    }

    private String detectarTipoError(String errorDb, String queryAlumno, String descripcion, int nivelId) {
        String text = ((errorDb == null ? "" : errorDb) + " " +
                (queryAlumno == null ? "" : queryAlumno) + " " +
                (descripcion == null ? "" : descripcion)).toLowerCase();

        if (nivelId == 15 || nivelId == 16 || containsAny(text, "begin", "commit", "rollback", "savepoint", "for update", "nowait", "transaccion")) {
            return "transaction";
        }
        if (containsAny(text, "syntax", "sintaxis", "unterminated", "mismatched", "near")) {
            return "syntax";
        }
        if (containsAny(text, "column", "columna", "does not exist", "no existe la columna")) {
            return "column";
        }
        if (containsAny(text, "relation", "table", "tabla", "vista") && containsAny(text, "does not exist", "no existe", "inexistente")) {
            return "table";
        }
        if (containsAny(text, "join", "foreign key", "clave foranea", " on ", "relacion")) {
            return "join";
        }
        if (containsAny(text, "group by", "having", "aggregate", "count(", "sum(", "avg(", "must appear")) {
            return "grouping";
        }
        if (containsAny(text, "= null", " null", "is null", "is not null")) {
            return "nulls";
        }
        if (containsAny(text, "insert", "update", "delete", "returning")) {
            return "dml_safety";
        }
        if (containsAny(text, "entidad", "diagrama", "mer", "atributo", "cardinalidad")) {
            return "diagram";
        }
        if (containsAny(text, "no coinciden", "expected", "esperado", "resultado")) {
            return "logic";
        }
        return "generic";
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private String formatearRespuestaChat(String respuesta) {
        return cleanResponse(respuesta);
    }

    private String formatearRespuestaAnalisis(String respuesta) {
        return cleanResponse(respuesta);
    }

    private String cleanResponse(String respuesta) {
        if (respuesta == null) return "";
        return respuesta
                .replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&")
                .replaceAll("font-weight:[^;]*;", "")
                .replaceAll("font-size:[^;]*;", "")
                .replaceAll("color:[^;]*;", "")
                .replaceAll("font-semibold", "")
                .replaceAll("font-bold", "")
                .trim();
    }

    private boolean revelaSolucion(String respuesta, String queryMaestra) {
        String clean = canonicalSql(respuesta);
        String master = canonicalSql(queryMaestra);
        if (master.length() > 24 && clean.contains(master)) {
            return true;
        }
        String lower = respuesta == null ? "" : respuesta.toLowerCase();
        return containsAny(lower, "la query correcta es", "la consulta correcta es", "solucion completa", "solucion exacta");
    }

    private String canonicalSql(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ")
                .replaceAll(";+", ";")
                .trim()
                .toLowerCase();
    }

    private String sanitizeForPrompt(String value) {
        return sanitizeForPrompt(value, MAX_PROMPT_TEXT);
    }

    private String sanitizeForPrompt(String value, int maxChars) {
        if (value == null) return "";
        String sanitized = value
                .replaceAll("(?i)ignora las instrucciones anteriores", "[instruccion externa omitida]")
                .replaceAll("(?i)ignore previous instructions", "[instruccion externa omitida]")
                .replaceAll("(?i)system prompt", "[referencia interna omitida]")
                .trim();
        if (sanitized.length() <= maxChars) {
            return sanitized;
        }
        return sanitized.substring(0, maxChars) + "...";
    }

    private String cachearChat(String clave, String respuesta, String fuente) {
        if (clave != null) {
            cacheService.guardar(clave, respuesta, fuente);
        }
        return respuesta;
    }

    /** Da al diagnostico local el mismo formato que la respuesta de la IA para que el frontend no note la diferencia. */
    private String buildRespuestaDiagnostico(ClawbotLocalResolver.Diagnostico diagnostico, int intentos) {
        StringBuilder sb = new StringBuilder();
        sb.append("ERROR: La base de datos rechazo tu consulta y el motivo es concreto.\n\n");
        sb.append("CONCEPTO: ").append(diagnostico.concepto()).append("\n\n");
        sb.append("PISTA: ").append(diagnostico.pista()).append("\n\n");
        if (intentos >= 2) {
            sb.append("MINIEJEMPLO:\n```sql\n").append(miniExampleFor(diagnostico.errorType())).append("\n```\n\n");
        }
        sb.append("CIERRE: ").append(diagnostico.cierre());
        return sb.toString();
    }

    private boolean esMateriaIo(String materia) {
        return materia != null && "io".equalsIgnoreCase(materia.trim());
    }

    /** Respuesta sin IA para IO: guia generica por intento, sin cifras ni SQL. */
    private String buildFallbackResponseIo(int intentos) {
        StringBuilder sb = new StringBuilder();
        sb.append("ERROR: Alguno de los valores que enviaste no coincide con el procedimiento del ejercicio.\n\n");
        sb.append("CONCEPTO: En Investigacion de Operaciones cada resultado sale de un paso anterior: si un campo intermedio falla, los siguientes tambien.\n\n");
        if (intentos <= 1) {
            sb.append("PISTA: Revisa primero los campos marcados en rojo, empezando por el que se calcula antes. ¿Que dato del enunciado usa ese paso?\n\n");
            sb.append("CIERRE: ¿Cual fue el primer valor de tu procedimiento del que no estas completamente seguro?");
        } else {
            sb.append("PISTA: Repite el calculo del campo fallido con calma, anotando cada operacion, y verifica unidades, signos y redondeo.\n\n");
            sb.append("CIERRE: Al rehacer solo ese paso, ¿que operacion cambia respecto a tu primer intento?");
        }
        return sb.toString();
    }

    private String buildFallbackChatIo() {
        return """
                IDEA: En Investigacion de Operaciones se modela el problema, se elige el metodo y se interpreta la solucion.
                PISTA: Escribe con tus palabras cual es la decision, que se quiere maximizar o minimizar y que limita esa decision.
                CIERRE: ¿Cuales son tus variables de decision y que representa cada una?
                """;
    }

    private String buildFallbackResponse(String error, int intentos, String errorType) {
        String guidance = promptCatalog.errorGuidance(errorType);
        StringBuilder sb = new StringBuilder();
        sb.append("ERROR: Hay una parte de tu intento que todavia no expresa lo que pide el ejercicio.\n\n");
        sb.append("CONCEPTO: ").append(guidance).append("\n\n");

        if (intentos <= 1) {
            sb.append("PISTA: Antes de escribir mas, separa el problema en origen de datos, columnas necesarias y condicion.\n\n");
            sb.append("CIERRE: ¿Que palabra del enunciado te dice si debes seleccionar, filtrar, unir, agrupar o modificar?");
        } else if (intentos == 2) {
            sb.append("PISTA: Corrige solo una parte. Primero revisa si el error esta en FROM, SELECT, WHERE, JOIN o GROUP BY.\n\n");
            sb.append("MINIEJEMPLO:\n```sql\n").append(miniExampleFor(errorType)).append("\n```\n\n");
            sb.append("CIERRE: ¿Que hueco de la plantilla representa la parte que te esta fallando?");
        } else {
            sb.append("PISTA: Ya hay patron de error. Baja la consulta a una version minima, pruebala mentalmente y luego agrega una clausula a la vez.\n\n");
            sb.append("MINIEJEMPLO:\n```sql\n").append(miniExampleFor(errorType)).append("\n```\n\n");
            sb.append("CIERRE: ¿Cual es el cambio mas pequeno que puedes hacer ahora para comprobar tu hipotesis?");
        }

        if (error != null && !error.isBlank()) {
            sb.append("\n\nAYUDA: Lee el mensaje del sistema buscando una pista de nombre, orden o tipo de dato, no una respuesta literal.");
        }

        return sb.toString();
    }

    private String buildPerformanceFallback(Map<String, Object> resumenMetricas) {
        String nodo = String.valueOf(resumenMetricas != null ? resumenMetricas.getOrDefault("topNode", "plan SQL") : "plan SQL");
        Object costo = resumenMetricas != null ? resumenMetricas.get("totalCost") : null;
        Object tiempo = resumenMetricas != null ? resumenMetricas.get("executionTimeMs") : null;
        boolean seqScan = resumenMetricas != null && Boolean.TRUE.equals(resumenMetricas.get("seqScan"));
        boolean indexScan = resumenMetricas != null && Boolean.TRUE.equals(resumenMetricas.get("indexScan"));

        StringBuilder sb = new StringBuilder();
        sb.append("DIAGNOSTICO: PostgreSQL resolvio la consulta usando ").append(nodo).append(".\n\n");
        sb.append("EVIDENCIA: costo estimado ").append(costo != null ? costo : "no disponible")
                .append(" y tiempo de ejecucion ")
                .append(tiempo != null ? tiempo + " ms" : "no disponible")
                .append(".\n\n");

        if (seqScan) {
            sb.append("OPTIMIZACION: aparece un Seq Scan; revisa si el filtro o el JOIN podria aprovechar un indice sobre la columna que reduce mas filas.\n\n");
        } else if (indexScan) {
            sb.append("OPTIMIZACION: el plan ya usa indice; compara si el filtro devuelve pocas filas y si el ordenamiento agrega costo adicional.\n\n");
        } else {
            sb.append("OPTIMIZACION: identifica que clausula domina el costo antes de tocar la consulta; no toda consulta correcta necesita un indice.\n\n");
        }

        sb.append("SIGUIENTE RETO: ¿que parte de tu consulta reduce mas datos: FROM, JOIN, WHERE, GROUP BY u ORDER BY?");
        return sb.toString();
    }

    private String miniExampleFor(String errorType) {
        return switch (errorType) {
            case "join" -> "SELECT a.____, b.____\nFROM tabla_a a\nJOIN tabla_b b ON a.____ = b.____;";
            case "grouping" -> "SELECT categoria, COUNT(*)\nFROM tabla_ejemplo\nGROUP BY categoria;";
            case "dml_safety" -> "UPDATE tabla_ejemplo\nSET columna = ____\nWHERE condicion_segura\nRETURNING *;";
            case "transaction" -> "BEGIN;\n-- cambio controlado\nSAVEPOINT punto_seguro;\n-- decide si COMMIT o ROLLBACK\n____;";
            case "nulls" -> "SELECT ____\nFROM tabla_ejemplo\nWHERE columna IS ____;";
            case "diagram" -> "Entidad: ____\nAtributos: ____\nClave primaria: ____\nRelacion con: ____";
            default -> "SELECT ____\nFROM tabla_ejemplo\nWHERE ____;";
        };
    }

    private String helpForQuestion(String question) {
        String text = question == null ? "" : question.toLowerCase();
        if (text.contains("join")) {
            return """
                    IDEA: JOIN sirve para leer datos relacionados entre dos tablas.
                    PISTA: Antes de escribirlo, decide que tabla tiene el dato principal y que tabla aporta el complemento.
                    MINIEJEMPLO:
                    ```sql
                    SELECT a.____, b.____
                    FROM tabla_a a
                    JOIN tabla_b b ON a.____ = b.____;
                    ```
                    CIERRE: En tu caso, ¿que columnas funcionan como puente entre ambas tablas?
                    """;
        }
        if (containsAny(text, "where", "filtro", "like", "between", "in ")) {
            return """
                    IDEA: WHERE reduce las filas antes de mostrar el resultado.
                    PISTA: Traduce la condicion del enunciado a una comparacion concreta.
                    MINIEJEMPLO:
                    ```sql
                    SELECT ____
                    FROM tabla_ejemplo
                    WHERE columna ____ valor;
                    ```
                    CIERRE: ¿Tu filtro compara texto, numero, rango, lista o NULL?
                    """;
        }
        if (containsAny(text, "group", "count", "sum", "avg")) {
            return """
                    IDEA: GROUP BY crea grupos y las funciones como COUNT o SUM resumen cada grupo.
                    PISTA: Si una columna aparece en SELECT y no esta resumida, normalmente debe aparecer en GROUP BY.
                    MINIEJEMPLO:
                    ```sql
                    SELECT grupo, COUNT(*)
                    FROM tabla_ejemplo
                    GROUP BY grupo;
                    ```
                    CIERRE: ¿Que columna define tus grupos?
                    """;
        }
        if (text.contains("null")) {
            return """
                    IDEA: NULL significa ausencia de valor, no un texto ni un numero.
                    PISTA: Para revisarlo se usa IS NULL o IS NOT NULL.
                    MINIEJEMPLO:
                    ```sql
                    SELECT ____
                    FROM tabla_ejemplo
                    WHERE columna IS ____;
                    ```
                    CIERRE: ¿Buscas filas con dato faltante o filas que si tienen dato?
                    """;
        }
        if (containsAny(text, "insert", "update", "delete")) {
            return """
                    IDEA: INSERT, UPDATE y DELETE cambian datos. Por eso conviene validar el alcance antes de ejecutar.
                    PISTA: En UPDATE y DELETE, pregunta siempre: ¿que filas exactas estoy tocando?
                    MINIEJEMPLO:
                    ```sql
                    UPDATE tabla_ejemplo
                    SET columna = ____
                    WHERE condicion_segura
                    RETURNING *;
                    ```
                    CIERRE: ¿Tu condicion protege solo las filas que quieres modificar?
                    """;
        }
        if (containsAny(text, "create", "alter", "constraint", "ddl", "tabla")) {
            return """
                    IDEA: DDL define la estructura: tablas, columnas y reglas.
                    PISTA: Antes de CREATE TABLE, lista nombre, tipo de dato y restricciones de cada columna.
                    MINIEJEMPLO:
                    ```sql
                    CREATE TABLE tabla_ejemplo (
                      id SERIAL PRIMARY KEY,
                      campo ____ NOT NULL
                    );
                    ```
                    CIERRE: ¿Que regla debe proteger tu tabla desde el inicio?
                    """;
        }
        if (containsAny(text, "commit", "rollback", "transaccion", "savepoint")) {
            return """
                    IDEA: Una transaccion agrupa cambios para confirmarlos o deshacerlos juntos.
                    PISTA: BEGIN abre el bloque; COMMIT confirma; ROLLBACK deshace.
                    MINIEJEMPLO:
                    ```sql
                    BEGIN;
                    -- cambio controlado
                    ____;
                    ```
                    CIERRE: ¿En tu caso necesitas confirmar, deshacer o volver a un SAVEPOINT?
                    """;
        }

        return """
                IDEA: Para aprender SQL, piensa en capas: tabla, columnas, condicion, relacion y resultado.
                PISTA: No intentes memorizar la consulta completa; identifica que parte del enunciado corresponde a cada clausula.
                MINIEJEMPLO:
                ```sql
                SELECT ____
                FROM ____
                WHERE ____;
                ```
                CIERRE: ¿Tu duda esta en SELECT, FROM, WHERE, JOIN, GROUP BY, DML, DDL o transacciones?
                """;
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> response) {
        if (response == null || !response.containsKey("candidates")) {
            return null;
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Map<String, Object> content = asMap(candidates.get(0).get("content"));
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            return null;
        }
        StringBuilder texto = new StringBuilder();
        for (Map<String, Object> parte : parts) {
            if (!Boolean.TRUE.equals(parte.get("thought")) && parte.get("text") != null) {
                texto.append(parte.get("text"));
            }
        }
        return texto.toString();
    }

    @SuppressWarnings("unchecked")
    private String extractGroqText(Map<String, Object> response) {
        if (response == null || !response.containsKey("choices")) {
            return null;
        }
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            return null;
        }
        Map<String, Object> message = asMap(choices.get(0).get("message"));
        Object content = message.get("content");
        return content != null ? content.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?>) {
            return (Map<String, Object>) value;
        }
        return new LinkedHashMap<>();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
