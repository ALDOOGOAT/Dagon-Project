package com.dagon.backend.service.clawbot;

import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Component
public class ClawbotTelemetryService {

    private final ConcurrentHashMap<String, AtomicLong> questionTopics = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> errorTypes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> moduleErrors = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> sources = new ConcurrentHashMap<>();

    public void recordQuestion(String message) {
        increment(questionTopics, detectQuestionTopic(message));
    }

    public void recordAnalysis(int moduleId, String errorType) {
        increment(errorTypes, errorType);
        increment(moduleErrors, "modulo_" + moduleId + ":" + errorType);
    }

    public void recordSource(String source) {
        increment(sources, source);
    }

    public Map<String, Object> snapshot() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("preguntas_frecuentes", top(questionTopics, 10));
        data.put("errores_comunes", top(errorTypes, 10));
        data.put("errores_por_modulo", top(moduleErrors, 20));
        data.put("fuentes_respuesta", top(sources, 10));
        data.put("ahorro", resumenAhorro());
        return data;
    }

    /** Cuantas respuestas se resolvieron sin gastar un token de Gemini o Groq. */
    private Map<String, Object> resumenAhorro() {
        long sinIa = 0;
        long conIa = 0;
        for (Map.Entry<String, AtomicLong> entry : sources.entrySet()) {
            String fuente = entry.getKey();
            long veces = entry.getValue().get();
            if (fuente.startsWith("local_") || fuente.startsWith("cache_") || fuente.startsWith("guardrail_")) {
                sinIa += veces;
            } else {
                conIa += veces;
            }
        }
        long total = sinIa + conIa;
        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("respuestas_sin_ia", sinIa);
        resumen.put("respuestas_con_ia", conIa);
        resumen.put("porcentaje_ahorrado", total == 0 ? 0 : Math.round(sinIa * 1000.0 / total) / 10.0);
        return resumen;
    }

    private void increment(ConcurrentHashMap<String, AtomicLong> map, String key) {
        map.computeIfAbsent(key, ignored -> new AtomicLong()).incrementAndGet();
    }

    private Map<String, Long> top(ConcurrentHashMap<String, AtomicLong> map, int limit) {
        return map.entrySet().stream()
                .sorted(Map.Entry.<String, AtomicLong>comparingByValue(Comparator.comparingLong(AtomicLong::get)).reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().get(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    private String detectQuestionTopic(String message) {
        String text = message == null ? "" : message.toLowerCase();
        if (text.contains("join") || text.contains("relacion")) return "join";
        if (text.contains("where") || text.contains("filtro") || text.contains("like") || text.contains("between")) return "filtros";
        if (text.contains("group") || text.contains("count") || text.contains("sum") || text.contains("avg")) return "agregaciones";
        if (text.contains("insert") || text.contains("update") || text.contains("delete")) return "dml";
        if (text.contains("create") || text.contains("alter") || text.contains("constraint") || text.contains("tabla")) return "ddl";
        if (text.contains("trigger")) return "triggers";
        if (text.contains("funcion") || text.contains("function")) return "funciones";
        if (text.contains("transaccion") || text.contains("commit") || text.contains("rollback")) return "transacciones";
        if (text.contains("null")) return "nulls";
        if (text.contains("permiso") || text.contains("rol") || text.contains("grant") || text.contains("revoke")) return "seguridad";
        return "sql_general";
    }
}
