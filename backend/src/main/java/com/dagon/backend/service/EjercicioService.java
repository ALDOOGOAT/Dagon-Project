package com.dagon.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        List<EjercicioPractico> crudos = repository.findByIdModulo(moduloId);
        List<EjercicioDTO> dtos = new ArrayList<>();

        int contador = 1;
        for(EjercicioPractico ej : crudos) {
            EjercicioDTO dto = new EjercicioDTO();
            dto.setId(ej.getIdEjercicio());
            dto.setTitle("Misión " + contador);
            dto.setDescription(ej.getEnunciado());

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
                dto.setHint("Pista: Arrastra las palabras azules. No olvides el punto y coma (;)");
                String queryReal = ej.getQueryMaestra();
                if (queryReal != null) {
                    Set<String> palabras = new HashSet<>(Arrays.asList(queryReal.replaceAll(";", " ;").split("\\s+")));
                    palabras.addAll(Arrays.asList("WHERE", "JOIN", "ON", "COUNT", "*", "roles", "cursos", "INSERT", "equipamiento"));
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

    private List<Map<String, Object>> ejecutarEnSandbox(String queryUsuario) throws java.sql.SQLException {
        List<Map<String, Object>> resultados = new ArrayList<>();
        String url = "jdbc:postgresql://localhost:5432/dagon_db";
        String user = "app_sandbox_user";
        String password = "Taxi2097";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            stmt.execute("SET search_path TO lms_sandbox");
            try (ResultSet rs = stmt.executeQuery(queryUsuario)) {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();

                while (rs.next()) {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        fila.put(metaData.getColumnName(i), rs.getObject(i));
                    }
                    resultados.add(fila);
                }
            }
        }
        return resultados;
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
                JsonNode nodes = root.get("nodes");
                JsonNode edges = root.get("edges");

                if (nodes == null || edges == null || nodes.size() < 2 || edges.size() < 1) {
                    respuesta.put("success", false);
                    respuesta.put("message", "El diagrama está incompleto. Necesitas al menos 2 tablas conectadas por una relación (línea).");
                    respuesta.put("xp_gained", 0);
                    return respuesta;
                }

                boolean tieneClientes = false;
                boolean tienePociones = false;

                for (JsonNode node : nodes) {
                    JsonNode data = node.get("data");
                    if (data != null && data.has("label")) {
                        String nombreTabla = data.get("label").asText().toLowerCase().trim();
                        
                        if (nombreTabla.contains("cliente") || nombreTabla.contains("usuario")) {
                            tieneClientes = true;
                        }
                        if (nombreTabla.contains("pocion") || nombreTabla.contains("item") || nombreTabla.contains("producto")) {
                            tienePociones = true;
                        }
                    }
                }

                if (!tieneClientes || !tienePociones) {
                    respuesta.put("success", false);
                    respuesta.put("message", "Arquitectura rechazada. Para 'La Tienda de Pociones' necesitas entidades clave que representen a los 'clientes' y a las 'pociones'.");
                    respuesta.put("xp_gained", 0);
                    return respuesta;
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

                datosAlumno = ejecutarEnSandbox(queryUsuario);
                List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra());
                esCorrecto = datosAlumno.equals(datosMaestros);
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
            respuesta.put("success", false);
            respuesta.put("message", "Error de SQL: " + e.getMessage());
            respuesta.put("xp_gained", 0);
            respuesta.put("descripcion", ejercicio.getEnunciado());
            respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
            respuesta.put("queryAlumno", queryUsuario);
            respuesta.put("errorDb", e.getMessage());
        } catch (Exception e) {
            respuesta.put("success", false);
            respuesta.put("message", "Error al procesar la respuesta: " + e.getMessage());
            respuesta.put("xp_gained", 0);
        }
        return respuesta;
    }
}