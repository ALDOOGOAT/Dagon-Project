package com.dagon.backend.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ModelingService {

    private static final Pattern CREATE_TABLE_PATTERN = Pattern.compile(
            "(?is)^CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([\\w\".]+)\\s*\\((.*)\\)$"
    );
    private static final Pattern FOREIGN_KEY_PATTERN = Pattern.compile(
            "(?is)(?:CONSTRAINT\\s+[\\w\"]+\\s+)?FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+([\\w\".]+)\\s*\\(([^)]+)\\)"
    );
    private static final Pattern INLINE_REFERENCES_PATTERN = Pattern.compile(
            "(?is)REFERENCES\\s+([\\w\".]+)\\s*\\(([^)]+)\\)"
    );

    public Map<String, Object> construirErdDesdeDdl(String ddl) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();
        Map<String, String> tableIds = new LinkedHashMap<>();

        for (String statement : separarSentencias(limpiarSql(ddl))) {
            Matcher matcher = CREATE_TABLE_PATTERN.matcher(statement);
            if (!matcher.find()) {
                continue;
            }

            String tableName = normalizarIdentificador(matcher.group(1));
            String tableId = crearIdTabla(tableName);
            tableIds.put(tableName.toLowerCase(Locale.ROOT), tableId);

            List<Map<String, Object>> columns = new ArrayList<>();
            List<ForeignKeyCandidate> relacionesPendientes = new ArrayList<>();
            List<String> primaryKeys = new ArrayList<>();

            for (String definition : dividirPorComasNivelSuperior(matcher.group(2))) {
                String clean = definition.trim();
                if (clean.isEmpty()) {
                    continue;
                }

                Matcher fkMatcher = FOREIGN_KEY_PATTERN.matcher(clean);
                if (fkMatcher.find()) {
                    relacionesPendientes.add(new ForeignKeyCandidate(
                            limpiarColumna(fkMatcher.group(1)),
                            normalizarIdentificador(fkMatcher.group(2)),
                            limpiarColumna(fkMatcher.group(3))
                    ));
                    marcarRolColumna(columns, limpiarColumna(fkMatcher.group(1)), "fk");
                    continue;
                }

                if (clean.toUpperCase(Locale.ROOT).startsWith("PRIMARY KEY")) {
                    primaryKeys.addAll(extraerColumnasEntreParentesis(clean));
                    continue;
                }

                ColumnDefinition column = parseColumnDefinition(clean);
                if (column == null) {
                    continue;
                }

                Map<String, Object> columnMap = new LinkedHashMap<>();
                columnMap.put("name", column.name());
                columnMap.put("role", column.primaryKey() ? "pk" : column.foreignKey() ? "fk" : "normal");
                columnMap.put("type", column.type());
                columns.add(columnMap);

                if (column.primaryKey()) {
                    primaryKeys.add(column.name());
                }
                if (column.referenceTable() != null) {
                    relacionesPendientes.add(new ForeignKeyCandidate(column.name(), column.referenceTable(), column.referenceColumn()));
                }
            }

            for (String pk : primaryKeys) {
                marcarRolColumna(columns, pk, "pk");
            }

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", tableId);
            node.put("type", "tableNode");
            node.put("position", Map.of("x", 80 + (nodes.size() % 3) * 310, "y", 80 + (nodes.size() / 3) * 250));
            node.put("data", Map.of("label", tableName, "columns", columns));
            nodes.add(node);

            for (ForeignKeyCandidate fk : relacionesPendientes) {
                String targetId = tableIds.getOrDefault(fk.referenceTable().toLowerCase(Locale.ROOT), crearIdTabla(fk.referenceTable()));
                edges.add(crearRelacion(tableId, targetId, fk.column(), fk.referenceColumn()));
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nodes", nodes);
        response.put("edges", edges);
        response.put("ddl", generarDdlDesdeDiagrama(nodes, edges));
        return response;
    }

    public String generarDdlDesdeDiagrama(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        StringBuilder ddl = new StringBuilder();

        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = asMap(node.get("data"));
            String table = sanitizarIdentificador(String.valueOf(data.getOrDefault("label", "tabla")));
            List<Map<String, Object>> columns = asList(data.get("columns"));
            if (columns.isEmpty()) {
                columns = List.of(Map.of("name", "id", "role", "pk", "type", "INTEGER"));
            }

            ddl.append("CREATE TABLE ").append(table).append(" (\n");
            List<String> lines = new ArrayList<>();
            for (Map<String, Object> column : columns) {
                String name = sanitizarIdentificador(String.valueOf(column.getOrDefault("name", "columna")));
                String role = String.valueOf(column.getOrDefault("role", "normal"));
                String type = String.valueOf(column.getOrDefault("type", "")).trim();
                if (type.isBlank()) {
                    type = "pk".equals(role) || "fk".equals(role) ? "INTEGER" : "TEXT";
                }
                String line = "    " + name + " " + type;
                if ("pk".equals(role)) {
                    line += " PRIMARY KEY";
                }
                lines.add(line);
            }
            ddl.append(String.join(",\n", lines)).append("\n);\n\n");
        }

        for (Map<String, Object> edge : edges) {
            String source = buscarTablaPorId(nodes, String.valueOf(edge.get("source")));
            String target = buscarTablaPorId(nodes, String.valueOf(edge.get("target")));
            if (source == null || target == null) {
                continue;
            }
            String sourceColumn = buscarColumnaFk(nodes, String.valueOf(edge.get("source")), target);
            String targetPk = buscarColumnaPk(nodes, String.valueOf(edge.get("target")));
            ddl.append("ALTER TABLE ").append(source)
                    .append(" ADD CONSTRAINT fk_")
                    .append(source).append("_").append(target)
                    .append(" FOREIGN KEY (").append(sourceColumn).append(")")
                    .append(" REFERENCES ").append(target).append("(").append(targetPk).append(");\n");
        }

        return ddl.toString().trim();
    }

    private ColumnDefinition parseColumnDefinition(String definition) {
        String[] parts = definition.trim().split("\\s+", 2);
        if (parts.length == 0 || parts[0].isBlank()) {
            return null;
        }

        String name = normalizarIdentificador(parts[0]);
        String rest = parts.length > 1 ? parts[1].trim() : "TEXT";
        String upper = rest.toUpperCase(Locale.ROOT);
        Matcher references = INLINE_REFERENCES_PATTERN.matcher(rest);
        String referenceTable = null;
        String referenceColumn = null;
        if (references.find()) {
            referenceTable = normalizarIdentificador(references.group(1));
            referenceColumn = limpiarColumna(references.group(2));
        }

        String type = rest
                .replaceAll("(?is)PRIMARY\\s+KEY", "")
                .replaceAll("(?is)REFERENCES\\s+[\\w\".]+\\s*\\([^)]+\\)", "")
                .replaceAll("(?is)NOT\\s+NULL", "")
                .replaceAll("(?is)UNIQUE", "")
                .trim();
        if (type.isBlank()) {
            type = "TEXT";
        }

        return new ColumnDefinition(name, type, upper.contains("PRIMARY KEY"), referenceTable != null, referenceTable, referenceColumn);
    }

    private Map<String, Object> crearRelacion(String source, String target, String sourceColumn, String targetColumn) {
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("id", "e-" + source + "-" + target + "-" + sourceColumn);
        edge.put("source", source);
        edge.put("target", target);
        edge.put("type", "relationshipEdge");
        edge.put("animated", true);
        edge.put("style", Map.of("stroke", "#22d3ee", "strokeWidth", 2));
        edge.put("data", Map.of(
                "cardinality", "1:N",
                "sourceColumn", sourceColumn,
                "targetColumn", targetColumn
        ));
        return edge;
    }

    private List<String> separarSentencias(String sql) {
        List<String> sentencias = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        boolean enSimple = false;
        boolean enDoble = false;
        int nivelParentesis = 0;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);
            if (c == '\'' && !enDoble) {
                enSimple = !enSimple;
            } else if (c == '"' && !enSimple) {
                enDoble = !enDoble;
            } else if (c == '(' && !enSimple && !enDoble) {
                nivelParentesis++;
            } else if (c == ')' && !enSimple && !enDoble && nivelParentesis > 0) {
                nivelParentesis--;
            }

            if (c == ';' && !enSimple && !enDoble && nivelParentesis == 0) {
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

    private List<String> dividirPorComasNivelSuperior(String value) {
        List<String> partes = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        boolean enSimple = false;
        boolean enDoble = false;
        int nivel = 0;

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\'' && !enDoble) {
                enSimple = !enSimple;
            } else if (c == '"' && !enSimple) {
                enDoble = !enDoble;
            } else if (c == '(' && !enSimple && !enDoble) {
                nivel++;
            } else if (c == ')' && !enSimple && !enDoble && nivel > 0) {
                nivel--;
            }

            if (c == ',' && !enSimple && !enDoble && nivel == 0) {
                partes.add(actual.toString());
                actual.setLength(0);
            } else {
                actual.append(c);
            }
        }
        partes.add(actual.toString());
        return partes;
    }

    private String limpiarSql(String sql) {
        if (sql == null) {
            return "";
        }
        return sql.replaceAll("(?m)^\\s*--.*$", "").trim();
    }

    private List<String> extraerColumnasEntreParentesis(String value) {
        int start = value.indexOf('(');
        int end = value.lastIndexOf(')');
        if (start < 0 || end <= start) {
            return List.of();
        }
        List<String> columns = new ArrayList<>();
        for (String item : value.substring(start + 1, end).split(",")) {
            columns.add(limpiarColumna(item));
        }
        return columns;
    }

    private void marcarRolColumna(List<Map<String, Object>> columns, String columnName, String role) {
        for (Map<String, Object> column : columns) {
            if (columnName.equalsIgnoreCase(String.valueOf(column.get("name")))) {
                column.put("role", role);
            }
        }
    }

    private String normalizarIdentificador(String value) {
        String clean = value == null ? "" : value.trim().replace("\"", "");
        if (clean.contains(".")) {
            String[] parts = clean.split("\\.");
            clean = parts[parts.length - 1];
        }
        return sanitizarIdentificador(clean);
    }

    private String limpiarColumna(String value) {
        return sanitizarIdentificador(value == null ? "columna" : value.replace("\"", "").trim().split(",")[0].trim());
    }

    private String sanitizarIdentificador(String value) {
        String clean = value == null ? "" : value.trim().replaceAll("[^a-zA-Z0-9_]", "_");
        if (clean.isBlank()) {
            return "tabla";
        }
        if (Character.isDigit(clean.charAt(0))) {
            clean = "_" + clean;
        }
        return clean.toLowerCase(Locale.ROOT);
    }

    private String crearIdTabla(String tableName) {
        return "table-" + sanitizarIdentificador(tableName);
    }

    private String buscarTablaPorId(List<Map<String, Object>> nodes, String id) {
        for (Map<String, Object> node : nodes) {
            if (id.equals(String.valueOf(node.get("id")))) {
                Map<String, Object> data = asMap(node.get("data"));
                return sanitizarIdentificador(String.valueOf(data.getOrDefault("label", "tabla")));
            }
        }
        return null;
    }

    private String buscarColumnaPk(List<Map<String, Object>> nodes, String nodeId) {
        for (Map<String, Object> node : nodes) {
            if (!nodeId.equals(String.valueOf(node.get("id")))) {
                continue;
            }
            for (Map<String, Object> column : asList(asMap(node.get("data")).get("columns"))) {
                if ("pk".equals(String.valueOf(column.getOrDefault("role", "normal")))) {
                    return sanitizarIdentificador(String.valueOf(column.getOrDefault("name", "id")));
                }
            }
        }
        return "id";
    }

    private String buscarColumnaFk(List<Map<String, Object>> nodes, String sourceId, String targetTable) {
        for (Map<String, Object> node : nodes) {
            if (!sourceId.equals(String.valueOf(node.get("id")))) {
                continue;
            }
            for (Map<String, Object> column : asList(asMap(node.get("data")).get("columns"))) {
                if ("fk".equals(String.valueOf(column.getOrDefault("role", "normal")))) {
                    return sanitizarIdentificador(String.valueOf(column.getOrDefault("name", targetTable + "_id")));
                }
            }
        }
        return targetTable + "_id";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asList(Object value) {
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }

    private record ColumnDefinition(
            String name,
            String type,
            boolean primaryKey,
            boolean foreignKey,
            String referenceTable,
            String referenceColumn
    ) {}

    private record ForeignKeyCandidate(String column, String referenceTable, String referenceColumn) {}
}
