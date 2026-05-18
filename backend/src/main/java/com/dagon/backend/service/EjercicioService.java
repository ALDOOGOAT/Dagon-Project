package com.dagon.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import com.dagon.backend.service.validation.EjercicioValidationRouter;
import com.dagon.backend.service.validation.SandboxSqlPolicy;
import com.dagon.backend.service.validation.TipoValidacionEjercicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.*;

@Service
public class EjercicioService {
    private static final int PRACTICA_RAPIDA_XP = 5;
    private static final int PRACTICA_RAPIDA_XP_DIARIA_MAX = 25;
    private static final int PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP = PRACTICA_RAPIDA_XP_DIARIA_MAX / PRACTICA_RAPIDA_XP;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private EjercicioPracticoRepository repository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private EjercicioValidationRouter validationRouter;

    @Autowired
    private SandboxSqlPolicy sandboxSqlPolicy;

    @Value("${dagon.sandbox.url}")
    private String sandboxUrl;

    @Value("${dagon.sandbox.username}")
    private String sandboxUser;

    @Value("${dagon.sandbox.password}")
    private String sandboxPassword;

    public List<NivelDTO> obtenerTodosLosNiveles() {
        List<NivelDTO> modulos = new ArrayList<>();
        NivelDTO modulo1 = new NivelDTO();
        modulo1.setId(1);
        modulo1.setName("Módulo 1: Selección Básica");
        modulo1.setDescription("Aprende a consultar datos con SELECT y filtros WHERE.");
        modulo1.setLocked(false);
        modulos.add(modulo1);
        return modulos;
    }

    public List<EjercicioDTO> obtenerEjerciciosPorModulo(Integer moduloId) {
        List<EjercicioPractico> crudos = repository.findByIdModuloOrderByOrdenAsc(moduloId);
        List<EjercicioDTO> dtos = new ArrayList<>();

        int contador = 1;
        for(EjercicioPractico ej : crudos) {
            EjercicioDTO dto = new EjercicioDTO();
            dto.setId(ej.getIdEjercicio());
            dto.setTitle(ej.getTitulo() != null ? ej.getTitulo() : "Misión " + contador);
            dto.setDescription(ej.getEnunciado());
            dto.setOrden(ej.getOrden() != null ? ej.getOrden() : contador);
            dto.setIdModulo(ej.getIdModulo());
            dto.setDifficulty(ej.getDificultad() != null ? ej.getDificultad() : 1);
            dto.setXpReward("RAPIDA".equals(ej.getTipoMision()) ? PRACTICA_RAPIDA_XP : dto.getDifficulty() * 10);
            dto.setTimeLimitSeconds(calcularTiempoPractica(ej.getQueryMaestra(), dto.getDifficulty()));
            dto.setConcept(construirConceptoPractica(ej.getQueryMaestra(), ej.getIdModulo()));

            String formato = ej.getFormato();

            if (formato == null || formato.isEmpty()) {
                boolean usarDragAndDrop = false;
                if (moduloId == 1) {
                    usarDragAndDrop = true;
                } else if (moduloId == 2) {
                    usarDragAndDrop = (contador == 1 || contador == 3);
                } else {
                    usarDragAndDrop = (contador == 2);
                }
                formato = usarDragAndDrop ? "drag_drop" : "editor";
            }

            dto.setType(formato);

            if ("drag_drop".equals(formato)) {
                dto.setHint("Pista: Arrastra las palabras azules al área de armado. No olvides el punto y coma (;)");
                String queryReal = ej.getQueryMaestra();
                    if (queryReal != null) {
                        List<String> bancoPalabras = new ArrayList<>();

                        for (String palabra : queryReal.replaceAll(";", " ;").split("\\s+")) {
                            if (palabra != null && !palabra.trim().isEmpty()) {
                                bancoPalabras.add(palabra.trim());
                            }
                        }

                        bancoPalabras.addAll(Arrays.asList(
                            "WHERE", "JOIN", "ON", "COUNT", "*", "roles", "cursos", "INSERT", "equipamiento"
                        ));

                        if (moduloId == 1) {
                            bancoPalabras.addAll(Arrays.asList(
                                "aventureros", "DELETE", "UPDATE", "GROUP", "BY", "HAVING",
                                "ASC", "LIMIT", "ORDER", "LIKE", "DESC", "nombre", "nivel", "clase"
                            ));
                        }

                        Collections.shuffle(bancoPalabras);
                        dto.setWordBank(bancoPalabras);
                    }
            } else if ("diagram".equals(formato)) {
                dto.setHint("Pista: Arrastra una nueva entidad, ponle nombre y conéctala arrastrando desde el punto cyan hasta el fucsia.");
                dto.setStarterCode("");
            } else {
                dto.setStarterCode("-- Escribe tu consulta SQL aquí\n");
                dto.setHint("Pista: Recuerda usar la sintaxis correcta y terminar con punto y coma (;).");
            }

            dto.setPedagogia(construirPedagogiaEjercicio(ej));
            dtos.add(dto);
            contador++;
        }
        return dtos;
    }

    public Map<String, Object> obtenerMetadataModulo(Integer moduloId) {
        String sql = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida, " +
                "objetivos::text AS objetivos, prerequisitos::text AS prerequisitos, " +
                "errores_comunes::text AS errores_comunes, cinematica_config::text AS cinematica_config " +
                "FROM lms_core.modulos WHERE id_modulo = ?";

        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(sql, moduloId);
            return construirMetadataModulo(row);
        } catch (Exception e) {
            String fallbackSql = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida " +
                    "FROM lms_core.modulos WHERE id_modulo = ?";
            try {
                Map<String, Object> row = jdbcTemplate.queryForMap(fallbackSql, moduloId);
                return construirMetadataModulo(row);
            } catch (Exception ignored) {
                return Map.of("id_modulo", moduloId);
            }
        }
    }

    private Map<String, Object> construirMetadataModulo(Map<String, Object> row) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("id_modulo", row.get("id_modulo"));
        metadata.put("id_curso", row.get("id_curso"));
        metadata.put("titulo", row.get("titulo"));
        metadata.put("descripcion", row.get("descripcion"));
        metadata.put("orden", row.get("orden"));
        metadata.put("xp_requerida", row.get("xp_requerida"));
        metadata.put("objetivos", parseJsonColumn(row.get("objetivos"), List.of()));
        metadata.put("prerequisitos", parseJsonColumn(row.get("prerequisitos"), List.of()));
        metadata.put("errores_comunes", parseJsonColumn(row.get("errores_comunes"), List.of()));
        metadata.put("cinematica_config", parseJsonColumn(row.get("cinematica_config"), Map.of()));
        return metadata;
    }

    private Object parseJsonColumn(Object rawValue, Object fallback) {
        if (rawValue == null) return fallback;

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(rawValue.toString());
            return mapper.convertValue(node, Object.class);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    public List<EjercicioDTO> obtenerEjerciciosPracticaRapida() {
        return obtenerEjerciciosPracticaRapida("mixto", 3, null);
    }

    public List<EjercicioDTO> obtenerEjerciciosPracticaRapida(String nivel, int limite, String usuarioId) {
        int limiteSeguro = Math.max(3, Math.min(limite, 12));
        String nivelNormalizado = nivel != null ? nivel.trim().toLowerCase(Locale.ROOT) : "mixto";
        int[] rango = resolverRangoComplejidadPractica(nivelNormalizado);
        boolean permitirMutaciones = permiteMutacionesEnPractica(nivelNormalizado);
        String seleccionBase = construirSelectBasePracticaRapida();

        String sqlConUsuario = seleccionBase +
                "WHERE q.complejidad_rapida BETWEEN ? AND ? " +
                "AND (? OR q.select_seguro = true) " +
                "ORDER BY CASE WHEN EXISTS ( " +
                "    SELECT 1 FROM lms_core.intentos i " +
                "    WHERE i.id_usuario = ?::uuid " +
                "      AND i.id_ejercicio = q.id_ejercicio " +
                "      AND i.es_correcto = true " +
                "      AND DATE(i.fecha_intento) = CURRENT_DATE " +
                ") THEN 1 ELSE 0 END, q.complejidad_rapida, RANDOM() " +
                "LIMIT ?";

        String sqlSinUsuario = seleccionBase +
                "WHERE q.complejidad_rapida BETWEEN ? AND ? " +
                "AND (? OR q.select_seguro = true) " +
                "ORDER BY q.complejidad_rapida, RANDOM() " +
                "LIMIT ?";

        List<Map<String, Object>> crudos;
        if (usuarioId != null && !usuarioId.trim().isEmpty()) {
            crudos = jdbcTemplate.queryForList(sqlConUsuario, rango[0], rango[1], permitirMutaciones, usuarioId, limiteSeguro);
        } else {
            crudos = jdbcTemplate.queryForList(sqlSinUsuario, rango[0], rango[1], permitirMutaciones, limiteSeguro);
        }

        if (crudos.isEmpty()) {
            String fallbackSql = seleccionBase +
                    "WHERE (? OR q.select_seguro = true) " +
                    "ORDER BY ABS(q.complejidad_rapida - ?), q.complejidad_rapida, RANDOM() LIMIT ?";
            crudos = jdbcTemplate.queryForList(fallbackSql, permitirMutaciones, rango[0], limiteSeguro);
        }

        List<EjercicioDTO> dtos = new ArrayList<>();
        int contador = 1;
        for (Map<String, Object> ejMap : crudos) {
            dtos.add(construirDtoPracticaRapida(ejMap, contador++));
        }
        return dtos;
    }

    private EjercicioDTO construirDtoPracticaRapida(Map<String, Object> ejMap, int contador) {
        EjercicioDTO dto = new EjercicioDTO();
        Integer dificultad = obtenerEntero(ejMap.get("complejidad_rapida"), obtenerEntero(ejMap.get("dificultad"), 1));
        String queryReal = (String) ejMap.get("query_maestra");
        String titulo = (String) ejMap.get("titulo");

        dto.setId(obtenerEntero(ejMap.get("id_ejercicio"), null));
        dto.setIdModulo(obtenerEntero(ejMap.get("id_modulo"), null));
        dto.setTitle(titulo != null && !titulo.isBlank() ? titulo : "Misión Relámpago " + contador);
        dto.setDescription((String) ejMap.get("enunciado"));
        dto.setType("drag_drop");
        dto.setHint("Arma la consulta por bloques. Si el tiempo presiona, identifica primero SELECT, FROM y la condicion central.");
        dto.setOrden(obtenerEntero(ejMap.get("orden"), contador));
        dto.setDifficulty(dificultad);
        dto.setXpReward(PRACTICA_RAPIDA_XP);
        dto.setTimeLimitSeconds(calcularTiempoPractica(queryReal, dificultad));
        dto.setConcept(construirConceptoPractica(queryReal, dto.getIdModulo()));
        dto.setWordBank(construirBancoPalabrasPractica(queryReal));
        return dto;
    }

    private String construirSelectBasePracticaRapida() {
        return "SELECT q.* FROM (" +
                "SELECT e.*, " +
                sqlComplejidadPracticaRapida() + " AS complejidad_rapida, " +
                sqlSelectSeguroPracticaRapida() + " AS select_seguro " +
                "FROM lms_core.ejercicios_practicos e " +
                "WHERE e.tipo_mision = 'RAPIDA'" +
                ") q ";
    }

    private String sqlComplejidadPracticaRapida() {
        String q = "UPPER(TRIM(COALESCE(e.query_maestra, '')))";
        return "CASE " +
                "WHEN " + q + " LIKE 'BEGIN%' OR " + q + " LIKE 'COMMIT%' OR " + q + " LIKE 'ROLLBACK%' " +
                "OR " + q + " LIKE 'CREATE%' OR " + q + " LIKE 'ALTER%' OR " + q + " LIKE 'DROP%' " +
                "OR " + q + " LIKE 'INSERT%' OR " + q + " LIKE 'UPDATE%' OR " + q + " LIKE 'DELETE%' THEN 5 " +
                "WHEN " + q + " LIKE '% JOIN %' AND (" + q + " LIKE '% GROUP BY%' OR " + q + " LIKE '% HAVING%') THEN 4 " +
                "WHEN " + q + " LIKE 'WITH %' OR " + q + " LIKE '% IN ( SELECT%' OR " + q + " LIKE '% NOT IN ( SELECT%' THEN 4 " +
                "WHEN " + q + " LIKE '% JOIN %' OR " + q + " LIKE '% GROUP BY%' OR " + q + " LIKE '% HAVING%' OR " + q + " LIKE '%NEXTVAL%' OR " + q + " LIKE '%CURRVAL%' " +
                "OR " + q + " LIKE '%COUNT(%' OR " + q + " LIKE '%COUNT(*)%' OR " + q + " LIKE '%AVG(%' OR " + q + " LIKE '%SUM(%' OR " + q + " LIKE '%MIN(%' OR " + q + " LIKE '%MAX(%' THEN 3 " +
                "WHEN " + q + " LIKE '% WHERE %' OR " + q + " LIKE '% BETWEEN %' OR " + q + " LIKE '% IS NULL%' OR " + q + " LIKE '% ORDER BY%' " +
                "THEN 2 " +
                "ELSE 1 END";
    }

    private String sqlSelectSeguroPracticaRapida() {
        String q = "UPPER(TRIM(COALESCE(e.query_maestra, '')))";
        return "(" + q + " LIKE 'SELECT%' " +
                "AND " + q + " NOT LIKE '%NEXTVAL%' " +
                "AND " + q + " NOT LIKE '%CURRVAL%' " +
                "AND " + q + " NOT LIKE '%SETVAL%' " +
                "AND " + q + " NOT LIKE '%; INSERT%' " +
                "AND " + q + " NOT LIKE '%; UPDATE%' " +
                "AND " + q + " NOT LIKE '%; DELETE%' " +
                "AND " + q + " NOT LIKE '%; CREATE%' " +
                "AND " + q + " NOT LIKE '%; ALTER%' " +
                "AND " + q + " NOT LIKE '%; DROP%')";
    }

    private int[] resolverRangoComplejidadPractica(String nivel) {
        return switch (nivel) {
            case "nivel-0", "basico-inicial" -> new int[]{1, 1};
            case "basico" -> new int[]{2, 2};
            case "medio", "intermedio" -> new int[]{3, 3};
            case "avanzado" -> new int[]{4, 4};
            case "experto" -> new int[]{5, 5};
            default -> new int[]{1, 5};
        };
    }

    private boolean permiteMutacionesEnPractica(String nivel) {
        return "avanzado".equals(nivel) || "experto".equals(nivel) || "mixto".equals(nivel) || "libre".equals(nivel);
    }

    private Integer obtenerEntero(Object valor, Integer fallback) {
        if (valor instanceof Number numero) {
            return numero.intValue();
        }
        if (valor != null) {
            try {
                return Integer.parseInt(valor.toString());
            } catch (NumberFormatException ignored) {}
        }
        return fallback;
    }

    private List<String> construirBancoPalabrasPractica(String queryReal) {
        LinkedHashSet<String> bancoPalabras = new LinkedHashSet<>();

        if (queryReal != null) {
            for (String palabra : queryReal.replaceAll(";", " ;").split("\\s+")) {
                if (palabra != null && !palabra.trim().isEmpty()) {
                    bancoPalabras.add(palabra.trim());
                }
            }
        }

        bancoPalabras.addAll(Arrays.asList(
                "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC",
                "COUNT(*)", "MAX(nivel)", "MIN(precio)", "AVG(nivel)",
                "aventureros", "equipamiento", "nombre", "clase", "nivel", "item", "precio"
        ));

        List<String> mezclado = new ArrayList<>(bancoPalabras);
        Collections.shuffle(mezclado);
        return mezclado;
    }

    private int calcularTiempoPractica(String queryReal, int dificultad) {
        int palabras = queryReal != null ? Math.max(4, queryReal.replaceAll(";", " ;").trim().split("\\s+").length) : 8;
        int segundos = 24 + palabras + (Math.max(1, dificultad) * 6);

        if (queryReal != null) {
            String upper = queryReal.toUpperCase(Locale.ROOT);
            if (upper.contains("JOIN") || upper.contains("GROUP BY") || upper.contains("HAVING")) {
                segundos += 8;
            }
            if (upper.matches("^[\\s\\S]*(CREATE|ALTER|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)[\\s\\S]*$")) {
                segundos += 10;
            }
        }

        return Math.max(28, Math.min(segundos, 85));
    }

    private String construirConceptoPractica(String queryReal, Integer idModulo) {
        String upper = queryReal != null ? queryReal.trim().toUpperCase(Locale.ROOT) : "";

        if ((idModulo != null && (idModulo == 15 || idModulo == 16)) || upper.contains("BEGIN") || upper.contains("COMMIT") || upper.contains("ROLLBACK")) {
            return "Transacciones";
        }
        if (upper.contains("NEXTVAL") || upper.contains("CURRVAL") || upper.contains("SETVAL")) {
            return "Secuencias";
        }
        if (upper.startsWith("CREATE") || upper.startsWith("ALTER") || upper.startsWith("DROP") || upper.contains("CONSTRAINT")) {
            return "DDL y reglas";
        }
        if (upper.startsWith("INSERT") || upper.startsWith("UPDATE") || upper.startsWith("DELETE")) {
            return "Cambios controlados";
        }
        if (upper.contains("JOIN")) {
            return "Relaciones entre tablas";
        }
        if (upper.contains("GROUP BY") || upper.contains("COUNT") || upper.contains("AVG") || upper.contains("SUM") || upper.contains("MAX") || upper.contains("MIN") || upper.contains("HAVING")) {
            return "Agregaciones";
        }
        if (upper.contains("WHERE") || upper.contains("BETWEEN") || upper.contains("LIKE") || upper.contains(" IS NULL") || upper.contains(" IN ")) {
            return "Filtros";
        }
        return "Lectura con SELECT";
    }

    private List<Map<String, Object>> ejecutarEnSandboxConRollback(String query, String usuarioId) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            conn.setAutoCommit(false); // Iniciar transacción
            try (Statement stmt = conn.createStatement()) {
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

    private List<Map<String, Object>> ejecutarEnSandbox(String queryUsuario, String usuarioId) throws java.sql.SQLException {
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

    private String extraerNombreTablaDDL(String upperQuery, String queryOriginal) {
        String tabla = null;
        
        if (upperQuery.contains("CREATE TABLE")) {
            String sinCreate = queryOriginal.replaceAll("(?i)CREATE\\s+TABLE\\s+", "").trim();
            String[] partes = sinCreate.split("[\\(,\\s]");
            if (partes.length > 0) {
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        } else if (upperQuery.contains("ALTER TABLE")) {
            String sinAlter = queryOriginal.replaceAll("(?i)ALTER\\s+TABLE\\s+", "").trim();
            String[] partes = sinAlter.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        } else if (upperQuery.contains("DROP TABLE")) {
            String sinDrop = queryOriginal.replaceAll("(?i)DROP\\s+TABLE\\s+", "").trim();
            String[] partes = sinDrop.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        }
        
        return tabla;
    }

public Map<String, Object> validarConsulta(Integer ejercicioId, String queryUsuario, String usuarioId) {
    Map<String, Object> respuesta = new HashMap<>();

    // --- 1. INTERCEPCIÓN ESTRATÉGICA (Antes del Escudo) ---
    EjercicioPractico ejercicioActual = repository.findById(ejercicioId).orElse(null);

    // Verificamos si este ejercicio tiene el pase VIP (Validación Textual)
    if (ejercicioActual != null && ejercicioActual.getConfiguracionExtra() != null) {
        String configExtra = ejercicioActual.getConfiguracionExtra().toString(); // O el método que uses para leer ese JSON
        
        if (configExtra.contains("\"tipo_validacion\":\"TEXTUAL\"")) {
            // Limpiamos espacios extra para no castigar por un doble espacio accidental
            String queryMaestra = ejercicioActual.getQueryMaestra().trim().toLowerCase().replaceAll("\\s+", " ");
            String cleanUsuario = queryUsuario.trim().toLowerCase().replaceAll("\\s+", " ");

            if (cleanUsuario.equals(queryMaestra)) {
                respuesta.put("success", true);
                respuesta.put("message", "¡Excelente! Has destruido la tabla correctamente sin dañar el reino.");
                // Aquí podrías agregar la lógica de XP si la manejas en este punto
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "La sintaxis no coincide con el comando destructor esperado. Revisa tu DROP.");
            }
            
            // ¡HUIDA TEMPRANA! Retornamos aquí y el Escudo de Dagon de abajo NUNCA se ejecuta.
            return respuesta; 
        }
    }// Elimina comentarios de una línea (-- ...) y saltos de línea al inicio, luego quita espacios
        String queryClean = queryUsuario.replaceAll("(?m)^--.*", "").trim().toLowerCase();
        // 2. Prevenir que intenten acceder a esquemas internos
        if (queryClean.contains("lms_core") || queryClean.contains("information_schema") || queryClean.contains("pg_catalog")) {
            if (!queryClean.startsWith("select")) { // Permitir solo lectura si es necesario para el juego
                respuesta.put("success", false);
                respuesta.put("message", "🛡️ ¡Interferencia Detectada! No tienes permiso para modificar el núcleo de Dagon.");
                // Datos para retroalimentación IA
                EjercicioPractico ejEsq = repository.findById(ejercicioId).orElse(null);
                if (ejEsq != null) {
                    respuesta.put("descripcion", ejEsq.getEnunciado());
                    respuesta.put("queryMaestra", ejEsq.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "El alumno intentó acceder a esquemas internos del sistema.");
                }
                return respuesta;
            }
        }
        // -------------------------------------------

        EjercicioPractico ejercicio = repository.findById(ejercicioId).orElse(null);

        if (ejercicio == null) {
            respuesta.put("success", false);
            respuesta.put("message", "Error: Ejercicio no encontrado.");
            return respuesta;
        }

        Optional<Map<String, Object>> errorPrevalidacion = validationRouter.prevalidar(ejercicio, queryUsuario, usuarioId);
        if (errorPrevalidacion.isPresent()) {
            return errorPrevalidacion.get();
        }
        TipoValidacionEjercicio tipoValidacion = validationRouter.resolverTipo(ejercicio, queryUsuario);
        respuesta.put("validationType", tipoValidacion.name());

        int xpGanada = (ejercicio.getDificultad() != null ? ejercicio.getDificultad() : 1) * 10;
        String formato = ejercicio.getFormato();
        boolean esMisionTransaccional = esMisionTransaccional(ejercicio);
        boolean esCorrecto = false;
        List<Map<String, Object>> datosAlumno = new ArrayList<>();

        try {
            if ("diagram".equals(formato)) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(queryUsuario);
                JsonNode diagramNodes = root.get("nodes");
                JsonNode diagramEdges = root.get("edges");

                if (diagramNodes == null) diagramNodes = mapper.createArrayNode();
                if (diagramEdges == null) diagramEdges = mapper.createArrayNode();

                // Leer reglas de validación desde configuracion_extra
                int minEntidades = 2;
                int minRelaciones = 1;
                int minAtributos = 0;
                List<List<String>> gruposRequeridos = new ArrayList<>();
                String mensajeEntidades = "El diagrama está incompleto.";
                String mensajeRelaciones = "Necesitas conectar las entidades con relaciones.";

                String configExtra = ejercicio.getConfiguracionExtra();
                if (configExtra != null && !configExtra.trim().isEmpty()) {
                    JsonNode config = mapper.readTree(configExtra);
                    if (config.has("min_entidades")) minEntidades = config.get("min_entidades").asInt();
                    if (config.has("min_relaciones")) minRelaciones = config.get("min_relaciones").asInt();
                    if (config.has("min_atributos")) minAtributos = config.get("min_atributos").asInt();
                    if (config.has("mensaje_error")) mensajeEntidades = config.get("mensaje_error").asText();
                    if (config.has("mensaje_relaciones")) mensajeRelaciones = config.get("mensaje_relaciones").asText();
                    if (config.has("entidades_requeridas")) {
                        for (JsonNode grupo : config.get("entidades_requeridas")) {
                            List<String> opciones = new ArrayList<>();
                            if (grupo.isArray()) {
                                for (JsonNode op : grupo) opciones.add(op.asText().toLowerCase());
                            } else {
                                opciones.add(grupo.asText().toLowerCase());
                            }
                            gruposRequeridos.add(opciones);
                        }
                    }
                }

                // Validar cantidad de entidades
                if (diagramNodes.size() < minEntidades) {
                    respuesta.put("success", false);
                    respuesta.put("message", mensajeEntidades + " Necesitas al menos " + minEntidades + " entidad(es).");
                    respuesta.put("xp_gained", 0);
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra() : "Diagrama ER");
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "El diagrama tiene menos entidades de las requeridas (" + diagramNodes.size() + "/" + minEntidades + ").");
                    return respuesta;
                }

                // Validar cantidad de relaciones
                if (diagramEdges.size() < minRelaciones) {
                    respuesta.put("success", false);
                    respuesta.put("message", mensajeRelaciones + " Necesitas al menos " + minRelaciones + " relación(es).");
                    respuesta.put("xp_gained", 0);
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra() : "Diagrama ER");
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "El diagrama tiene menos relaciones de las requeridas (" + diagramEdges.size() + "/" + minRelaciones + ").");
                    return respuesta;
                }

                // Recopilar nombres de entidades y contar atributos
                List<String> nombresEntidades = new ArrayList<>();
                int totalAtributos = 0;
                for (JsonNode node : diagramNodes) {
                    JsonNode data = node.get("data");
                    if (data != null && data.has("label")) {
                        String nombre = data.get("label").asText().toLowerCase().trim();
                        if (!nombre.isEmpty()) nombresEntidades.add(nombre);
                        if (data.has("columns")) totalAtributos += data.get("columns").size();
                    }
                }

                // Validar atributos mínimos
                if (minAtributos > 0 && totalAtributos < minAtributos) {
                    respuesta.put("success", false);
                    respuesta.put("message", "Las entidades necesitan más atributos (columnas). Agrega al menos " + minAtributos + " atributo(s) en total.");
                    respuesta.put("xp_gained", 0);
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra() : "Diagrama ER");
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "Faltan atributos en las entidades (" + totalAtributos + "/" + minAtributos + ").");
                    return respuesta;
                }

                // Validar entidades requeridas (cada grupo = al menos una opción debe existir)
                for (List<String> opciones : gruposRequeridos) {
                    boolean encontrada = false;
                    for (String opcion : opciones) {
                        for (String nombre : nombresEntidades) {
                            if (nombre.contains(opcion)) {
                                encontrada = true;
                                break;
                            }
                        }
                        if (encontrada) break;
                    }
                    if (!encontrada) {
                        respuesta.put("success", false);
                        respuesta.put("message", "Tu diagrama necesita una entidad relacionada con: " + String.join(" o ", opciones) + ".");
                        respuesta.put("xp_gained", 0);
                        respuesta.put("descripcion", ejercicio.getEnunciado());
                        respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra() : "Diagrama ER");
                        respuesta.put("queryAlumno", queryUsuario);
                        respuesta.put("errorDb", "Falta una entidad requerida: " + String.join(" o ", opciones) + ".");
                        return respuesta;
                    }
                }

                // Validar relaciones y cardinalidad (opcional)
                if (configExtra != null && !configExtra.trim().isEmpty()) {
                    JsonNode config = mapper.readTree(configExtra);
                    if (config.has("relaciones_requeridas")) {
                        for (JsonNode relReq : config.get("relaciones_requeridas")) {
                            String srcReq = relReq.get("source").asText().toLowerCase();
                            String targetReq = relReq.get("target").asText().toLowerCase();
                            String cardReq = relReq.has("cardinality") ? relReq.get("cardinality").asText() : null;
                            
                            boolean relEncontrada = false;
                            for (JsonNode edge : diagramEdges) {
                                String sourceId = edge.get("source").asText();
                                String targetId = edge.get("target").asText();
                                String cardinality = (edge.has("data") && edge.get("data").has("cardinality")) 
                                                    ? edge.get("data").get("cardinality").asText() : "1:N";

                                String sourceName = "";
                                String targetName = "";
                                for (JsonNode node : diagramNodes) {
                                    if (node.get("id").asText().equals(sourceId)) sourceName = node.get("data").get("label").asText().toLowerCase();
                                    if (node.get("id").asText().equals(targetId)) targetName = node.get("data").get("label").asText().toLowerCase();
                                }

                                if (sourceName.contains(srcReq) && targetName.contains(targetReq)) {
                                    if (cardReq == null || cardReq.equals(cardinality)) {
                                        relEncontrada = true;
                                        break;
                                    }
                                }
                            }
                            if (!relEncontrada) {
                                String msg = "Falta una relación entre " + srcReq + " y " + targetReq;
                                if (cardReq != null) msg += " con cardinalidad " + cardReq;
                                respuesta.put("success", false);
                                respuesta.put("message", msg + ".");
                                respuesta.put("xp_gained", 0);
                                respuesta.put("descripcion", ejercicio.getEnunciado());
                                respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra() : "Diagrama ER");
                                respuesta.put("queryAlumno", queryUsuario);
                                respuesta.put("errorDb", msg + ".");
                                return respuesta;
                            }
                        }
                    }
                }

                esCorrecto = true;
            } else {
                if (!queryUsuario.trim().endsWith(";")) {
                    respuesta.put("success", false);
                    respuesta.put("message", "¡Error de Sintaxis! Te faltó cerrar la instrucción con el punto y coma (;) al final.");
                    // Datos para retroalimentación IA
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "Falta el punto y coma (;) al final de la instrucción SQL.");
                    return respuesta;
                }

                // 🌟 LEER CONFIGURACIÓN PARA VALIDACIÓN DDL/SECUENCIAS Y TEXTUAL
                boolean isDdlValidation = false;
                boolean isTextualValidation = false;
                String expectedRegex = null;

                String configExtra = ejercicio.getConfiguracionExtra();
                if (configExtra != null && !configExtra.trim().isEmpty()) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode config = mapper.readTree(configExtra);
                        if (config.has("tipo_validacion")) {
                            String tipoVal = config.get("tipo_validacion").asText();
                            if ("ddl".equalsIgnoreCase(tipoVal)) {
                                isDdlValidation = true;
                            } else if ("TEXTUAL".equalsIgnoreCase(tipoVal)) {
                                isTextualValidation = true;
                                if (config.has("regex_esperado")) {
                                    expectedRegex = config.get("regex_esperado").asText();
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }

                // 🌟 LÓGICA DE VALIDACIÓN TEXTUAL ESTÁTICA (Para DROP/ALTER destructivos)
                if (isTextualValidation) {
                    String cleanUsuario = queryUsuario.trim().toUpperCase().replaceAll("\\s+", " ");
                    String cleanMaestra = ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra().trim().toUpperCase().replaceAll("\\s+", " ") : "";
                    
                    boolean match = false;
                    if (expectedRegex != null && !expectedRegex.isEmpty()) {
                        java.util.regex.Pattern p = java.util.regex.Pattern.compile(expectedRegex, java.util.regex.Pattern.CASE_INSENSITIVE);
                        match = p.matcher(queryUsuario.trim()).matches();
                    } else {
                        match = cleanUsuario.equals(cleanMaestra);
                    }
                    
                    if (match) {
                        respuesta.put("success", true);
                        respuesta.put("message", "¡Excelente! Comprendes cómo ejecutar esta instrucción de forma segura.");
                        respuesta.put("xp_gained", ejercicio.getDificultad() != null ? ejercicio.getDificultad() * 10 : 50);
                        
                        try {
                            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                                String insertSql = "INSERT INTO lms_core.intentos (id_usuario, id_ejercicio, query_enviada, es_correcto) VALUES (?::uuid, ?, ?, true)";
                                jdbcTemplate.update(insertSql, usuarioId, ejercicio.getIdEjercicio(), queryUsuario);
                                usuarioService.registrarPracticaDiaria(usuarioId);
                            }
                        } catch (Exception ignored) {}
                        
                        return respuesta;
                    } else {
                        respuesta.put("success", false);
                        respuesta.put("message", "Sintaxis incorrecta. Revisa tu instrucción con cuidado.");
                        respuesta.put("descripcion", ejercicio.getEnunciado());
                        respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                        respuesta.put("queryAlumno", queryUsuario);
                        respuesta.put("errorDb", "Validación textual fallida: La instrucción no coincide con la sintaxis esperada.");
                        return respuesta;
                    }
                }

                // Determinar si es DML (Cambio de datos) - 🌟 LÓGICA CURADA (REGEX OPTIMIZADO)
                String upperQ = queryUsuario.trim().toUpperCase();
                boolean esDML = upperQ.matches("^\\s*(INSERT|UPDATE|DELETE)\\b[\\s\\S]*");

                // 🌟 LÓGICA DE VALIDACIÓN MODIFICADA
                if (isDdlValidation) {
                    
                    // 🪄 PARCHE AUTO-SANADOR DE SECUENCIAS (v2.0 - Soporta currval y setval)
                    if (upperQ.contains("NEXTVAL") || upperQ.contains("CURRVAL") || upperQ.contains("SETVAL")) {
                        java.util.regex.Pattern seqPattern = java.util.regex.Pattern.compile("['\"]([a-zA-Z0-9_]+)['\"]");
                        java.util.regex.Matcher seqMatcher = seqPattern.matcher(queryUsuario);
                        
                        if (seqMatcher.find()) {
                            String seqName = seqMatcher.group(1);
                            try {
                                // 1. Garantizamos que la secuencia exista
                                ejecutarEnSandbox("CREATE SEQUENCE IF NOT EXISTS " + seqName + " START 1;", usuarioId);
                                
                                // 2. HACK DE SESIÓN: Si pide CURRVAL, forzamos un NEXTVAL previo
                                if (upperQ.contains("CURRVAL")) {
                                    ejecutarEnSandbox("SELECT nextval('" + seqName + "');", usuarioId);
                                }
                            } catch (Exception ignored) {}
                        }
                    }

                    // Para secuencias o DDL, ejecutamos y si no hay error de SQL, es correcto.
                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    esCorrecto = true;
                    
                    // 🌟 MAGIA DIDÁCTICA: Escanear y devolver las Constraints de la tabla
                    String tablaAfectada = extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaAfectada != null) {
                        String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                            + "FROM information_schema.table_constraints "
                            + "WHERE table_name = '" + tablaAfectada + "' "
                            + "AND table_schema = current_schema() "
                            + "ORDER BY constraint_type;";
                        try {
                            List<Map<String, Object>> listaConstraints = ejecutarEnSandbox(queryConstraints, usuarioId);
                            respuesta.put("constraintsData", listaConstraints);
                        } catch (Exception ignored) {}
                    }
                } else if (esDML) {
                    String tablaAfectada = extraerNombreTablaDML(upperQ, queryUsuario);
                    List<Map<String, Object>> beforeData = new ArrayList<>();
                    if (tablaAfectada != null) {
                        try {
                            beforeData = ejecutarEnSandbox("SELECT * FROM \"" + tablaAfectada + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    // 1. Obtener qué DEBERÍA pasar (Query Maestra con Rollback)
                    List<Map<String, Object>> datosMaestros = ejecutarEnSandboxConRollback(ejercicio.getQueryMaestra(), usuarioId);
                    
                    // 2. Ejecutar lo que el ALUMNO mandó (Persistente)
                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    
                    // 3. Comparar
                    esCorrecto = compararResultadosDML(datosAlumno, datosMaestros);

                    // 4. Capturar estado posterior
                    List<Map<String, Object>> afterData = new ArrayList<>();
                    if (tablaAfectada != null) {
                        try {
                            afterData = ejecutarEnSandbox("SELECT * FROM \"" + tablaAfectada + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    respuesta.put("beforeData", beforeData);
                    respuesta.put("afterData", afterData);
                    respuesta.put("isDML", true);
                    respuesta.put("targetTable", tablaAfectada);
                    if (esMisionTransaccional && tablaAfectada != null) {
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, beforeData, afterData));
                    }
                } else {
                    // Para SELECT normal, comparamos resultados directamente
                    String tablaTransaccional = esMisionTransaccional ? extraerNombreTablaTransaccional(queryUsuario) : null;
                    if (tablaTransaccional == null && esMisionTransaccional) {
                        tablaTransaccional = extraerNombreTablaTransaccional(ejercicio.getQueryMaestra());
                    }
                    List<Map<String, Object>> beforeData = new ArrayList<>();
                    if (tablaTransaccional != null) {
                        try {
                            beforeData = ejecutarEnSandbox("SELECT * FROM \"" + tablaTransaccional + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra(), usuarioId);
                    esCorrecto = datosAlumno.equals(datosMaestros);

                    if (tablaTransaccional != null) {
                        List<Map<String, Object>> afterData = new ArrayList<>();
                        try {
                            afterData = ejecutarEnSandbox("SELECT * FROM \"" + tablaTransaccional + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}

                        respuesta.put("beforeData", beforeData);
                        respuesta.put("afterData", afterData);
                        respuesta.put("targetTable", tablaTransaccional);
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, beforeData, afterData));
                    } else if (esMisionTransaccional) {
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, Collections.emptyList(), Collections.emptyList()));
                    }
                }
            }

            boolean yaResuelto = false;
            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                String checkSql = "SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND id_ejercicio = ? AND es_correcto = true";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, usuarioId, ejercicioId);
                yaResuelto = (count != null && count > 0);

                String insertSql = "INSERT INTO lms_core.intentos (id_usuario, id_ejercicio, query_enviada, es_correcto) VALUES (?::uuid, ?, ?, ?)";
                jdbcTemplate.update(insertSql, usuarioId, ejercicioId, queryUsuario, esCorrecto);
            }

            // 🌟 MAGIA DIDÁCTICA: Escanear constraints después de ejecutar la consulta del usuario
            if (esCorrecto) {
                String upperQ = queryUsuario.trim().toUpperCase();
                if (upperQ.contains("ALTER TABLE") || upperQ.contains("CREATE TABLE") || upperQ.contains("ADD CONSTRAINT") || upperQ.contains("DROP CONSTRAINT")) {
                    String tablaAfectada = extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaAfectada != null) {
                        String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                            + "FROM information_schema.table_constraints "
                            + "WHERE table_name = '" + tablaAfectada + "' "
                            + "AND table_schema = current_schema() "
                            + "ORDER BY constraint_type;";
                        try {
                            List<Map<String, Object>> listaConstraints = ejecutarEnSandbox(queryConstraints, usuarioId);
                            if (listaConstraints != null && !listaConstraints.isEmpty()) {
                                respuesta.put("constraintsData", listaConstraints);
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            if (esCorrecto) {
                respuesta.put("success", true);
                if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                    usuarioService.registrarPracticaDiaria(usuarioId);
                }

                String tipo = ejercicio.getTipoMision() != null ? ejercicio.getTipoMision() : "HISTORIA";
                if ("RAPIDA".equals(tipo)) {
                    int aciertosRapidosHoy = contarAciertosRapidosHoy(usuarioId);
                    int xpRapida = aciertosRapidosHoy <= PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP ? PRACTICA_RAPIDA_XP : 0;
                    int xpConsumidaHoy = Math.min(aciertosRapidosHoy, PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP) * PRACTICA_RAPIDA_XP;
                    int xpRestanteHoy = Math.max(0, PRACTICA_RAPIDA_XP_DIARIA_MAX - xpConsumidaHoy);

                    respuesta.put("message", xpRapida > 0
                            ? "¡Relámpago completado! Racha protegida y +" + xpRapida + " XP."
                            : "Racha protegida. Ya alcanzaste el cupo de XP relámpago de hoy.");
                    respuesta.put("xp_gained", xpRapida);
                    respuesta.put("quick_practice", true);
                    respuesta.put("streak_saved", true);
                    respuesta.put("daily_quick_xp_cap", PRACTICA_RAPIDA_XP_DIARIA_MAX);
                    respuesta.put("daily_quick_xp_remaining", xpRestanteHoy);
                    respuesta.put("daily_quick_successes", aciertosRapidosHoy);
                } else if (yaResuelto) {
                    respuesta.put("message", "¡Perfecto! (Pero ya habías resuelto esta misión. 0 extra)");
                    respuesta.put("xp_gained", 0);
                } else {
                    respuesta.put("message", "¡Excelente! Has dominado esta misión.");
                    respuesta.put("xp_gained", xpGanada);
                }
            } else {
                if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                    usuarioService.registrarPracticaDiaria(usuarioId);
                }
                respuesta.put("success", false);
                respuesta.put("message", "La consulta corrió sin errores, pero los datos no coinciden. Revisa tu lógica.");
                respuesta.put("xp_gained", 0);
                respuesta.put("constancy_reward", "Practica diaria registrada aunque la respuesta necesite correccion.");
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", "Los datos obtenidos no son los esperados.");
            }
            respuesta.put("mockData", datosAlumno);
            if (esMisionTransaccional) {
                anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
            }

        } catch (java.sql.SQLException e) {
            String sqlError = e.getMessage();
            
            // === INTERVENCIÓN PEDAGÓGICA: Primary Key Duplicada ===
            if (sqlError != null && sqlError.toLowerCase().contains("multiple primary keys")) {
                String upperQ = queryUsuario.trim().toUpperCase();
                String tablaObj = extraerNombreTablaDDL(upperQ, queryUsuario);
                String tablaNombre = tablaObj != null ? tablaObj : "la tabla";
                
                // Extraer nombre de columna de la query del usuario
                String columnaPK = "";
                try {
                    java.util.regex.Pattern colPattern = java.util.regex.Pattern.compile(
                        "PRIMARY\\s+KEY\\s*\\(\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\)",
                        java.util.regex.Pattern.CASE_INSENSITIVE
                    );
                    java.util.regex.Matcher colMatcher = colPattern.matcher(queryUsuario);
                    if (colMatcher.find()) {
                        columnaPK = colMatcher.group(1);
                    }
                } catch (Exception ignored) {}
                
                // Construir query de DROP (nombre default de PostgreSQL)
                String dropConstraint = "ALTER TABLE " + tablaNombre + " DROP CONSTRAINT " + tablaNombre + "_pkey;";
                
                // Ejecutar el DROP en secreto para arreglar la base de datos
                try {
                    ejecutarEnSandbox(dropConstraint, usuarioId);
                } catch (Exception dropEx) {
                    // Ignorar errores del DROP - podría no existir la constraint
                }
                
                // Devolver signal de intervención pedagógica
                respuesta.put("success", true);
                respuesta.put("isPedagogicalIntervention", true);
                respuesta.put("interventionType", "pk_exists");
                respuesta.put("message", "¡Espera! 👀");
                respuesta.put("dagonMessage", "¡Tu código es PERFECTO! Pero la tabla «" + tablaNombre + "» ya tiene una Primary Key. En SQL, ¡una tabla solo puede tener un rey!");
                respuesta.put("dagonExplanation", "Las Primary Keys son como el DNI de cada fila. No puedes tener dos personas con el mismo DNI, ¿verdad? Por eso primero debemos eliminar la anterior antes de crear la nueva.");
                respuesta.put("dagonActionQuery", dropConstraint);
                respuesta.put("dagonPostMessage", "¡Puf! 💨 He eliminado la llave vieja. Ahora ejecuta tu consulta original y verás que funciona perfectamente.");
                respuesta.put("userOriginalQuery", queryUsuario);
                respuesta.put("xp_gained", 0);
                
                // Obtener datos actuales de la tabla
                try {
                    String consultaDatos = "SELECT * FROM \"" + tablaNombre + "\" LIMIT 10;";
                    datosAlumno = ejecutarEnSandbox(consultaDatos, usuarioId);
                    respuesta.put("mockData", datosAlumno);
                    
                    // 🌟 MAGIA DIDÁCTICA: Escanear constraints después de DROP
                    String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                        + "FROM information_schema.table_constraints "
                        + "WHERE table_name = '" + tablaNombre + "' "
                        + "AND table_schema = current_schema() "
                        + "ORDER BY constraint_type;";
                    List<Map<String, Object>> listaConstraints = ejecutarEnSandbox(queryConstraints, usuarioId);
                    respuesta.put("constraintsData", listaConstraints);
                } catch (Exception ignored) {}
                
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
                return respuesta;
            }
            // =============================================================
            
            // Detectar si es error de relación o constraint que ya existe (no es error crítico)
            boolean yaExiste = sqlError != null && (
                sqlError.toLowerCase().contains("relation") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("table") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("duplicate") && sqlError.toLowerCase().contains("key") ||
                sqlError.toLowerCase().contains("constraint") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("multiple primary keys")
            );
            
            if (yaExiste) {
                // Es un warning, no error - intentar mostrar lo que hay en la tabla
                String upperQ = queryUsuario.trim().toUpperCase();
                respuesta.put("success", true);
                respuesta.put("isWarning", true);
                respuesta.put("message", "⚠️ Ya existe esa relación. Mostrando su estructura actual.");
                respuesta.put("warningType", "already_exists");
                
                // Intentar obtener los datos y estructura de todos modos
                try {
                    String tablaExtraida = extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaExtraida != null) {
                        // Primero ver si hay datos
                        String consultaDatos = "SELECT * FROM \"" + tablaExtraida + "\" LIMIT 100;";
                        datosAlumno = ejecutarEnSandbox(consultaDatos, usuarioId);
                        
                        // Si no hay datos, mostrar la estructura de la tabla
                        if (datosAlumno.isEmpty()) {
                            String consultaEstructura = "SELECT column_name, data_type, is_nullable "
                                + "FROM information_schema.columns "
                                + "WHERE table_name = '" + tablaExtraida + "' "
                                + "ORDER BY ordinal_position;";
                            datosAlumno = ejecutarEnSandbox(consultaEstructura, usuarioId);
                            
                            // Añadir flag para saber que es estructura
                            respuesta.put("isStructure", true);
                        }
                    }
                } catch (Exception ignored) {
                    datosAlumno = new ArrayList<>();
                }
                
                // Marcar como correcto para permitir avanzar
                esCorrecto = true;
                respuesta.put("mockData", datosAlumno);
                respuesta.put("xp_gained", 0);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "Error de SQL: " + sqlError);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", sqlError);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            }
        } catch (Exception e) {
            String errMsg = e.getMessage();
            
            // Detectar error de paréntesis desbalanceados
            if (errMsg != null && errMsg.contains("Unmatched closing")) {
                // Intentar ejecutar la query directamente y obtener resultados
                try {
                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    if (!datosAlumno.isEmpty()) {
                        respuesta.put("success", true);
                        respuesta.put("message", "¡Consulta ejecutada! Pero los datos no coinciden con lo esperado.");
                        respuesta.put("mockData", datosAlumno);
                        respuesta.put("xp_gained", 0);
                        if (esMisionTransaccional) {
                            anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                        }
                        return respuesta;
                    }
                } catch (Exception ignored) {}
                
                respuesta.put("success", false);
                respuesta.put("message", "Error de sintaxis: Revisa los paréntesis. " + errMsg);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", errMsg);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "Error al procesar la respuesta: " + errMsg);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", errMsg);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            }
        }
        return respuesta;
    }
    
    private String extraerNombreTablaDML(String upperQuery, String queryOriginal) {
        try {
            java.util.regex.Pattern pattern;
            if (upperQuery.contains("DELETE")) {
                pattern = java.util.regex.Pattern.compile("(?i)DELETE\\s+FROM\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else if (upperQuery.contains("UPDATE")) {
                pattern = java.util.regex.Pattern.compile("(?i)UPDATE\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else if (upperQuery.contains("INSERT")) {
                pattern = java.util.regex.Pattern.compile("(?i)INSERT\\s+INTO\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else {
                return null;
            }

            java.util.regex.Matcher matcher = pattern.matcher(queryOriginal);
            if (matcher.find()) {
                return matcher.group(1).replaceAll("[\"`;]", "").trim();
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private int contarAciertosRapidosHoy(String usuarioId) {
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            return 0;
        }

        try {
            String sql = "SELECT COUNT(*) " +
                    "FROM lms_core.intentos i " +
                    "JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "WHERE i.id_usuario = ?::uuid " +
                    "AND i.es_correcto = true " +
                    "AND e.tipo_mision = 'RAPIDA' " +
                    "AND DATE(i.fecha_intento) = CURRENT_DATE";
            Integer total = jdbcTemplate.queryForObject(sql, Integer.class, usuarioId);
            return total != null ? total : 0;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private boolean compararResultadosDML(List<Map<String, Object>> r1, List<Map<String, Object>> r2) {
        if (r1.size() != r2.size()) return false;
        for (int i = 0; i < r1.size(); i++) {
            Map<String, String> m1 = new HashMap<>();
            Map<String, String> m2 = new HashMap<>();
            
            // Normalizar m1: ignorar IDs y poner llaves en minúsculas
            for (Map.Entry<String, Object> entry : r1.get(i).entrySet()) {
                String key = entry.getKey().toLowerCase();
                if (!key.startsWith("id_")) {
                    m1.put(key, entry.getValue() != null ? entry.getValue().toString() : null);
                }
            }
            
            // Normalizar m2
            for (Map.Entry<String, Object> entry : r2.get(i).entrySet()) {
                String key = entry.getKey().toLowerCase();
                if (!key.startsWith("id_")) {
                    m2.put(key, entry.getValue() != null ? entry.getValue().toString() : null);
                }
            }
            
            if (!m1.equals(m2)) return false;
        }
        return true;
    }

    private Map<String, Object> construirPedagogiaEjercicio(EjercicioPractico ejercicio) {
        Map<String, Object> pedagogia = new LinkedHashMap<>();

        if (ejercicio.getConfiguracionExtra() != null && !ejercicio.getConfiguracionExtra().trim().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode config = mapper.readTree(ejercicio.getConfiguracionExtra());
                pedagogia.putAll(mapper.convertValue(config, LinkedHashMap.class));
            } catch (Exception ignored) {}
        }

        if (esMisionTransaccional(ejercicio)) {
            pedagogia.putIfAbsent("modo", "terminal_transaccional");
            pedagogia.putIfAbsent("terminal_prompt_base", "dagon=#");
            pedagogia.putIfAbsent("terminal_prompt_tx", "dagon=*#");
            pedagogia.putIfAbsent("paneles", Arrays.asList("sesion_a", "sesion_b", "linea_tiempo", "aislamiento"));
            pedagogia.putIfAbsent("foco", Arrays.asList("BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "visibilidad"));
            pedagogia.putIfAbsent("sesiones_paralelas", true);
            pedagogia.putIfAbsent("mensaje_terminal", "Esta misión se enseña como un laboratorio de terminal PostgreSQL con dos sesiones en paralelo.");
        }

        return pedagogia;
    }

    private boolean esMisionTransaccional(EjercicioPractico ejercicio) {
        if (ejercicio == null) {
            return false;
        }

        if (Integer.valueOf(15).equals(ejercicio.getIdModulo())) {
            return true;
        }

        String configExtra = ejercicio.getConfiguracionExtra();
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return false;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode config = mapper.readTree(configExtra);

            if (config.has("tipo_validacion") && "transaccion".equalsIgnoreCase(config.get("tipo_validacion").asText())) {
                return true;
            }

            return config.has("modo") && "terminal_transaccional".equalsIgnoreCase(config.get("modo").asText());
        } catch (Exception ignored) {
            return false;
        }
    }

    private void anexarSimulacionTransaccional(Map<String, Object> respuesta, EjercicioPractico ejercicio, String queryUsuario, String usuarioId) {
        try {
            respuesta.put("transactionSimulation", construirSimulacionTransaccional(ejercicio, queryUsuario, usuarioId));
        } catch (Exception e) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("mode", "postgres_transaction_lab");
            fallback.put("available", false);
            fallback.put("message", "No fue posible generar la simulación paralela completa, pero el módulo sigue marcado como laboratorio transaccional.");
            fallback.put("error", e.getMessage());
            fallback.put("timeline", construirLineaTiempoBasica(queryUsuario));
            respuesta.put("transactionSimulation", fallback);
        }
    }

    private Map<String, Object> construirSimulacionTransaccional(EjercicioPractico ejercicio, String queryUsuario, String usuarioId) throws java.sql.SQLException {
        Map<String, Object> simulacion = new LinkedHashMap<>();
        List<Map<String, Object>> timeline = new ArrayList<>();
        List<String> sentencias = separarSentenciasSql(queryUsuario);
        String demoTable = "tx_demo_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        simulacion.put("mode", "postgres_transaction_lab");
        simulacion.put("available", true);
        simulacion.put("headline", "Laboratorio de dos sesiones");
        simulacion.put("basePrompt", "dagon=#");
        simulacion.put("txPrompt", "dagon=*#");
        simulacion.put("demoTable", demoTable);
        simulacion.put("timeline", timeline);
        simulacion.put("focus", Arrays.asList(
            "La Sesión A puede acumular cambios sin confirmarlos",
            "La Sesión B representa a otro cliente leyendo al mismo tiempo",
            "COMMIT publica el cambio; ROLLBACK lo borra del presente"
        ));

        if (sentencias.isEmpty()) {
            simulacion.put("available", false);
            simulacion.put("message", "No se detectaron sentencias para construir la simulación transaccional.");
            return simulacion;
        }

        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        try (Connection sesionA = DriverManager.getConnection(url, user, password);
             Connection sesionB = DriverManager.getConnection(url, user, password);
             Statement adminA = sesionA.createStatement();
             Statement adminB = sesionB.createStatement()) {

            prepararSearchPath(adminA, usuarioId);
            prepararSearchPath(adminB, usuarioId);

            adminA.execute("CREATE TABLE \"" + demoTable + "\" (id SERIAL PRIMARY KEY, etiqueta VARCHAR(80), saldo INTEGER NOT NULL);");
            adminA.execute("INSERT INTO \"" + demoTable + "\" (etiqueta, saldo) VALUES ('origen', 100), ('reserva', 200);");

            boolean transaccionAbierta = false;
            int step = 1;

            for (String sentencia : sentencias) {
                String normalizada = sentencia.trim();
                if (normalizada.isEmpty()) {
                    continue;
                }

                String upper = normalizada.toUpperCase(Locale.ROOT);
                Map<String, Object> evento = new LinkedHashMap<>();
                evento.put("step", step++);
                evento.put("statement", normalizada.endsWith(";") ? normalizada : normalizada + ";");
                evento.put("prompt", transaccionAbierta ? "dagon=*#" : "dagon=#");
                evento.put("session", "Sesión A");
                evento.put("parallelSession", "Sesión B");
                evento.put("concept", describirConceptoTransaccional(upper));

                if (upper.startsWith("BEGIN")) {
                    sesionA.setAutoCommit(false);
                    transaccionAbierta = true;
                    evento.put("effect", "La sesión A abre una transacción y a partir de aquí trabaja en un presente privado.");
                } else if (upper.startsWith("SAVEPOINT")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute(normalizada);
                    evento.put("effect", "Se colocó un punto de retorno intermedio para deshacer solo una parte del trabajo.");
                } else if (upper.startsWith("ROLLBACK TO")) {
                    adminA.execute(normalizada);
                    evento.put("effect", "La sesión A volvió al savepoint sin destruir toda la transacción.");
                } else if (upper.startsWith("ROLLBACK")) {
                    if (transaccionAbierta) {
                        sesionA.rollback();
                    }
                    sesionA.setAutoCommit(true);
                    transaccionAbierta = false;
                    evento.put("effect", "Todo lo pendiente desaparece; la sesión B nunca llega a ver esos cambios.");
                } else if (upper.startsWith("COMMIT")) {
                    if (transaccionAbierta) {
                        sesionA.commit();
                    }
                    sesionA.setAutoCommit(true);
                    transaccionAbierta = false;
                    evento.put("effect", "Los cambios salen del estado privado y se publican para todas las sesiones.");
                } else if (upper.startsWith("INSERT")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("INSERT INTO \"" + demoTable + "\" (etiqueta, saldo) VALUES ('pendiente_" + step + "', " + (90 + step) + ");");
                    evento.put("effect", "Sesión A agregó una fila nueva en su burbuja transaccional.");
                } else if (upper.startsWith("UPDATE")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("UPDATE \"" + demoTable + "\" SET saldo = saldo + 25 WHERE id = 1;");
                    evento.put("effect", "Sesión A modificó una fila existente, pero el cambio aún no es público.");
                } else if (upper.startsWith("DELETE")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("DELETE FROM \"" + demoTable + "\" WHERE id = 2;");
                    evento.put("effect", "Sesión A retiró una fila del laboratorio; la otra sesión sigue viendo el estado confirmado.");
                } else if (upper.startsWith("SELECT")) {
                    evento.put("effect", "La consulta observa el estado visible en ese instante y ayuda a comparar lo que ve cada sesión.");
                } else {
                    evento.put("effect", "La sentencia se interpreta como parte del flujo transaccional y se explica sin tocar el sandbox real del ejercicio.");
                }

                evento.put("sessionAVisibleRows", contarFilas(adminA, demoTable));
                evento.put("sessionBVisibleRows", contarFilas(adminB, demoTable));
                evento.put("visibilityHint", construirHintVisibilidad(transaccionAbierta, evento.get("sessionAVisibleRows"), evento.get("sessionBVisibleRows")));
                timeline.add(evento);
            }

            if (transaccionAbierta) {
                sesionA.rollback();
                sesionA.setAutoCommit(true);
            }

            adminA.execute("DROP TABLE IF EXISTS \"" + demoTable + "\";");
        }

        simulacion.put("summary", "La simulación usa dos conexiones JDBC contra una tabla efímera para hacer visible el aislamiento entre sesiones.");
        return simulacion;
    }

    private void prepararSearchPath(Statement stmt, String usuarioId) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        if (usuarioId != null && !usuarioId.trim().isEmpty()) {
            String searchPath = sandboxSqlPolicy.resolverSearchPath(usuarioId);
            try {
                stmt.execute("CREATE SCHEMA IF NOT EXISTS \"" + searchPath + "\";");
                stmt.execute("GRANT ALL ON SCHEMA \"" + searchPath + "\" TO app_sandbox_user;");
            } catch (Exception ignored) {}
        }
        stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));
    }

    private List<Map<String, Object>> construirLineaTiempoBasica(String queryUsuario) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        int step = 1;
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            Map<String, Object> evento = new LinkedHashMap<>();
            evento.put("step", step++);
            evento.put("statement", sentencia.endsWith(";") ? sentencia : sentencia + ";");
            evento.put("prompt", upper.startsWith("BEGIN") ? "dagon=#" : "dagon=*#");
            evento.put("concept", describirConceptoTransaccional(upper));
            evento.put("effect", "Traza pedagógica disponible aunque la simulación completa no haya podido ejecutarse.");
            timeline.add(evento);
        }
        return timeline;
    }

    private List<String> separarSentenciasSql(String queryUsuario) {
        List<String> sentencias = new ArrayList<>();
        if (queryUsuario == null || queryUsuario.trim().isEmpty()) {
            return sentencias;
        }

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
                    sentencias.add(stmt + ";");
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

    private String extraerNombreTablaTransaccional(String queryUsuario) {
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("INSERT") || upper.startsWith("UPDATE") || upper.startsWith("DELETE")) {
                String tabla = extraerNombreTablaDML(upper, sentencia);
                if (tabla != null && !tabla.isBlank()) {
                    return tabla;
                }
            }
        }
        return null;
    }

    private Map<String, Object> construirResumenResultadoTransaccional(String queryUsuario, List<Map<String, Object>> beforeData, List<Map<String, Object>> afterData) {
        Map<String, Object> resumen = new LinkedHashMap<>();
        String upper = queryUsuario != null ? queryUsuario.toUpperCase(Locale.ROOT) : "";

        String outcomeType = "commit";
        String headline = "Cambios confirmados";
        String explanation = "La transacción publicó sus cambios y ahora forman parte del estado confirmado de la tabla.";

        if (upper.contains("ROLLBACK TO")) {
            outcomeType = "savepoint";
            headline = "Rollback parcial aplicado";
            explanation = "La transacción conservó la parte anterior al savepoint y deshizo solo el tramo posterior.";
        } else if (upper.contains("ROLLBACK")) {
            outcomeType = "rollback";
            headline = "Cambios revertidos";
            explanation = "El estado final volvió al último COMMIT visible; nada de lo pendiente quedó publicado.";
        } else if (upper.contains("COMMIT")) {
            outcomeType = "commit";
            headline = "Cambios confirmados";
            explanation = "La transacción publicó sus cambios y ahora forman parte del estado confirmado de la tabla.";
        }

        resumen.put("type", outcomeType);
        resumen.put("headline", headline);
        resumen.put("explanation", explanation);
        resumen.put("beforeCount", beforeData != null ? beforeData.size() : 0);
        resumen.put("afterCount", afterData != null ? afterData.size() : 0);
        resumen.put("changed", !Objects.equals(beforeData, afterData));
        resumen.put("queryPattern", construirPlantillaTransaccional(queryUsuario));

        return resumen;
    }

    private String construirPlantillaTransaccional(String queryUsuario) {
        List<String> piezas = new ArrayList<>();
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("BEGIN")) {
                piezas.add("BEGIN;");
            } else if (upper.startsWith("INSERT")) {
                piezas.add("INSERT INTO ____ VALUES (...);");
            } else if (upper.startsWith("UPDATE")) {
                piezas.add("UPDATE ____ SET ____ WHERE ____;");
            } else if (upper.startsWith("DELETE")) {
                piezas.add("DELETE FROM ____ WHERE ____;");
            } else if (upper.startsWith("SAVEPOINT")) {
                piezas.add("SAVEPOINT ____;");
            } else if (upper.startsWith("ROLLBACK TO")) {
                piezas.add("ROLLBACK TO SAVEPOINT ____;");
            } else if (upper.startsWith("ROLLBACK")) {
                piezas.add("ROLLBACK;");
            } else if (upper.startsWith("COMMIT")) {
                piezas.add("COMMIT;");
            } else if (upper.startsWith("SELECT")) {
                piezas.add("SELECT ____ FROM ____;");
            }
        }

        return piezas.isEmpty() ? "BEGIN; ... COMMIT;" : String.join("  ", piezas);
    }

    private String describirConceptoTransaccional(String upper) {
        if (upper.startsWith("BEGIN")) {
            return "Apertura de transacción";
        }
        if (upper.startsWith("COMMIT")) {
            return "Confirmación global";
        }
        if (upper.startsWith("ROLLBACK TO")) {
            return "Deshacer parcial";
        }
        if (upper.startsWith("ROLLBACK")) {
            return "Deshacer total";
        }
        if (upper.startsWith("SAVEPOINT")) {
            return "Punto de guardado";
        }
        if (upper.startsWith("INSERT")) {
            return "Cambio pendiente";
        }
        if (upper.startsWith("UPDATE")) {
            return "Actualización pendiente";
        }
        if (upper.startsWith("DELETE")) {
            return "Eliminación pendiente";
        }
        if (upper.startsWith("SELECT")) {
            return "Lectura de visibilidad";
        }
        return "Sentencia avanzada";
    }

    private String construirHintVisibilidad(boolean transaccionAbierta, Object sessionAVisibleRows, Object sessionBVisibleRows) {
        if (!transaccionAbierta) {
            return "Ambas sesiones ya comparten el mismo estado confirmado.";
        }

        if (!Objects.equals(sessionAVisibleRows, sessionBVisibleRows)) {
            return "La Sesión A ya ve su cambio, pero la Sesión B sigue atrapada en el último COMMIT confirmado.";
        }

        return "Aunque el conteo coincida, el punto clave es que la transacción sigue abierta y aislada.";
    }

    private int contarFilas(Statement stmt, String tabla) throws java.sql.SQLException {
        try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM \"" + tabla + "\"")) {
            if (rs.next()) {
                return rs.getInt("total");
            }
        }
        return 0;
    }
}
