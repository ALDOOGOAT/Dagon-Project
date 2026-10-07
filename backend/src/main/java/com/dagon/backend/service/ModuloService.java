package com.dagon.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ModuloService {

    private static final Logger logger = LoggerFactory.getLogger(ModuloService.class);

    // Solo cuentan para completar un curso/modulo las misiones del temario oficial:
    // las privadas de docentes/grupos y la practica relampago no se exigen a nadie.
    private static final String FILTRO_EJERCICIO_OFICIAL =
            "COALESCE(e.visibilidad, 'GLOBAL') = 'GLOBAL' AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA' ";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static String normalizarMateria(String materia) {
        return (materia == null || materia.isBlank()) ? "sql" : materia.trim().toLowerCase();
    }

    public List<Map<String, Object>> obtenerModulosConEstado(String identificadorUsuario, String materia) {

        String materiaSlug = normalizarMateria(materia);
        boolean accesoDocente = usuarioEsDocenteOAdmin(identificadorUsuario);

        // El desbloqueo depende de la XP de esta materia, no de la global.
        String sqlXp = "SELECT COALESCE(SUM(x.xp), 0) FROM lms_core.v_xp_por_materia x " +
                "JOIN lms_core.usuarios u ON u.id_usuario = x.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) AND x.materia_slug = ?";
        Integer xpUsuario = 0;
        try {
            Number xpNumber = jdbcTemplate.queryForObject(sqlXp, Number.class, identificadorUsuario, identificadorUsuario, materiaSlug);
            xpUsuario = (xpNumber != null) ? xpNumber.intValue() : 0;
        } catch (Exception e) {
            xpUsuario = 0;
        }

        String sqlCursos = "SELECT id_curso, titulo, materia_slug FROM lms_core.cursos " +
                "WHERE materia_slug = ? ORDER BY id_curso ASC";
        List<Map<String, Object>> cursos = jdbcTemplate.queryForList(sqlCursos, materiaSlug);

        String sqlModulos = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida " +
                "FROM lms_core.modulos ORDER BY orden ASC";
        List<Map<String, Object>> todosLosModulos = jdbcTemplate.queryForList(sqlModulos);

        List<Map<String, Object>> resultadoEstructurado = new ArrayList<>();

        for (Map<String, Object> cursoRow : cursos) {
            Map<String, Object> cursoNode = new HashMap<>();
            Integer idCursoActual = (Integer) cursoRow.get("id_curso");
            cursoNode.put("id_curso", idCursoActual);
            cursoNode.put("titulo", cursoRow.get("titulo"));
            cursoNode.put("materia_slug", cursoRow.get("materia_slug"));

            List<Map<String, Object>> modulosDelCurso = new ArrayList<>();

            for (Map<String, Object> mod : todosLosModulos) {
                if (mod.get("id_curso").equals(idCursoActual)) {
                    Map<String, Object> moduloConEstado = new HashMap<>(mod);
                    Integer xpReq = (Integer) mod.get("xp_requerida");
                    boolean bloqueado = !accesoDocente && xpUsuario < (xpReq != null ? xpReq : 0);
                    moduloConEstado.put("bloqueado", bloqueado);
                    moduloConEstado.put("desbloqueado_por_rol", accesoDocente);
                    modulosDelCurso.add(moduloConEstado);
                }
            }
            cursoNode.put("modulos", modulosDelCurso);
            resultadoEstructurado.add(cursoNode);
        }

        return resultadoEstructurado;
    }

    // Catalogo de materias con el progreso del alumno: XP de la materia y modulos completados
    // (modulo completado = todas sus misiones oficiales resueltas).
    public List<Map<String, Object>> obtenerMateriasConProgreso(String identificadorUsuario) {
        List<Map<String, Object>> materias = jdbcTemplate.queryForList(
                "SELECT slug, nombre, descripcion, orden FROM lms_core.materias WHERE activa ORDER BY orden ASC, slug ASC");

        Map<String, Integer> xpPorMateria = new HashMap<>();
        for (Map<String, Object> fila : jdbcTemplate.queryForList(
                "SELECT x.materia_slug, x.xp FROM lms_core.v_xp_por_materia x " +
                        "JOIN lms_core.usuarios u ON u.id_usuario = x.id_usuario " +
                        "WHERE u.email = ? OR u.id_usuario::varchar = ?",
                identificadorUsuario, identificadorUsuario)) {
            xpPorMateria.put((String) fila.get("materia_slug"), numero(fila.get("xp")));
        }

        String sqlModulos = "SELECT materia_slug, COUNT(*) AS modulos_total, " +
                "COUNT(*) FILTER (WHERE total > 0 AND total = resueltos) AS modulos_completados FROM (" +
                "  SELECT c.materia_slug, m.id_modulo, COUNT(e.id_ejercicio) AS total, " +
                "         COUNT(r.id_ejercicio) AS resueltos " +
                "  FROM lms_core.cursos c " +
                "  JOIN lms_core.modulos m ON m.id_curso = c.id_curso " +
                "  LEFT JOIN lms_core.ejercicios_practicos e ON e.id_modulo = m.id_modulo AND " + FILTRO_EJERCICIO_OFICIAL +
                "  LEFT JOIN (SELECT DISTINCT i.id_ejercicio FROM lms_core.intentos i " +
                "             JOIN lms_core.usuarios u ON u.id_usuario = i.id_usuario " +
                "             WHERE (u.email = ? OR u.id_usuario::varchar = ?) AND i.es_correcto = true) r " +
                "         ON r.id_ejercicio = e.id_ejercicio " +
                "  GROUP BY c.materia_slug, m.id_modulo" +
                ") t GROUP BY materia_slug";
        Map<String, Map<String, Object>> progreso = new HashMap<>();
        for (Map<String, Object> fila : jdbcTemplate.queryForList(sqlModulos, identificadorUsuario, identificadorUsuario)) {
            progreso.put((String) fila.get("materia_slug"), fila);
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map<String, Object> materia : materias) {
            String slug = (String) materia.get("slug");
            Map<String, Object> prog = progreso.getOrDefault(slug, Map.of());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("slug", slug);
            item.put("nombre", materia.get("nombre"));
            item.put("descripcion", materia.get("descripcion"));
            item.put("orden", numero(materia.get("orden")));
            item.put("xp", xpPorMateria.getOrDefault(slug, 0));
            item.put("modulosTotal", numero(prog.get("modulos_total")));
            item.put("modulosCompletados", numero(prog.get("modulos_completados")));
            resultado.add(item);
        }
        return resultado;
    }

    private static int numero(Object valor) {
        return valor instanceof Number n ? n.intValue() : 0;
    }

    private boolean usuarioEsDocenteOAdmin(String identificadorUsuario) {
        if (identificadorUsuario == null || identificadorUsuario.isBlank()) return false;
        try {
            Integer idRol = jdbcTemplate.queryForObject(
                    "SELECT id_rol FROM lms_core.usuarios WHERE email = ? OR id_usuario::varchar = ?",
                    Integer.class,
                    identificadorUsuario,
                    identificadorUsuario
            );
            return idRol != null && (idRol == 2 || idRol == 3);
        } catch (Exception e) {
            return false;
        }
    }

    public List<Integer> obtenerModulosCompletados(String identificadorUsuario) {
        String sql = "SELECT m.id_modulo FROM lms_core.modulos m " +
                "JOIN lms_core.ejercicios_practicos e ON e.id_modulo = m.id_modulo " +
                "LEFT JOIN lms_core.intentos i ON i.id_ejercicio = e.id_ejercicio AND i.es_correcto = true " +
                "AND i.id_usuario IN (SELECT u.id_usuario FROM lms_core.usuarios u " +
                "WHERE u.email = ? OR u.id_usuario::varchar = ?) " +
                "WHERE COALESCE(e.visibilidad, 'GLOBAL') = 'GLOBAL' " +
                "AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA' " +
                "GROUP BY m.id_modulo HAVING COUNT(DISTINCT e.id_ejercicio) > 0 " +
                "AND COUNT(DISTINCT e.id_ejercicio) = COUNT(DISTINCT i.id_ejercicio) " +
                "ORDER BY m.id_modulo ASC";

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
        String sql = "SELECT DISTINCT c.id_curso, c.titulo, c.materia_slug " +
                "FROM lms_core.cursos c " +
                "JOIN lms_core.modulos m ON c.id_curso = m.id_curso " +
                "JOIN lms_core.ejercicios_practicos e ON m.id_modulo = e.id_modulo " +
                "JOIN lms_core.intentos i ON e.id_ejercicio = i.id_ejercicio " +
                "JOIN lms_core.usuarios u ON i.id_usuario = u.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) " +
                "AND i.es_correcto = true AND " + FILTRO_EJERCICIO_OFICIAL +
                "GROUP BY c.id_curso, c.titulo, c.materia_slug " +
                "HAVING COUNT(DISTINCT e.id_ejercicio) = (" +
                "  SELECT COUNT(*) FROM lms_core.ejercicios_practicos e " +
                "  JOIN lms_core.modulos m2 ON e.id_modulo = m2.id_modulo " +
                "  WHERE m2.id_curso = c.id_curso AND " + FILTRO_EJERCICIO_OFICIAL +
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
                "JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo WHERE m.id_curso = ? AND " + FILTRO_EJERCICIO_OFICIAL;
        int totalEjercicios = jdbcTemplate.queryForObject(sqlTotalEjer, Integer.class, cursoId);
        
        String sqlCompletados = "SELECT COUNT(DISTINCT i.id_ejercicio) FROM lms_core.intentos i " +
                "JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio " +
                "JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo " +
                "JOIN lms_core.usuarios u ON i.id_usuario = u.id_usuario " +
                "WHERE (u.email = ? OR u.id_usuario::varchar = ?) AND m.id_curso = ? AND i.es_correcto = true AND " + FILTRO_EJERCICIO_OFICIAL;
        int ejerciciosCompletados = jdbcTemplate.queryForObject(sqlCompletados, Integer.class, identificadorUsuario, identificadorUsuario, cursoId);
        
        if (totalEjercicios == 0 || ejerciciosCompletados < totalEjercicios) {
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
        // UUID tipado y función de privilegios mínimos; el backend no ejecuta DDL como propietario.
        java.util.UUID id = java.util.UUID.fromString(usuarioId);
        jdbcTemplate.queryForList("SELECT lms_core.fn_provisionar_sandbox(?::uuid, true)", id.toString());
    }
}
