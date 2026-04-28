package com.dagon.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
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
    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private EjercicioPracticoRepository repository;

    @Autowired
    private UsuarioService usuarioService;

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
                    Set<String> palabras = new HashSet<>(Arrays.asList(queryReal.replaceAll(";", " ;").split("\\s+")));
                    // Distractores contextuales según el módulo
                    palabras.addAll(Arrays.asList("WHERE", "JOIN", "ON", "COUNT", "*", "roles", "cursos", "INSERT", "equipamiento"));
                    if (moduloId == 1) {
                        palabras.addAll(Arrays.asList("aventureros", "DELETE", "UPDATE", "GROUP", "BY", "HAVING", "ASC", "LIMIT", "ORDER", "LIKE", "DESC", "nombre", "nivel", "clase"));
                    }
                    List<String> bancoPalabras = new ArrayList<>(palabras);
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

            dtos.add(dto);
            contador++;
        }
        return dtos;
    }

    public List<EjercicioDTO> obtenerEjerciciosPracticaRapida() {
        String sql = "SELECT * FROM lms_core.ejercicios_practicos WHERE tipo_mision = 'RAPIDA' ORDER BY RANDOM() LIMIT 3";
        List<Map<String, Object>> crudos = jdbcTemplate.queryForList(sql);

        List<EjercicioDTO> dtos = new ArrayList<>();
        int contador = 1;

        for(Map<String, Object> ejMap : crudos) {
            EjercicioDTO dto = new EjercicioDTO();
            dto.setId((Integer) ejMap.get("id_ejercicio"));
            dto.setTitle("Misión Relámpago " + contador);
            dto.setDescription((String) ejMap.get("enunciado"));

            dto.setType("drag_drop");
            dto.setHint("¡El tiempo es oro! Arrastra los bloques correctos.");

            String queryReal = (String) ejMap.get("query_maestra");
            if (queryReal != null) {
                Set<String> palabras = new HashSet<>(Arrays.asList(queryReal.replaceAll(";", " ;").split("\\s+")));
                palabras.addAll(Arrays.asList("WHERE", "JOIN", "COUNT", "MAX", "MIN", "equipamiento", "INNER"));
                List<String> bancoPalabras = new ArrayList<>(palabras);
                Collections.shuffle(bancoPalabras);
                dto.setWordBank(bancoPalabras);
            }
            dtos.add(dto);
            contador++;
        }
        return dtos;
    }

    private List<Map<String, Object>> ejecutarEnSandboxConRollback(String query, String usuarioId) throws java.sql.SQLException {
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            conn.setAutoCommit(false); // Iniciar transacción
            try (Statement stmt = conn.createStatement()) {
                String searchPath = (usuarioId != null && !usuarioId.trim().isEmpty()) 
                                    ? "sandbox_usuario_" + usuarioId : "lms_sandbox";
                stmt.execute("SET search_path TO \"" + searchPath + "\"");
                
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
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        String queryProcesada = queryUsuario.trim();
        String upperQuery = queryProcesada.toUpperCase();

        queryProcesada = queryProcesada.replaceAll("--.*$", "").trim();

        boolean esDML = upperQuery.contains("INSERT") || upperQuery.contains("UPDATE") || upperQuery.contains("DELETE");
        boolean esDDL = upperQuery.contains("CREATE") || upperQuery.contains("ALTER") || upperQuery.contains("DROP");

        if (esDML && !upperQuery.contains("RETURNING")) {
            queryProcesada = queryProcesada.replaceAll(";\\s*$", "");
            queryProcesada += " RETURNING *;";
        }

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            String searchPath;
            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                searchPath = "sandbox_usuario_" + usuarioId;
                // Intentar crear el esquema si no existe (fail-safe)
                try {
                    stmt.execute("CREATE SCHEMA IF NOT EXISTS \"" + searchPath + "\";");
                    stmt.execute("GRANT ALL ON SCHEMA \"" + searchPath + "\" TO app_sandbox_user;");
                } catch (Exception ignored) {}
                
                stmt.execute("SET search_path TO \"" + searchPath + "\"");
            } else {
                stmt.execute("SET search_path TO lms_sandbox");
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
                // CORREGIDO: Se quitó el ')' erróneo de la expresión regular
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        } else if (upperQuery.contains("ALTER TABLE")) {
            String sinAlter = queryOriginal.replaceAll("(?i)ALTER\\s+TABLE\\s+", "").trim();
            String[] partes = sinAlter.split("\\s+");
            if (partes.length > 0) {
                // CORREGIDO: Se quitó el ')' erróneo de la expresión regular
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        } else if (upperQuery.contains("DROP TABLE")) {
            String sinDrop = queryOriginal.replaceAll("(?i)DROP\\s+TABLE\\s+", "").trim();
            String[] partes = sinDrop.split("\\s+");
            if (partes.length > 0) {
                // CORREGIDO: Se quitó el ')' erróneo de la expresión regular
                tabla = partes[0].replaceAll("[\\(\\)]", "").trim();
            }
        }
        
        return tabla;
    }

    public Map<String, Object> validarConsulta(Integer ejercicioId, String queryUsuario, String usuarioId) {
        Map<String, Object> respuesta = new HashMap<>();

        // --- CAPA DE SEGURIDAD (ESCUDO DE DAGON) ---
        String queryClean = queryUsuario.trim().toLowerCase();
        
        // Bloqueo de comandos administrativos y peligrosos con Regex
        String[] blackList = {
            "drop\\s+database", "drop\\s+schema", "truncate", "alter\\s+role", "create\\s+role", 
            "grant", "revoke", "pg_sleep", "copy\\s+", "drop\\s+table", "create\\s+schema"
        };
        
        for (String regex : blackList) {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(".*\\b" + regex + "\\b.*", java.util.regex.Pattern.DOTALL | java.util.regex.Pattern.CASE_INSENSITIVE);
            if (p.matcher(queryClean).matches()) {
                respuesta.put("success", false);
                respuesta.put("message", "🚫 ¡Acción Prohibida! Los comandos de administración o destrucción están bloqueados por el Escudo de Dagon.");
                // Datos para retroalimentación IA
                EjercicioPractico ejSeg = repository.findById(ejercicioId).orElse(null);
                if (ejSeg != null) {
                    respuesta.put("descripcion", ejSeg.getEnunciado());
                    respuesta.put("queryMaestra", ejSeg.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "Comando prohibido: el alumno intentó usar una instrucción destructiva o administrativa.");
                }
                return respuesta;
            }
        }

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

        int xpGanada = (ejercicio.getDificultad() != null ? ejercicio.getDificultad() : 1) * 10;
        String formato = ejercicio.getFormato();
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

                // 🌟 LEER CONFIGURACIÓN PARA VALIDACIÓN DDL/SECUENCIAS
                boolean isDdlValidation = false;
                String configExtra = ejercicio.getConfiguracionExtra();
                if (configExtra != null && !configExtra.trim().isEmpty()) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode config = mapper.readTree(configExtra);
                        if (config.has("tipo_validacion") && "ddl".equals(config.get("tipo_validacion").asText())) {
                            isDdlValidation = true;
                        }
                    } catch (Exception ignored) {}
                }

                // Determinar si es DML (Cambio de datos)
                String upperQ = queryUsuario.trim().toUpperCase();
                boolean esDML = upperQ.contains("INSERT") || upperQ.contains("UPDATE") || upperQ.contains("DELETE");

                // 🌟 LÓGICA DE VALIDACIÓN MODIFICADA
                if (isDdlValidation) {
                    // Para secuencias o DDL, ejecutamos y si no hay error de SQL, es correcto.
                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    esCorrecto = true;
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
                } else {
                    // Para SELECT normal, comparamos resultados directamente
                    datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                    List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra(), usuarioId);
                    esCorrecto = datosAlumno.equals(datosMaestros);
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

            if (esCorrecto) {
                respuesta.put("success", true);
                if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                    usuarioService.registrarPracticaDiaria(usuarioId);
                }

                String tipo = ejercicio.getTipoMision() != null ? ejercicio.getTipoMision() : "HISTORIA";
                if ("RAPIDA".equals(tipo)) {
                    respuesta.put("message", "¡Relámpago! +5 XP y Racha Salvada 🔥");
                    respuesta.put("xp_gained", 5);
                } else if (yaResuelto) {
                    respuesta.put("message", "¡Perfecto! (Pero ya habías resuelto esta misión. 0 extra)");
                    respuesta.put("xp_gained", 0);
                } else {
                    respuesta.put("message", "¡Excelente! Has dominado esta misión.");
                    respuesta.put("xp_gained", xpGanada);
                }
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "La consulta corrió sin errores, pero los datos no coinciden. Revisa tu lógica.");
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", "Los datos obtenidos no son los esperados.");
            }
            respuesta.put("mockData", datosAlumno);

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
                } catch (Exception ignored) {}
                
                return respuesta;
            }
            // =============================================================
            
            // Detectar si es error de relación que ya existe (no es error crítico)
            boolean yaExiste = sqlError != null && (
                sqlError.toLowerCase().contains("relation") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("table") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("duplicate") && sqlError.toLowerCase().contains("key")
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
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "Error de SQL: " + sqlError);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", sqlError);
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
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "Error al procesar la respuesta: " + errMsg);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", errMsg);
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
}