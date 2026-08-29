package com.dagon.backend.service;

import com.dagon.backend.service.validation.SandboxSqlPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Ejecuta consultas del alumno en el datasource sandbox (rol app_sandbox_user,
 * search_path por usuario, timeouts). Extraído de EjercicioService para separar
 * "cómo se corre una query en el sandbox" de "cómo se valida un ejercicio".
 */
@Service
public class SandboxExecutionService {

    @Autowired
    private SandboxSqlPolicy sandboxSqlPolicy;

    @Value("${dagon.sandbox.url}")
    private String sandboxUrl;

    @Value("${dagon.sandbox.username}")
    private String sandboxUser;

    @Value("${dagon.sandbox.password}")
    private String sandboxPassword;

    @Value("${dagon.sandbox.statement-timeout-ms:8000}")
    private Integer sandboxStatementTimeoutMs;

    public List<Map<String, Object>> ejecutarEnSandboxConRollback(String query, String usuarioId) throws java.sql.SQLException {
        return ejecutarEnSandboxConRollback(query, usuarioId, null);
    }

    public List<Map<String, Object>> ejecutarEnSandboxConRollback(String query, String usuarioId, Integer statementTimeoutMs) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            conn.setAutoCommit(false); // Iniciar transacción
            try (Statement stmt = conn.createStatement()) {
                aplicarTimeoutSandbox(stmt, statementTimeoutMs);
                stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));

                boolean tieneResultSet = stmt.execute(query);
                if (tieneResultSet) {
                    try (ResultSet rs = stmt.getResultSet()) {
                        ResultSetMetaData metaData = rs.getMetaData();
                        int columnCount = metaData.getColumnCount();
                        while (rs.next()) {
                            Map<String, Object> fila = new LinkedHashMap<>();
                            for (int i = 1; i <= columnCount; i++) {
                                fila.put(metaData.getColumnName(i).toLowerCase(), rs.getObject(i) != null ? rs.getObject(i).toString() : null);
                            }
                            resultados.add(fila);
                        }
                    }
                }
            } finally {
                conn.rollback(); // Deshacer cambios siempre
            }
        }
        return resultados;
    }

    public List<Map<String, Object>> ejecutarEnSandbox(String queryUsuario, String usuarioId) throws java.sql.SQLException {
        return ejecutarEnSandbox(queryUsuario, usuarioId, null);
    }

    public List<Map<String, Object>> ejecutarEnSandbox(String queryUsuario, String usuarioId, Integer statementTimeoutMs) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        String queryProcesada = queryUsuario.trim();
        String upperQuery = queryProcesada.toUpperCase();

        queryProcesada = queryProcesada.replaceAll("--.*$", "").trim();

        // 🌟 LÓGICA CURADA (REGEX OPTIMIZADO)
        // Solo será true si la consulta EMPIEZA con INSERT, UPDATE o DELETE, ignorando SELECT ... FOR UPDATE
        boolean esDML = upperQuery.matches("^\\s*(INSERT|UPDATE|DELETE)\\b[\\s\\S]*");
        boolean esDDL = upperQuery.matches("^\\s*(CREATE|ALTER|DROP)\\b[\\s\\S]*");

        if (esDML && !upperQuery.contains("RETURNING")) {
            queryProcesada = queryProcesada.replaceAll(";\\s*$", "");
            queryProcesada += " RETURNING *;";
        }

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            aplicarTimeoutSandbox(stmt, statementTimeoutMs);

            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                String searchPath = sandboxSqlPolicy.resolverSearchPath(usuarioId);
                // Intentar crear el esquema si no existe (fail-safe)
                try {
                    stmt.execute("CREATE SCHEMA IF NOT EXISTS \"" + searchPath + "\";");
                    stmt.execute("GRANT ALL ON SCHEMA \"" + searchPath + "\" TO app_sandbox_user;");
                } catch (Exception ignored) {}

                stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));
            } else {
                stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));
            }

            boolean tieneResultSet = false;
            try {
                tieneResultSet = stmt.execute(queryProcesada);
            } catch (java.sql.SQLException e) {
                String sqlState = e.getSQLState();
                // 42P07 es 'relation_already_exists' en PostgreSQL
                if ("42P07".equals(sqlState) || e.getMessage().contains("already exists")) {
                    // Es un DDL que ya se ejecutó antes. No es error, es éxito previo.
                    tieneResultSet = false;
                } else {
                    throw e; // Re-lanzar si es un error de sintaxis real u otro
                }
            }

            if ((esDDL || esDML) && !tieneResultSet) {
                String tablaExtraida = extraerNombreTablaDDL(upperQuery, queryUsuario);
                if (tablaExtraida != null) {
                    // 🌟 MAGIA VISUAL: Si es un CREATE TABLE, mostramos su estructura (Blueprint)
                    if (upperQuery.contains("CREATE TABLE")) {
                        String consultaEstructura = "SELECT column_name AS columna, data_type AS tipo_dato, is_nullable AS permite_nulos "
                            + "FROM information_schema.columns "
                            + "WHERE table_name = '" + tablaExtraida + "' "
                            + "AND table_schema = current_schema() "
                            + "ORDER BY ordinal_position;";
                        try {
                            tieneResultSet = stmt.execute(consultaEstructura);
                        } catch (Exception ignored) {}
                    } else {
                        // Para INSERT, UPDATE o ALTER, mostramos los datos reales
                        String consultaMostrar = "SELECT * FROM \"" + tablaExtraida + "\" LIMIT 100;";
                        try {
                            tieneResultSet = stmt.execute(consultaMostrar);
                        } catch (Exception ignored) {}
                    }
                }
            }

            if (tieneResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int columnCount = metaData.getColumnCount();

                    while (rs.next()) {
                        Map<String, Object> fila = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            Object val = rs.getObject(i);
                            fila.put(metaData.getColumnName(i).toLowerCase(), val != null ? val.toString() : null);
                        }
                        resultados.add(fila);
                    }
                }
            }
        }
        return resultados;
    }

    private void aplicarTimeoutSandbox(Statement stmt, Integer statementTimeoutMs) throws java.sql.SQLException {
        Integer timeoutSeguro = statementTimeoutMs != null ? statementTimeoutMs : sandboxStatementTimeoutMs;
        if (timeoutSeguro == null || timeoutSeguro <= 0) {
            return;
        }

        int segundos = Math.max(1, (int) Math.ceil(timeoutSeguro / 1000.0));
        stmt.setQueryTimeout(segundos);
        stmt.execute("SET statement_timeout = " + Math.max(250, timeoutSeguro));
    }

    /**
     * Deriva el nombre de tabla de un CREATE/ALTER/DROP TABLE para mostrarlo tras ejecutarlo.
     * Descarta el "IF [NOT] EXISTS" opcional y limpia el ';' o las comillas finales: el nombre
     * se reinyecta en consultas como SELECT * FROM "<tabla>", asi que cualquier basura pegada
     * hace que esa consulta falle en silencio y el alumno se quede sin panel de datos.
     */
    public String extraerNombreTablaDDL(String upperQuery, String queryOriginal) {
        String tabla = null;

        if (upperQuery.contains("CREATE TABLE")) {
            String sinCreate = queryOriginal.replaceAll("(?i)CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?", "").trim();
            String[] partes = sinCreate.split("[\\(,\\s]");
            if (partes.length > 0) {
                tabla = partes[0];
            }
        } else if (upperQuery.contains("ALTER TABLE")) {
            String sinAlter = queryOriginal.replaceAll("(?i)ALTER\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?", "").trim();
            String[] partes = sinAlter.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0];
            }
        } else if (upperQuery.contains("DROP TABLE")) {
            String sinDrop = queryOriginal.replaceAll("(?i)DROP\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?", "").trim();
            String[] partes = sinDrop.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0];
            }
        }

        if (tabla != null) {
            tabla = tabla.replaceAll("[\\(\\);\"']", "").trim();
            if (tabla.isEmpty()) {
                tabla = null;
            }
        }

        return tabla;
    }
}
