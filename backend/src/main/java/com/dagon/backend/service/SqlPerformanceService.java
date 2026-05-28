package com.dagon.backend.service;

import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.service.validation.SandboxSqlPolicy;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class SqlPerformanceService {

    private static final int MAX_OPERACIONES_PLAN = 8;

    private final SandboxSqlPolicy sandboxSqlPolicy;
    private final ClawbotService clawbotService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${dagon.sandbox.url}")
    private String sandboxUrl;

    @Value("${dagon.sandbox.username}")
    private String sandboxUser;

    @Value("${dagon.sandbox.password}")
    private String sandboxPassword;

    public SqlPerformanceService(SandboxSqlPolicy sandboxSqlPolicy, ClawbotService clawbotService) {
        this.sandboxSqlPolicy = sandboxSqlPolicy;
        this.clawbotService = clawbotService;
    }

    public Optional<SqlPerformanceReport> analizarConsultaExitosa(
            EjercicioPractico ejercicio,
            String queryUsuario,
            String usuarioId
    ) {
        if (!esConsultaAnalizable(queryUsuario)) {
            return Optional.empty();
        }

        try {
            String planJson = ejecutarExplainAnalyze(queryUsuario, usuarioId);
            Map<String, Object> resumen = extraerResumenPlan(planJson);
            String analisis = clawbotService.analizarPlanEjecucion(
                    ejercicio != null ? ejercicio.getEnunciado() : "",
                    queryUsuario,
                    planJson,
                    resumen
            );

            return Optional.of(new SqlPerformanceReport(
                    obtenerDouble(resumen.get("totalCost")),
                    obtenerDouble(resumen.get("executionTimeMs")),
                    obtenerDouble(resumen.get("planningTimeMs")),
                    obtenerDouble(resumen.get("actualTotalTimeMs")),
                    String.valueOf(resumen.getOrDefault("topNode", "Plan SQL")),
                    Boolean.TRUE.equals(resumen.get("seqScan")),
                    resumen,
                    analisis
            ));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String ejecutarExplainAnalyze(String queryUsuario, String usuarioId) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        String sentencia = normalizarSentenciaAnalizable(queryUsuario);

        try (Connection conn = DriverManager.getConnection(sandboxUrl, sandboxUser, sandboxPassword);
             Statement stmt = conn.createStatement()) {
            conn.setAutoCommit(false);
            try {
                stmt.setQueryTimeout(5);
                stmt.execute("SET TRANSACTION READ ONLY");
                stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));
                stmt.execute("SET LOCAL statement_timeout = '4500ms'");
                stmt.execute("SET LOCAL lock_timeout = '1000ms'");

                try (ResultSet rs = stmt.executeQuery("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + sentencia)) {
                    if (rs.next()) {
                        Object plan = rs.getObject(1);
                        return plan != null ? plan.toString() : "[]";
                    }
                }
            } finally {
                conn.rollback();
            }
        }

        return "[]";
    }

    private boolean esConsultaAnalizable(String queryUsuario) {
        String sentencia = normalizarSentenciaAnalizable(queryUsuario);
        if (sentencia.isBlank()) {
            return false;
        }

        List<String> sentencias = separarSentencias(sentencia);
        if (sentencias.size() != 1) {
            return false;
        }

        String upper = sentencia.toUpperCase(Locale.ROOT);
        if (!(upper.startsWith("SELECT") || upper.startsWith("WITH"))) {
            return false;
        }

        return !upper.matches("[\\s\\S]*\\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|CALL|DO|COPY)\\b[\\s\\S]*");
    }

    private String normalizarSentenciaAnalizable(String queryUsuario) {
        if (queryUsuario == null) {
            return "";
        }
        return queryUsuario
                .replaceAll("(?m)^\\s*--.*$", "")
                .trim()
                .replaceAll(";\\s*$", "");
    }

    private List<String> separarSentencias(String queryUsuario) {
        List<String> sentencias = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        boolean enComillaSimple = false;
        boolean enComillaDoble = false;

        for (int i = 0; i < queryUsuario.length(); i++) {
            char c = queryUsuario.charAt(i);
            if (c == '\'' && !enComillaDoble) {
                enComillaSimple = !enComillaSimple;
            } else if (c == '"' && !enComillaSimple) {
                enComillaDoble = !enComillaDoble;
            }

            if (c == ';' && !enComillaSimple && !enComillaDoble) {
                String stmt = actual.toString().trim();
                if (!stmt.isEmpty()) {
                    sentencias.add(stmt);
                }
                actual.setLength(0);
            } else {
                actual.append(c);
            }
        }

        String restante = actual.toString().trim();
        if (!restante.isEmpty()) {
            sentencias.add(restante);
        }
        return sentencias;
    }

    private Map<String, Object> extraerResumenPlan(String planJson) throws Exception {
        Map<String, Object> resumen = new LinkedHashMap<>();
        JsonNode root = mapper.readTree(planJson);
        JsonNode explain = root.isArray() && root.size() > 0 ? root.get(0) : root;
        JsonNode plan = explain.path("Plan");

        resumen.put("totalCost", leerDouble(plan, "Total Cost"));
        resumen.put("startupCost", leerDouble(plan, "Startup Cost"));
        resumen.put("planRows", leerDouble(plan, "Plan Rows"));
        resumen.put("planWidth", leerDouble(plan, "Plan Width"));
        resumen.put("actualTotalTimeMs", leerDouble(plan, "Actual Total Time"));
        resumen.put("executionTimeMs", leerDouble(explain, "Execution Time"));
        resumen.put("planningTimeMs", leerDouble(explain, "Planning Time"));
        resumen.put("topNode", plan.path("Node Type").asText("Plan SQL"));

        List<String> operaciones = new ArrayList<>();
        recolectarOperaciones(plan, operaciones);
        resumen.put("operations", operaciones);
        resumen.put("seqScan", contieneOperacion(plan, "Seq Scan"));
        resumen.put("indexScan", contieneOperacion(plan, "Index Scan") || contieneOperacion(plan, "Index Only Scan"));
        resumen.put("join", contieneTextoOperacion(operaciones, "Join"));
        resumen.put("aggregate", contieneTextoOperacion(operaciones, "Aggregate"));

        return resumen;
    }

    private void recolectarOperaciones(JsonNode node, List<String> operaciones) {
        if (node == null || node.isMissingNode() || operaciones.size() >= MAX_OPERACIONES_PLAN) {
            return;
        }

        String tipo = node.path("Node Type").asText(null);
        if (tipo != null && !tipo.isBlank()) {
            operaciones.add(tipo);
        }

        JsonNode hijos = node.path("Plans");
        if (hijos.isArray()) {
            for (JsonNode hijo : hijos) {
                recolectarOperaciones(hijo, operaciones);
                if (operaciones.size() >= MAX_OPERACIONES_PLAN) {
                    return;
                }
            }
        }
    }

    private boolean contieneOperacion(JsonNode node, String operacion) {
        if (node == null || node.isMissingNode()) {
            return false;
        }
        if (operacion.equalsIgnoreCase(node.path("Node Type").asText())) {
            return true;
        }
        JsonNode hijos = node.path("Plans");
        if (hijos.isArray()) {
            for (JsonNode hijo : hijos) {
                if (contieneOperacion(hijo, operacion)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean contieneTextoOperacion(List<String> operaciones, String texto) {
        for (String operacion : operaciones) {
            if (operacion != null && operacion.toLowerCase(Locale.ROOT).contains(texto.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private Double leerDouble(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.asDouble() : null;
    }

    private Double obtenerDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return null;
    }

    public record SqlPerformanceReport(
            Double totalCost,
            Double executionTimeMs,
            Double planningTimeMs,
            Double actualTotalTimeMs,
            String topNode,
            boolean seqScan,
            Map<String, Object> resumen,
            String analisis
    ) {
        public Map<String, Object> toResponseMap() {
            Map<String, Object> response = new LinkedHashMap<>(resumen);
            response.put("available", true);
            response.put("source", "EXPLAIN ANALYZE");
            response.put("analysis", analisis);
            return response;
        }
    }
}
