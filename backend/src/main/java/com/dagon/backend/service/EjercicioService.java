package com.dagon.backend.service;

import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class EjercicioService {
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private EjercicioPracticoRepository repository;

    public List<NivelDTO> obtenerTodosLosNiveles() {
        List<NivelDTO> modulos = new java.util.ArrayList<>();

        // Vamos a mandar el Módulo como la tarjeta principal
        NivelDTO modulo1 = new NivelDTO();
        modulo1.setId(1); // Este es el id_modulo de tu PostgreSQL
        modulo1.setName("Módulo 1: Selección Básica");
        modulo1.setDescription("Aprende a consultar datos con SELECT y filtros WHERE. Contiene 3 misiones épicas.");
        modulo1.setLocked(false);

        modulos.add(modulo1);

        return modulos;
    }
    public List<EjercicioDTO> obtenerEjerciciosPorModulo(Integer moduloId) {
        List<com.dagon.backend.model.EjercicioPractico> crudos = repository.findByIdModulo(moduloId);
        List<EjercicioDTO> dtos = new java.util.ArrayList<>();

        int contador = 1;
        for(com.dagon.backend.model.EjercicioPractico ej : crudos) {
            EjercicioDTO dto = new EjercicioDTO();
            dto.setId(ej.getIdEjercicio());
            dto.setTitle("Misión " + contador);
            dto.setDescription(ej.getEnunciado());

            // Si es la Misión 1, la hacemos Drag & Drop
            if (contador == 1) {
                dto.setType("drag_drop");
                dto.setHint("Pista: Arrastra las palabras azules hacia el recuadro superior en el orden correcto.");
                // Rompecabezas SQL desordenado:
                dto.setWordBank(java.util.Arrays.asList("aventureros;", "*", "FROM", "SELECT"));
            } else {
                // Las demás misiones usan el editor normal
                dto.setType("editor");
                dto.setStarterCode("-- Escribe tu consulta SQL aquí\n");
                dto.setHint("Pista: Lee bien el nombre de la tabla en el enunciado.");
            }

            dtos.add(dto);
            contador++;
        }
        return dtos;
    }

    // --- 1. EL MOTOR DE EJECUCIÓN SEGURO ---
    private List<Map<String, Object>> ejecutarEnSandbox(String queryUsuario) throws java.sql.SQLException {
        List<Map<String, Object>> resultados = new ArrayList<>();

        // Usamos al usuario de máxima seguridad que acabas de crear
        String url = "jdbc:postgresql://localhost:5432/dagon_db";
        String user = "app_sandbox_user";
        String password = "Taxi2097";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            // Le decimos a PostgreSQL que busque directamente en el cajón "lms_sandbox"
            stmt.execute("SET search_path TO lms_sandbox");

            // Ejecutamos la consulta del alumnoSandboxDagon98
            try (ResultSet rs = stmt.executeQuery(queryUsuario)) {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();

                // Extraemos las filas y columnas reales de la base de datos
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

    // Fíjate que ahora recibe "usuarioId"
    public Map<String, Object> validarConsulta(Integer ejercicioId, String queryUsuario, String usuarioId) {
        Map<String, Object> respuesta = new java.util.HashMap<>();

        com.dagon.backend.model.EjercicioPractico ejercicio = repository.findById(ejercicioId).orElse(null);

        if (ejercicio == null) {
            respuesta.put("success", false);
            respuesta.put("message", "Error: Ejercicio no encontrado.");
            return respuesta;
        }

        try {
            // 1. Ejecutamos ambas consultas en el Sandbox
            List<Map<String, Object>> datosAlumno = ejecutarEnSandbox(queryUsuario);
            List<Map<String, Object>> datosMaestros = ejecutarEnSandbox(ejercicio.getQueryMaestra());

            boolean esCorrecto = datosAlumno.equals(datosMaestros);
            boolean yaResuelto = false;

            // 2. LA BITÁCORA: Si React nos mandó un ID, revisamos y guardamos el historial
            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                // Preguntamos a PostgreSQL si este usuario ya había resuelto este ejercicio antes
                String checkSql = "SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND id_ejercicio = ? AND es_correcto = true";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, usuarioId, ejercicioId);
                yaResuelto = (count != null && count > 0);

                // Guardamos ESTE nuevo intento (correcto o incorrecto) en la base de datos
                String insertSql = "INSERT INTO lms_core.intentos (id_usuario, id_ejercicio, query_enviada, es_correcto) VALUES (?::uuid, ?, ?, ?)";
                jdbcTemplate.update(insertSql, usuarioId, ejercicioId, queryUsuario, esCorrecto);
            }

            // 3. Evaluamos y damos XP según la trampa
            if (esCorrecto) {
                respuesta.put("success", true);

                if (yaResuelto) {
                    // ¡Atrapado! Ya lo había resuelto.
                    respuesta.put("message", "¡Consulta perfecta! (Pero ya habías farmeado esta misión. 0 XP extra)");
                    respuesta.put("xp_gained", 0);
                } else {
                    // ¡Primera vez! Premio gordo.
                    respuesta.put("message", "¡Excelente! Has dominado esta misión.");
                    respuesta.put("xp_gained", 15);
                }
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "La consulta corrió sin errores, pero los datos no coinciden. Revisa tu lógica.");
                respuesta.put("xp_gained", 0);
            }

            respuesta.put("mockData", datosAlumno);

        } catch (java.sql.SQLException e) {
            respuesta.put("success", false);
            respuesta.put("message", "Error de SQL: " + e.getMessage());
            respuesta.put("xp_gained", 0);
        }

        return respuesta;
    }
}