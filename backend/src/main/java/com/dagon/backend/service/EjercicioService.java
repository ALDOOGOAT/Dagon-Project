package com.dagon.backend.service;

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

            // --- LA PEDAGOGÍA DINÁMICA ---
            boolean usarDragAndDrop = false;

            if (moduloId == 1) {
                usarDragAndDrop = true; // Módulo 1: Todo visual
            } else if (moduloId == 2) {
                // Módulo 2: Intercalado (Misión 1 y 3 = D&D, Misión 2 y 4 = Editor)
                usarDragAndDrop = (contador == 1 || contador == 3);
            } else {
                // Módulo 3 en adelante: Uno visual por si acaso, el resto puro código
                usarDragAndDrop = (contador == 2);
            }

            if (usarDragAndDrop) {
                dto.setType("drag_drop");
                dto.setHint("Pista: Arrastra las palabras azules. No olvides el punto y coma (;)");

                String queryReal = ej.getQueryMaestra();
                if (queryReal != null) {
                    Set<String> palabras = new HashSet<>(Arrays.asList(queryReal.replaceAll(";", " ;").split("\\s+")));
                    palabras.addAll(Arrays.asList("WHERE", "JOIN", "ON", "COUNT", "*", "roles", "cursos", "INSERT", "equipamiento"));
                    List<String> bancoPalabras = new ArrayList<>(palabras);
                    Collections.shuffle(bancoPalabras);
                    dto.setWordBank(bancoPalabras);
                }
            } else {
                dto.setType("editor");
                dto.setStarterCode("-- Escribe tu consulta SQL aquí\n");
                dto.setHint("Pista: Recuerda usar la sintaxis correcta y terminar con punto y coma (;).");
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

        // 1. OBTENEMOS EL EJERCICIO PRIMERO (Así todo el método lo conoce)
        EjercicioPractico ejercicio = repository.findById(ejercicioId).orElse(null);

        if (ejercicio == null) {
            respuesta.put("success", false);
            respuesta.put("message", "Error: Ejercicio no encontrado.");
            return respuesta;
        }

        // 2. VALIDACIÓN SINTÁCTICA RÁPIDA (El punto y coma)
        if (!queryUsuario.trim().endsWith(";")) {
            respuesta.put("success", false);
            respuesta.put("message", "¡Error de Sintaxis! Te faltó cerrar la instrucción con el punto y coma (;) al final.");

            // Le pasamos a React el contexto para Clawbot
            respuesta.put("descripcion", ejercicio.getEnunciado());
            respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
            respuesta.put("queryAlumno", queryUsuario);
            respuesta.put("errorDb", "El usuario olvidó el punto y coma al final de la instrucción SQL.");

            return respuesta; // Salimos del método aquí mismo
        }

        // 3. SI TODO VA BIEN, PASAMOS A LA VALIDACIÓN PESADA
        int xpGanada = (ejercicio.getDificultad() != null ? ejercicio.getDificultad() : 1) * 10;

        try {
            List<Map<String, Object>> datosAlumno = ejecutarEnSandbox(queryUsuario);
            List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra());

            boolean esCorrecto = datosAlumno.equals(datosMaestros);
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
                if (yaResuelto) {
                    respuesta.put("message", "¡Consulta perfecta! (Pero ya habías resuelto esta misión. 0 XP extra)");
                    respuesta.put("xp_gained", 0);
                } else {
                    respuesta.put("message", "¡Excelente! Has dominado esta misión.");
                    respuesta.put("xp_gained", xpGanada);
                }
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "La consulta corrió sin errores, pero los datos no coinciden. Revisa tu lógica.");
                respuesta.put("xp_gained", 0);

                // ¡NUEVO! Le pasamos a React el contexto para Clawbot
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

            // ¡NUEVO! Contexto completo para cuando PostgreSQL explota
            respuesta.put("descripcion", ejercicio.getEnunciado());
            respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
            respuesta.put("queryAlumno", queryUsuario);
            respuesta.put("errorDb", e.getMessage());
        }
        return respuesta;
    }
}