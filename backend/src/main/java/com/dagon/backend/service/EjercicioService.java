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
                stmt.execute("SET search_path TO \"" + searchPath + "\"");
            } else {
                stmt.execute("SET search_path TO lms_sandbox");
            }
            
            boolean tieneResultSet = stmt.execute(queryProcesada);
            
            if (esDDL && !tieneResultSet) {
                String tablaExtraida = extraerNombreTablaDDL(upperQuery, queryUsuario);
                if (tablaExtraida != null) {
                    String consultaMostrar = "SELECT * FROM " + tablaExtraida + " LIMIT 100;";
                    try {
                        tieneResultSet = stmt.execute(consultaMostrar);
                    } catch (Exception ignored) {}
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
                tabla = partes[0].replaceAll("[\\(\\)])", "").trim();
            }
        } else if (upperQuery.contains("ALTER TABLE")) {
            String sinAlter = queryOriginal.replaceAll("(?i)ALTER\\s+TABLE\\s+", "").trim();
            String[] partes = sinAlter.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0].replaceAll("[\\(\\)])", "").trim();
            }
        } else if (upperQuery.contains("DROP TABLE")) {
            String sinDrop = queryOriginal.replaceAll("(?i)DROP\\s+TABLE\\s+", "").trim();
            String[] partes = sinDrop.split("\\s+");
            if (partes.length > 0) {
                tabla = partes[0].replaceAll("[\\(\\)])", "").trim();
            }
        }
        
        return tabla;
    }

    public Map<String, Object> validarConsulta(Integer ejercicioId, String queryUsuario, String usuarioId) {
        Map<String, Object> respuesta = new HashMap<>();

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
                    return respuesta;
                }

                // Validar cantidad de relaciones
                if (diagramEdges.size() < minRelaciones) {
                    respuesta.put("success", false);
                    respuesta.put("message", mensajeRelaciones + " Necesitas al menos " + minRelaciones + " relación(es).");
                    respuesta.put("xp_gained", 0);
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
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "El usuario olvidó el punto y coma al final de la instrucción SQL.");
                    return respuesta;
                }

                datosAlumno = ejecutarEnSandbox(queryUsuario, usuarioId);
                List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra(), usuarioId);
                
                // Nueva lógica de comparación robusta para DML
                String upperQ = queryUsuario.trim().toUpperCase();
                boolean esDML = upperQ.contains("INSERT") || upperQ.contains("UPDATE") || upperQ.contains("DELETE");
                
                if (esDML) {
                    esCorrecto = compararResultadosDML(datosAlumno, datosMaestros);
                } else {
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
<<<<<<< HEAD
                respuesta.put("message", "⚠️ Ya existe esa relación. Mostrando el contenido actual.");
                respuesta.put("warningType", "already_exists");
                
                // Intentar obtener los datos de todos modos
                try {
                    String tablaExtraida = extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaExtraida != null) {
                        String consultaMostrar = "SELECT * FROM \"" + tablaExtraida + "\" LIMIT 100;";
                        datosAlumno = ejecutarEnSandbox(consultaMostrar, usuarioId);
=======
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
>>>>>>> main
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
            }
        }
        return respuesta;
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