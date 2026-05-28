package com.dagon.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ModuloService {

    private static final Logger logger = LoggerFactory.getLogger(ModuloService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> obtenerModulosConEstado(String identificadorUsuario) {

        String sqlXp = "SELECT xp_total FROM lms_core.v_ranking_alumnos WHERE email = ? OR id_usuario::varchar = ?";
        Integer xpUsuario = 0;
        try {
            Number xpNumber = jdbcTemplate.queryForObject(sqlXp, Number.class, identificadorUsuario, identificadorUsuario);
            xpUsuario = (xpNumber != null) ? xpNumber.intValue() : 0;
        } catch (Exception e) {
            xpUsuario = 0;
        }

        String sqlCursos = "SELECT id_curso, titulo FROM lms_core.cursos ORDER BY id_curso ASC";
        List<Map<String, Object>> cursos = jdbcTemplate.queryForList(sqlCursos);

        String sqlModulos = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida " +
                "FROM lms_core.modulos ORDER BY orden ASC";
        List<Map<String, Object>> todosLosModulos = jdbcTemplate.queryForList(sqlModulos);

        List<Map<String, Object>> resultadoEstructurado = new ArrayList<>();

        for (Map<String, Object> cursoRow : cursos) {
            Map<String, Object> cursoNode = new HashMap<>();
            Integer idCursoActual = (Integer) cursoRow.get("id_curso");
            cursoNode.put("id_curso", idCursoActual);
            cursoNode.put("titulo", cursoRow.get("titulo"));

            List<Map<String, Object>> modulosDelCurso = new ArrayList<>();

            for (Map<String, Object> mod : todosLosModulos) {
                if (mod.get("id_curso").equals(idCursoActual)) {
                    Map<String, Object> moduloConEstado = new HashMap<>(mod);
                    Integer xpReq = (Integer) mod.get("xp_requerida");
                    boolean bloqueado = xpUsuario < (xpReq != null ? xpReq : 0);
                    moduloConEstado.put("bloqueado", bloqueado);
                    modulosDelCurso.add(moduloConEstado);
                }
            }
            cursoNode.put("modulos", modulosDelCurso);
            resultadoEstructurado.add(cursoNode);
        }

        return resultadoEstructurado;
    }

    public List<Integer> obtenerModulosCompletados(String identificadorUsuario) {
        String sql = "SELECT DISTINCT e.id_modulo " +
                "FROM lms_core.intentos i " +
                "JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio " +
                "JOIN lms_core.usuarios u ON i.id_usuario = u.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) AND i.es_correcto = true " +
                "ORDER BY e.id_modulo ASC";
        
        List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, identificadorUsuario, identificadorUsuario);
        List<Integer> modulosCompletados = new ArrayList<>();
        
        for (Map<String, Object> row : resultados) {
            Object idModulo = row.get("id_modulo");
            if (idModulo != null) {
                modulosCompletados.add(((Number) idModulo).intValue());
            }
        }
        
        return modulosCompletados;
    }

    public List<Map<String, Object>> obtenerCursosCompletados(String identificadorUsuario) {
        String sql = "SELECT DISTINCT c.id_curso, c.titulo " +
                "FROM lms_core.cursos c " +
                "JOIN lms_core.modulos m ON c.id_curso = m.id_curso " +
                "JOIN lms_core.ejercicios_practicos e ON m.id_modulo = e.id_modulo " +
                "JOIN lms_core.intentos i ON e.id_ejercicio = i.id_ejercicio " +
                "JOIN lms_core.usuarios u ON i.id_usuario = u.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) " +
                "AND i.es_correcto = true " +
                "GROUP BY c.id_curso, c.titulo, m.id_curso " +
                "HAVING COUNT(DISTINCT e.id_ejercicio) = (" +
                "  SELECT COUNT(*) FROM lms_core.ejercicios_practicos e2 " +
                "  JOIN lms_core.modulos m2 ON e2.id_modulo = m2.id_modulo " +
                "  WHERE m2.id_curso = c.id_curso" +
                ")";
        
        List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, identificadorUsuario, identificadorUsuario);
        return resultados;
    }

    public Map<String, Object> generarCertificado(String identificadorUsuario, Integer cursoId) {
        String sqlUsuario = "SELECT u.nombre, u.email, u.fecha_registro FROM lms_core.usuarios u " +
                "WHERE u.email = ? OR u.id_usuario::varchar = ?";
        
        Map<String, Object> usuarioData = null;
        try {
            usuarioData = jdbcTemplate.queryForMap(sqlUsuario, identificadorUsuario, identificadorUsuario);
        } catch (Exception e) {
            return null;
        }
        
        String sqlCurso = "SELECT titulo FROM lms_core.cursos WHERE id_curso = ?";
        Map<String, Object> cursoData;
        try {
            cursoData = jdbcTemplate.queryForMap(sqlCurso, cursoId);
        } catch (Exception e) {
            return null;
        }
        
        String sqlTotalEjer = "SELECT COUNT(*) FROM lms_core.ejercicios_practicos e " +
                "JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo WHERE m.id_curso = ?";
        int totalEjercicios = jdbcTemplate.queryForObject(sqlTotalEjer, Integer.class, cursoId);
        
        String sqlCompletados = "SELECT COUNT(DISTINCT i.id_ejercicio) FROM lms_core.intentos i " +
                "JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio " +
                "JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo " +
                "JOIN lms_core.usuarios u ON i.id_usuario = u.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) AND m.id_curso = ? AND i.es_correcto = true";
        int ejerciciosCompletados = jdbcTemplate.queryForObject(sqlCompletados, Integer.class, identificadorUsuario, identificadorUsuario, cursoId);
        
        if (ejerciciosCompletados < totalEjercicios) {
            return null;
        }
        
        Map<String, Object> certificado = new HashMap<>();
        certificado.put("nombre", usuarioData.get("nombre"));
        certificado.put("email", usuarioData.get("email"));
        certificado.put("curso", cursoData.get("titulo"));
        certificado.put("fechaCompletado", new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date()));
        certificado.put("ejerciciosCompletados", ejerciciosCompletados);
        certificado.put("codigoVerificacion", "DAGON-" + cursoId + "-" + System.currentTimeMillis());
        
        return certificado;
    }

    public void reiniciarDatosPorEmail(String identificador) {
        // Buscamos por email o por ID convertido a string
        String sqlId = "SELECT id_usuario FROM lms_core.usuarios WHERE email = ? OR id_usuario::varchar = ?";
        try {
            List<java.util.UUID> ids = jdbcTemplate.query(sqlId, (rs, rowNum) -> (java.util.UUID) rs.getObject("id_usuario"), identificador, identificador);
            if (!ids.isEmpty()) {
                reiniciarDatosUsuario(ids.get(0).toString());
            } else {
                logger.warn("No se encontro usuario con identificador: {}", identificador);
            }
        } catch (Exception e) {
            logger.warn("Error buscando usuario para reinicio: {}", e.getMessage());
        }
    }

    public void reiniciarDatosUsuario(String usuarioId) {
        String esquema = "sandbox_usuario_" + usuarioId;

        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS \"" + esquema + "\".\"transferencias_misteriosas\" CASCADE");
        } catch (Exception e) {
            logger.warn("Error limpiando dataset detective: {}", e.getMessage());
        }
        
        // 1. Obtener lista de tablas del template
        String sqlTablas = "SELECT tablename FROM pg_tables WHERE schemaname = 'lms_sandbox_template'";
        List<String> tablas = jdbcTemplate.queryForList(sqlTablas, String.class);

        for (String tabla : tablas) {
            try {
                // Borrar tabla actual del usuario
                jdbcTemplate.execute("DROP TABLE IF EXISTS \"" + esquema + "\".\"" + tabla + "\" CASCADE");
                
                // Clonar de nuevo desde template
                jdbcTemplate.execute("CREATE TABLE \"" + esquema + "\".\"" + tabla + "\" (LIKE lms_sandbox_template.\"" + tabla + "\" INCLUDING ALL)");
                jdbcTemplate.execute("INSERT INTO \"" + esquema + "\".\"" + tabla + "\" SELECT * FROM lms_sandbox_template.\"" + tabla + "\"");
                
                // Asegurar Ownership
                jdbcTemplate.execute("ALTER TABLE \"" + esquema + "\".\"" + tabla + "\" OWNER TO app_sandbox_user");
            } catch (Exception e) {
                logger.warn("Error restaurando tabla {}: {}", tabla, e.getMessage());
            }
        }
    }
}
