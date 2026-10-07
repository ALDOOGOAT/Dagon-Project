package com.dagon.backend.service;

import com.dagon.backend.dto.DocenteDTO.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class DocenteService {

    private static final Logger logger = LoggerFactory.getLogger(DocenteService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String cteAlumnosPermitidos(boolean esAdmin) {
        if (esAdmin) {
            return "WITH alumnos_permitidos AS ( " +
                    "SELECT id_usuario FROM lms_core.usuarios " +
                    "WHERE activo = true AND id_rol = 1 " +
                    ") ";
        }

        return "WITH alumnos_permitidos AS ( " +
                "SELECT DISTINCT ga.id_alumno AS id_usuario " +
                "FROM lms_core.grupo_alumnos ga " +
                "JOIN lms_core.grupos_docente gd ON gd.id_grupo = ga.id_grupo " +
                "JOIN lms_core.usuarios u ON u.id_usuario = ga.id_alumno " +
                "WHERE gd.id_docente = ?::uuid " +
                "AND gd.activo = true " +
                "AND ga.activo = true " +
                "AND u.activo = true " +
                "AND u.id_rol = 1 " +
                ") ";
    }

    private void agregarDocenteParam(List<Object> params, String docenteId, boolean esAdmin) {
        if (!esAdmin) {
            params.add(docenteId);
        }
    }

    private void validarGrupoDelDocente(String docenteId, boolean esAdmin, Long idGrupo) {
        if (esAdmin) return;

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM lms_core.grupos_docente " +
                        "WHERE id_grupo = ? AND id_docente = ?::uuid AND activo = true",
                Integer.class,
                idGrupo,
                docenteId
        );

        if (total == null || total == 0) {
            throw new AccessDeniedException("Este grupo no pertenece al docente autenticado");
        }
    }

    private void validarAlumnoDelDocente(String docenteId, boolean esAdmin, String alumnoId) {
        if (esAdmin) return;

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) " +
                        "FROM lms_core.grupo_alumnos ga " +
                        "JOIN lms_core.grupos_docente gd ON gd.id_grupo = ga.id_grupo " +
                        "WHERE gd.id_docente = ?::uuid " +
                        "AND ga.id_alumno = ?::uuid " +
                        "AND gd.activo = true " +
                        "AND ga.activo = true",
                Integer.class,
                docenteId,
                alumnoId
        );

        if (total == null || total == 0) {
            throw new AccessDeniedException("Este alumno no pertenece al docente autenticado");
        }
    }

    public List<AlumnoProgresoDTO> obtenerProgresoAlumnos(
            String docenteId,
            boolean esAdmin,
            LocalDate desde,
            LocalDate hasta,
            Integer idModulo,
            Integer idCurso) {

        List<Object> params = new ArrayList<>();
        agregarDocenteParam(params, docenteId, esAdmin);

        List<String> filtros = new ArrayList<>();

        if (desde != null) {
            filtros.add("i.fecha_intento >= ?::timestamp");
            params.add(desde.toString() + " 00:00:00");
        }

        if (hasta != null) {
            filtros.add("i.fecha_intento <= ?::timestamp");
            params.add(hasta.toString() + " 23:59:59");
        }

        if (idModulo != null) {
            filtros.add("ep.id_modulo = ?");
            params.add(idModulo);
        }

        if (idCurso != null) {
            filtros.add("m.id_curso = ?");
            params.add(idCurso);
        }

        String whereIntentos = filtros.isEmpty()
                ? ""
                : "WHERE " + String.join(" AND ", filtros) + " ";

        String sql = cteAlumnosPermitidos(esAdmin) +
                ", intentos_filtrados AS ( " +
                "   SELECT i.id_usuario, i.id_ejercicio, i.es_correcto, i.fecha_intento, COALESCE(ep.dificultad, 1) AS dificultad " +
                "   FROM lms_core.intentos i " +
                "   JOIN lms_core.ejercicios_practicos ep ON ep.id_ejercicio = i.id_ejercicio " +
                "   JOIN lms_core.modulos m ON m.id_modulo = ep.id_modulo " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                whereIntentos +
                "), correctos_unicos AS ( " +
                "   SELECT DISTINCT id_usuario, id_ejercicio, dificultad " +
                "   FROM intentos_filtrados " +
                "   WHERE es_correcto = true " +
                "), intentos_resumen AS ( " +
                "   SELECT id_usuario, COUNT(*) AS total_intentos " +
                "   FROM intentos_filtrados " +
                "   GROUP BY id_usuario " +
                "), progreso AS ( " +
                "   SELECT id_usuario, " +
                "          COUNT(*) AS ejercicios_completados, " +
                "          COALESCE(SUM(dificultad * 10), 0) AS xp " +
                "   FROM correctos_unicos " +
                "   GROUP BY id_usuario " +
                ") " +
                "SELECT u.id_usuario, u.nombre, u.email, u.racha_actual, u.fecha_registro, " +
                "       COALESCE(p.xp, 0) AS xp, " +
                "       COALESCE(p.ejercicios_completados, 0) AS ejercicios_completados, " +
                "       COALESCE(ir.total_intentos, 0) AS total_intentos " +
                "FROM alumnos_permitidos ap " +
                "JOIN lms_core.usuarios u ON u.id_usuario = ap.id_usuario " +
                "LEFT JOIN progreso p ON p.id_usuario = u.id_usuario " +
                "LEFT JOIN intentos_resumen ir ON ir.id_usuario = u.id_usuario " +
                "ORDER BY xp DESC, ejercicios_completados DESC, u.nombre";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new AlumnoProgresoDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("xp"),
                        rs.getInt("ejercicios_completados"),
                        rs.getInt("total_intentos"),
                        rs.getInt("racha_actual"),
                        rs.getTimestamp("fecha_registro") != null
                                ? rs.getTimestamp("fecha_registro").toLocalDateTime()
                                : null
                ));
    }

    public List<EjercicioFalladoDTO> obtenerEjerciciosFallados(
            String docenteId,
            boolean esAdmin,
            Integer idModulo,
            Integer idCurso,
            LocalDate desde,
            LocalDate hasta) {

        List<Object> params = new ArrayList<>();
        agregarDocenteParam(params, docenteId, esAdmin);

        List<String> filtros = new ArrayList<>();

        if (idModulo != null) {
            filtros.add("ep.id_modulo = ?");
            params.add(idModulo);
        }

        if (idCurso != null) {
            filtros.add("m.id_curso = ?");
            params.add(idCurso);
        }

        if (desde != null) {
            filtros.add("i.fecha_intento >= ?::timestamp");
            params.add(desde.toString() + " 00:00:00");
        }

        if (hasta != null) {
            filtros.add("i.fecha_intento <= ?::timestamp");
            params.add(hasta.toString() + " 23:59:59");
        }

        String where = filtros.isEmpty()
                ? ""
                : "WHERE " + String.join(" AND ", filtros) + " ";

        String sql = cteAlumnosPermitidos(esAdmin) +
                "SELECT ep.id_ejercicio, ep.titulo, m.titulo AS modulo, " +
                "COUNT(*) AS intentos_totales, " +
                "SUM(CASE WHEN i.es_correcto = false THEN 1 ELSE 0 END) AS intentos_fallidos, " +
                "ROUND(SUM(CASE WHEN i.es_correcto = false THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS tasa_error " +
                "FROM lms_core.intentos i " +
                "JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "JOIN lms_core.ejercicios_practicos ep ON i.id_ejercicio = ep.id_ejercicio " +
                "JOIN lms_core.modulos m ON ep.id_modulo = m.id_modulo " +
                where +
                "GROUP BY ep.id_ejercicio, ep.titulo, m.titulo " +
                "ORDER BY tasa_error DESC, intentos_fallidos DESC " +
                "LIMIT 20";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new EjercicioFalladoDTO(
                        rs.getInt("id_ejercicio"),
                        rs.getString("titulo"),
                        rs.getString("modulo"),
                        rs.getInt("intentos_totales"),
                        rs.getInt("intentos_fallidos"),
                        rs.getDouble("tasa_error")
                ));
    }

    public List<ModuloAbandonoDTO> obtenerAbandonoModulos(
            String docenteId,
            boolean esAdmin,
            Integer idCurso) {

        List<Object> params = new ArrayList<>();
        agregarDocenteParam(params, docenteId, esAdmin);

        List<String> filtrosModulo = new ArrayList<>();

        if (idCurso != null) {
            filtrosModulo.add("m.id_curso = ?");
            params.add(idCurso);
        }

        String whereModulo = filtrosModulo.isEmpty()
                ? ""
                : "WHERE " + String.join(" AND ", filtrosModulo) + " ";

        String sql = cteAlumnosPermitidos(esAdmin) +
                ", modulos_filtrados AS ( " +
                "   SELECT m.id_modulo, m.titulo, m.orden " +
                "   FROM lms_core.modulos m " +
                whereModulo +
                "), intentos_modulo AS ( " +
                "   SELECT ep.id_modulo, i.id_usuario, i.es_correcto " +
                "   FROM lms_core.ejercicios_practicos ep " +
                "   JOIN modulos_filtrados mf ON mf.id_modulo = ep.id_modulo " +
                "   LEFT JOIN lms_core.intentos i ON i.id_ejercicio = ep.id_ejercicio " +
                "   LEFT JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   WHERE i.id_usuario IS NULL OR ap.id_usuario IS NOT NULL " +
                ") " +
                "SELECT mf.id_modulo, mf.titulo, " +
                "COUNT(DISTINCT im.id_usuario) AS alumnos_que_iniciaron, " +
                "COUNT(DISTINCT CASE WHEN im.es_correcto = true THEN im.id_usuario END) AS alumnos_que_completaron, " +
                "CASE " +
                "   WHEN COUNT(DISTINCT im.id_usuario) = 0 THEN 0 " +
                "   ELSE ROUND((1 - COUNT(DISTINCT CASE WHEN im.es_correcto = true THEN im.id_usuario END)::numeric / " +
                "        COUNT(DISTINCT im.id_usuario)) * 100, 1) " +
                "END AS tasa_abandono " +
                "FROM modulos_filtrados mf " +
                "LEFT JOIN intentos_modulo im ON im.id_modulo = mf.id_modulo " +
                "GROUP BY mf.id_modulo, mf.titulo, mf.orden " +
                "ORDER BY mf.orden";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new ModuloAbandonoDTO(
                        rs.getInt("id_modulo"),
                        rs.getString("titulo"),
                        rs.getInt("alumnos_que_iniciaron"),
                        rs.getInt("alumnos_que_completaron"),
                        rs.getDouble("tasa_abandono")
                ));
    }

    public List<TiempoModuloDTO> obtenerTiempoPromedioPorModulo(
            String docenteId,
            boolean esAdmin,
            Integer idCurso) {

        List<Object> params = new ArrayList<>();
        agregarDocenteParam(params, docenteId, esAdmin);

        List<String> filtros = new ArrayList<>();

        if (idCurso != null) {
            filtros.add("m.id_curso = ?");
            params.add(idCurso);
        }

        String where = filtros.isEmpty()
                ? ""
                : "WHERE " + String.join(" AND ", filtros) + " ";

        String sql = cteAlumnosPermitidos(esAdmin) +
                "SELECT m.id_modulo, m.titulo, " +
                "COALESCE(ROUND(AVG(i.tiempo_ms)::numeric, 2), 0) AS tiempo_promedio_ms, " +
                "COUNT(i.id_intento) AS intentos_totales " +
                "FROM lms_core.modulos m " +
                "JOIN lms_core.ejercicios_practicos ep ON m.id_modulo = ep.id_modulo " +
                "LEFT JOIN lms_core.intentos i ON ep.id_ejercicio = i.id_ejercicio " +
                "LEFT JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                where +
                (where.isEmpty() ? "WHERE " : "AND ") +
                "(i.id_usuario IS NULL OR ap.id_usuario IS NOT NULL) " +
                "GROUP BY m.id_modulo, m.titulo, m.orden " +
                "ORDER BY m.orden";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new TiempoModuloDTO(
                        rs.getInt("id_modulo"),
                        rs.getString("titulo"),
                        rs.getDouble("tiempo_promedio_ms"),
                        rs.getInt("intentos_totales")
                ));
    }

    public List<IntentoDetalleDTO> obtenerIntentosAlumno(
            String docenteId,
            boolean esAdmin,
            String alumnoId,
            Integer idModulo,
            LocalDate desde,
            LocalDate hasta) {

        validarAlumnoDelDocente(docenteId, esAdmin, alumnoId);

        List<Object> params = new ArrayList<>();
        params.add(alumnoId);

        List<String> filtros = new ArrayList<>();
        filtros.add("i.id_usuario = ?::uuid");

        if (idModulo != null) {
            filtros.add("ep.id_modulo = ?");
            params.add(idModulo);
        }

        if (desde != null) {
            filtros.add("i.fecha_intento >= ?::timestamp");
            params.add(desde.toString() + " 00:00:00");
        }

        if (hasta != null) {
            filtros.add("i.fecha_intento <= ?::timestamp");
            params.add(hasta.toString() + " 23:59:59");
        }

        String sql = "SELECT i.id_intento, i.id_ejercicio, ep.titulo AS titulo_ejercicio, " +
                "i.query_enviada, i.es_correcto, i.tiempo_ms, i.fecha_intento " +
                "FROM lms_core.intentos i " +
                "JOIN lms_core.ejercicios_practicos ep ON i.id_ejercicio = ep.id_ejercicio " +
                "WHERE " + String.join(" AND ", filtros) + " " +
                "ORDER BY i.fecha_intento DESC " +
                "LIMIT 200";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new IntentoDetalleDTO(
                        UUID.fromString(rs.getString("id_intento")),
                        rs.getInt("id_ejercicio"),
                        rs.getString("titulo_ejercicio"),
                        rs.getString("query_enviada"),
                        rs.getBoolean("es_correcto"),
                        rs.getObject("tiempo_ms") != null ? rs.getDouble("tiempo_ms") : null,
                        rs.getTimestamp("fecha_intento").toLocalDateTime()
                ));
    }

    public Map<String, Object> obtenerResumen(
            String docenteId,
            boolean esAdmin,
            LocalDate desde,
            LocalDate hasta,
            Integer idModulo,
            Integer idCurso) {
        return obtenerTablero(docenteId, esAdmin, desde, hasta, idModulo, idCurso);
    }

    public Map<String, Object> obtenerTablero(
            String docenteId,
            boolean esAdmin,
            LocalDate desde,
            LocalDate hasta,
            Integer idModulo,
            Integer idCurso) {

        Map<String, Object> resumen = new LinkedHashMap<>();

        resumen.put("alumnos", obtenerProgresoAlumnos(docenteId, esAdmin, desde, hasta, idModulo, idCurso));
        resumen.put("ejercicios_fallados", obtenerEjerciciosFallados(docenteId, esAdmin, idModulo, idCurso, desde, hasta));
        resumen.put("abandono_modulos", obtenerAbandonoModulos(docenteId, esAdmin, idCurso));
        resumen.put("tiempo_promedio", obtenerTiempoPromedioPorModulo(docenteId, esAdmin, idCurso));

        try {
            List<Object> params = new ArrayList<>();
            agregarDocenteParam(params, docenteId, esAdmin);

            List<String> filtros = new ArrayList<>();

            if (desde != null) {
                filtros.add("i.fecha_intento >= ?::timestamp");
                params.add(desde.toString() + " 00:00:00");
            }

            if (hasta != null) {
                filtros.add("i.fecha_intento <= ?::timestamp");
                params.add(hasta.toString() + " 23:59:59");
            }

            if (idModulo != null) {
                filtros.add("ep.id_modulo = ?");
                params.add(idModulo);
            }

            if (idCurso != null) {
                filtros.add("m.id_curso = ?");
                params.add(idCurso);
            }

            String where = filtros.isEmpty()
                    ? ""
                    : "WHERE " + String.join(" AND ", filtros) + " ";

            String sqlMetricas = cteAlumnosPermitidos(esAdmin) +
                    ", intentos_filtrados AS ( " +
                    "   SELECT i.* " +
                    "   FROM lms_core.intentos i " +
                    "   JOIN lms_core.ejercicios_practicos ep ON ep.id_ejercicio = i.id_ejercicio " +
                    "   JOIN lms_core.modulos m ON m.id_modulo = ep.id_modulo " +
                    "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                    where +
                    ") " +
                    "SELECT " +
                    "   (SELECT COUNT(*) FROM alumnos_permitidos) AS total_alumnos, " +
                    "   (SELECT COUNT(*) FROM intentos_filtrados) AS total_intentos, " +
                    "   (SELECT COUNT(*) FROM intentos_filtrados WHERE es_correcto = true) AS intentos_correctos";

            Map<String, Object> row = jdbcTemplate.queryForMap(sqlMetricas, params.toArray());

            int totalAlumnos = ((Number) row.get("total_alumnos")).intValue();
            int totalIntentos = ((Number) row.get("total_intentos")).intValue();
            int intentosCorrectos = ((Number) row.get("intentos_correctos")).intValue();

            double tasaAciertoGlobal = totalIntentos > 0
                    ? Math.round(intentosCorrectos * 1000.0 / totalIntentos) / 10.0
                    : 0;

            resumen.put("total_alumnos", totalAlumnos);
            resumen.put("total_intentos", totalIntentos);
            resumen.put("intentos_correctos", intentosCorrectos);
            resumen.put("tasa_acierto_global", tasaAciertoGlobal);

        } catch (Exception e) {
            logger.warn("Error calculando metricas docentes: {}", e.getMessage());
            resumen.put("total_alumnos", 0);
            resumen.put("total_intentos", 0);
            resumen.put("intentos_correctos", 0);
            resumen.put("tasa_acierto_global", 0);
        }

        resumen.put("cursos", jdbcTemplate.queryForList(
                "SELECT id_curso, titulo FROM lms_core.cursos ORDER BY id_curso"));

        resumen.put("modulos", jdbcTemplate.queryForList(
                "SELECT m.id_modulo, m.titulo, m.id_curso, COALESCE(c.materia_slug, 'sql') AS materia_slug " +
                        "FROM lms_core.modulos m LEFT JOIN lms_core.cursos c ON c.id_curso = m.id_curso ORDER BY m.orden"));

        resumen.put("grupos", listarGrupos(docenteId, esAdmin));

        return resumen;
    }

    public Map<String, Object> obtenerResumenCalificaciones(
            String docenteId,
            boolean esAdmin,
            Integer idCurso,
            Integer idModulo) {

        List<Object> baseParams = new ArrayList<>();
        String baseCte = construirCteCalificaciones(docenteId, esAdmin, idCurso, idModulo, baseParams);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("escala", "0-10");
        resultado.put("criterio", "Ejercicio resuelto correctamente = 10; pendiente = 0. Modulo y curso se calculan por porcentaje de ejercicios resueltos. No incluye practicas relampago.");
        resultado.put("modulos", consultarCalificacionesModulo(baseCte, baseParams));
        resultado.put("cursos", consultarCalificacionesCurso(baseCte, baseParams));
        return resultado;
    }

    public Map<String, Object> obtenerCalificacionesEjercicios(
            String docenteId,
            boolean esAdmin,
            Integer idCurso,
            Integer idModulo,
            String alumnoId,
            Integer page,
            Integer size) {

        String alumnoNormalizado = alumnoId != null && !alumnoId.isBlank() ? alumnoId.trim() : null;
        if (alumnoNormalizado != null) {
            validarAlumnoDelDocente(docenteId, esAdmin, alumnoNormalizado);
        }

        int pagina = Math.max(0, page != null ? page : 0);
        int tamano = Math.max(1, Math.min(size != null ? size : 50, 200));
        int offset = pagina * tamano;

        List<Object> baseParams = new ArrayList<>();
        String baseCte = construirCteCalificaciones(docenteId, esAdmin, idCurso, idModulo, baseParams);
        String whereAlumno = alumnoNormalizado != null ? "WHERE ap.id_usuario = ?::uuid " : "";

        List<Object> totalParams = new ArrayList<>(baseParams);
        if (alumnoNormalizado != null) {
            totalParams.add(alumnoNormalizado);
        }

        String totalSql = baseCte +
                "SELECT COUNT(*) " +
                "FROM alumnos_permitidos ap " +
                "CROSS JOIN ejercicios_base eb " +
                whereAlumno;

        long total = Optional.ofNullable(jdbcTemplate.queryForObject(
                totalSql,
                totalParams.toArray(),
                Long.class
        )).orElse(0L);

        List<Object> dataParams = new ArrayList<>(baseParams);
        if (alumnoNormalizado != null) {
            dataParams.add(alumnoNormalizado);
        }
        dataParams.add(tamano);
        dataParams.add(offset);

        String sqlEjercicios = baseCte +
                ", intentos_resumen AS ( " +
                "   SELECT i.id_usuario, i.id_ejercicio, COUNT(*) AS total_intentos, " +
                "          BOOL_OR(i.es_correcto) AS resuelto, " +
                "          MAX(CASE WHEN i.es_correcto THEN i.fecha_intento END) AS fecha_resuelto " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   GROUP BY i.id_usuario, i.id_ejercicio " +
                ") " +
                "SELECT ap.id_usuario, u.nombre, u.email, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, " +
                "       eb.id_ejercicio, eb.ejercicio, COALESCE(ir.total_intentos, 0) AS total_intentos, " +
                "       COALESCE(ir.resuelto, false) AS resuelto, " +
                "       CASE WHEN COALESCE(ir.resuelto, false) THEN 10.0 ELSE 0.0 END AS calificacion, " +
                "       ir.fecha_resuelto " +
                "FROM alumnos_permitidos ap " +
                "JOIN lms_core.usuarios u ON u.id_usuario = ap.id_usuario " +
                "CROSS JOIN ejercicios_base eb " +
                "LEFT JOIN intentos_resumen ir ON ir.id_usuario = ap.id_usuario AND ir.id_ejercicio = eb.id_ejercicio " +
                whereAlumno +
                "ORDER BY u.nombre, eb.id_curso, eb.orden_modulo, eb.orden_ejercicio, eb.id_ejercicio " +
                "LIMIT ? OFFSET ?";

        List<CalificacionEjercicioDTO> items = jdbcTemplate.query(sqlEjercicios, dataParams.toArray(), (rs, rowNum) ->
                new CalificacionEjercicioDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("id_modulo"),
                        rs.getString("modulo"),
                        rs.getInt("id_ejercicio"),
                        rs.getString("ejercicio"),
                        rs.getInt("total_intentos"),
                        rs.getBoolean("resuelto"),
                        rs.getDouble("calificacion"),
                        rs.getTimestamp("fecha_resuelto") != null
                                ? rs.getTimestamp("fecha_resuelto").toLocalDateTime()
                                : null
                ));

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("items", items);
        resultado.put("page", pagina);
        resultado.put("size", tamano);
        resultado.put("total", total);
        return resultado;
    }

    public Map<String, Object> obtenerCalificaciones(
            String docenteId,
            boolean esAdmin,
            Integer idCurso,
            Integer idModulo) {

        List<Object> baseParams = new ArrayList<>();
        String baseCte = construirCteCalificaciones(docenteId, esAdmin, idCurso, idModulo, baseParams);

        List<Object> paramsEjercicios = new ArrayList<>(baseParams);
        String sqlEjercicios = baseCte +
                ", intentos_resumen AS ( " +
                "   SELECT i.id_usuario, i.id_ejercicio, COUNT(*) AS total_intentos, " +
                "          BOOL_OR(i.es_correcto) AS resuelto, " +
                "          MAX(CASE WHEN i.es_correcto THEN i.fecha_intento END) AS fecha_resuelto " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   GROUP BY i.id_usuario, i.id_ejercicio " +
                ") " +
                "SELECT ap.id_usuario, u.nombre, u.email, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, " +
                "       eb.id_ejercicio, eb.ejercicio, COALESCE(ir.total_intentos, 0) AS total_intentos, " +
                "       COALESCE(ir.resuelto, false) AS resuelto, " +
                "       CASE WHEN COALESCE(ir.resuelto, false) THEN 10.0 ELSE 0.0 END AS calificacion, " +
                "       ir.fecha_resuelto " +
                "FROM alumnos_permitidos ap " +
                "JOIN lms_core.usuarios u ON u.id_usuario = ap.id_usuario " +
                "CROSS JOIN ejercicios_base eb " +
                "LEFT JOIN intentos_resumen ir ON ir.id_usuario = ap.id_usuario AND ir.id_ejercicio = eb.id_ejercicio " +
                "ORDER BY u.nombre, eb.id_curso, eb.orden_modulo, eb.orden_ejercicio, eb.id_ejercicio";

        List<CalificacionEjercicioDTO> ejercicios = jdbcTemplate.query(sqlEjercicios, paramsEjercicios.toArray(), (rs, rowNum) ->
                new CalificacionEjercicioDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("id_modulo"),
                        rs.getString("modulo"),
                        rs.getInt("id_ejercicio"),
                        rs.getString("ejercicio"),
                        rs.getInt("total_intentos"),
                        rs.getBoolean("resuelto"),
                        rs.getDouble("calificacion"),
                        rs.getTimestamp("fecha_resuelto") != null
                                ? rs.getTimestamp("fecha_resuelto").toLocalDateTime()
                                : null
                ));

        List<Object> paramsModulos = new ArrayList<>(baseParams);
        String sqlModulos = baseCte +
                ", resueltos AS ( " +
                "   SELECT DISTINCT i.id_usuario, i.id_ejercicio " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   WHERE i.es_correcto = true " +
                "), resumen_modulo AS ( " +
                "   SELECT ap.id_usuario, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, " +
                "          COUNT(eb.id_ejercicio) AS ejercicios_totales, " +
                "          COUNT(r.id_ejercicio) AS ejercicios_resueltos " +
                "   FROM alumnos_permitidos ap " +
                "   CROSS JOIN ejercicios_base eb " +
                "   LEFT JOIN resueltos r ON r.id_usuario = ap.id_usuario AND r.id_ejercicio = eb.id_ejercicio " +
                "   GROUP BY ap.id_usuario, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, eb.orden_modulo " +
                ") " +
                "SELECT rm.*, u.nombre, u.email, " +
                "       CASE WHEN rm.ejercicios_totales = 0 THEN 0 " +
                "            ELSE ROUND((rm.ejercicios_resueltos::numeric / rm.ejercicios_totales) * 10, 2) END AS calificacion " +
                "FROM resumen_modulo rm " +
                "JOIN lms_core.usuarios u ON u.id_usuario = rm.id_usuario " +
                "ORDER BY u.nombre, rm.id_curso, rm.id_modulo";

        List<CalificacionModuloDTO> modulos = jdbcTemplate.query(sqlModulos, paramsModulos.toArray(), (rs, rowNum) ->
                new CalificacionModuloDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("id_modulo"),
                        rs.getString("modulo"),
                        rs.getInt("ejercicios_totales"),
                        rs.getInt("ejercicios_resueltos"),
                        rs.getDouble("calificacion")
                ));

        List<Object> paramsCursos = new ArrayList<>(baseParams);
        String sqlCursos = baseCte +
                ", resueltos AS ( " +
                "   SELECT DISTINCT i.id_usuario, i.id_ejercicio " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   WHERE i.es_correcto = true " +
                "), resumen_curso AS ( " +
                "   SELECT ap.id_usuario, eb.id_curso, eb.curso, " +
                "          COUNT(eb.id_ejercicio) AS ejercicios_totales, " +
                "          COUNT(r.id_ejercicio) AS ejercicios_resueltos " +
                "   FROM alumnos_permitidos ap " +
                "   CROSS JOIN ejercicios_base eb " +
                "   LEFT JOIN resueltos r ON r.id_usuario = ap.id_usuario AND r.id_ejercicio = eb.id_ejercicio " +
                "   GROUP BY ap.id_usuario, eb.id_curso, eb.curso " +
                ") " +
                "SELECT rc.*, u.nombre, u.email, " +
                "       CASE WHEN rc.ejercicios_totales = 0 THEN 0 " +
                "            ELSE ROUND((rc.ejercicios_resueltos::numeric / rc.ejercicios_totales) * 10, 2) END AS calificacion " +
                "FROM resumen_curso rc " +
                "JOIN lms_core.usuarios u ON u.id_usuario = rc.id_usuario " +
                "ORDER BY u.nombre, rc.id_curso";

        List<CalificacionCursoDTO> cursos = jdbcTemplate.query(sqlCursos, paramsCursos.toArray(), (rs, rowNum) ->
                new CalificacionCursoDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("ejercicios_totales"),
                        rs.getInt("ejercicios_resueltos"),
                        rs.getDouble("calificacion")
                ));

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("escala", "0-10");
        resultado.put("criterio", "Ejercicio resuelto correctamente = 10; pendiente = 0. Modulo y curso se calculan por porcentaje de ejercicios resueltos. No incluye practicas relampago.");
        resultado.put("ejercicios", ejercicios);
        resultado.put("modulos", modulos);
        resultado.put("cursos", cursos);
        return resultado;
    }

    private List<CalificacionModuloDTO> consultarCalificacionesModulo(String baseCte, List<Object> baseParams) {
        List<Object> paramsModulos = new ArrayList<>(baseParams);
        String sqlModulos = baseCte +
                ", resueltos AS ( " +
                "   SELECT DISTINCT i.id_usuario, i.id_ejercicio " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   WHERE i.es_correcto = true " +
                "), resumen_modulo AS ( " +
                "   SELECT ap.id_usuario, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, " +
                "          COUNT(eb.id_ejercicio) AS ejercicios_totales, " +
                "          COUNT(r.id_ejercicio) AS ejercicios_resueltos " +
                "   FROM alumnos_permitidos ap " +
                "   CROSS JOIN ejercicios_base eb " +
                "   LEFT JOIN resueltos r ON r.id_usuario = ap.id_usuario AND r.id_ejercicio = eb.id_ejercicio " +
                "   GROUP BY ap.id_usuario, eb.id_curso, eb.curso, eb.id_modulo, eb.modulo, eb.orden_modulo " +
                ") " +
                "SELECT rm.*, u.nombre, u.email, " +
                "       CASE WHEN rm.ejercicios_totales = 0 THEN 0 " +
                "            ELSE ROUND((rm.ejercicios_resueltos::numeric / rm.ejercicios_totales) * 10, 2) END AS calificacion " +
                "FROM resumen_modulo rm " +
                "JOIN lms_core.usuarios u ON u.id_usuario = rm.id_usuario " +
                "ORDER BY u.nombre, rm.id_curso, rm.id_modulo";

        return jdbcTemplate.query(sqlModulos, paramsModulos.toArray(), (rs, rowNum) ->
                new CalificacionModuloDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("id_modulo"),
                        rs.getString("modulo"),
                        rs.getInt("ejercicios_totales"),
                        rs.getInt("ejercicios_resueltos"),
                        rs.getDouble("calificacion")
                ));
    }

    private List<CalificacionCursoDTO> consultarCalificacionesCurso(String baseCte, List<Object> baseParams) {
        List<Object> paramsCursos = new ArrayList<>(baseParams);
        String sqlCursos = baseCte +
                ", resueltos AS ( " +
                "   SELECT DISTINCT i.id_usuario, i.id_ejercicio " +
                "   FROM lms_core.intentos i " +
                "   JOIN alumnos_permitidos ap ON ap.id_usuario = i.id_usuario " +
                "   JOIN ejercicios_base eb ON eb.id_ejercicio = i.id_ejercicio " +
                "   WHERE i.es_correcto = true " +
                "), resumen_curso AS ( " +
                "   SELECT ap.id_usuario, eb.id_curso, eb.curso, " +
                "          COUNT(eb.id_ejercicio) AS ejercicios_totales, " +
                "          COUNT(r.id_ejercicio) AS ejercicios_resueltos " +
                "   FROM alumnos_permitidos ap " +
                "   CROSS JOIN ejercicios_base eb " +
                "   LEFT JOIN resueltos r ON r.id_usuario = ap.id_usuario AND r.id_ejercicio = eb.id_ejercicio " +
                "   GROUP BY ap.id_usuario, eb.id_curso, eb.curso " +
                ") " +
                "SELECT rc.*, u.nombre, u.email, " +
                "       CASE WHEN rc.ejercicios_totales = 0 THEN 0 " +
                "            ELSE ROUND((rc.ejercicios_resueltos::numeric / rc.ejercicios_totales) * 10, 2) END AS calificacion " +
                "FROM resumen_curso rc " +
                "JOIN lms_core.usuarios u ON u.id_usuario = rc.id_usuario " +
                "ORDER BY u.nombre, rc.id_curso";

        return jdbcTemplate.query(sqlCursos, paramsCursos.toArray(), (rs, rowNum) ->
                new CalificacionCursoDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("id_curso"),
                        rs.getString("curso"),
                        rs.getInt("ejercicios_totales"),
                        rs.getInt("ejercicios_resueltos"),
                        rs.getDouble("calificacion")
                ));
    }

    private String construirCteCalificaciones(
            String docenteId,
            boolean esAdmin,
            Integer idCurso,
            Integer idModulo,
            List<Object> params) {

        agregarDocenteParam(params, docenteId, esAdmin);

        StringBuilder sql = new StringBuilder(cteAlumnosPermitidos(esAdmin));
        sql.append(", ejercicios_base AS ( ")
                .append("SELECT ep.id_ejercicio, ep.titulo AS ejercicio, ep.id_modulo, m.titulo AS modulo, ")
                .append("m.orden AS orden_modulo, COALESCE(ep.orden, ep.id_ejercicio) AS orden_ejercicio, ")
                .append("m.id_curso, c.titulo AS curso ")
                .append("FROM lms_core.ejercicios_practicos ep ")
                .append("JOIN lms_core.modulos m ON m.id_modulo = ep.id_modulo ")
                .append("JOIN lms_core.cursos c ON c.id_curso = m.id_curso ")
                .append("WHERE COALESCE(ep.tipo_mision, 'HISTORIA') <> 'RAPIDA' ");

        if (idCurso != null) {
            sql.append("AND m.id_curso = ? ");
            params.add(idCurso);
        }

        if (idModulo != null) {
            sql.append("AND ep.id_modulo = ? ");
            params.add(idModulo);
        }

        if (!esAdmin) {
            sql.append("AND (COALESCE(ep.visibilidad, 'GLOBAL') = 'GLOBAL' ")
                    .append("OR ep.creado_por = ?::uuid ")
                    .append("OR ep.id_grupo IN (")
                    .append("   SELECT gd.id_grupo FROM lms_core.grupos_docente gd ")
                    .append("   WHERE gd.id_docente = ?::uuid AND gd.activo = true")
                    .append(")) ");
            params.add(docenteId);
            params.add(docenteId);
        }

        sql.append(") ");
        return sql.toString();
    }

    public String exportarCSV(
            String docenteId,
            boolean esAdmin,
            LocalDate desde,
            LocalDate hasta,
            Integer idModulo,
            Integer idCurso) {

        List<AlumnoProgresoDTO> alumnos = obtenerProgresoAlumnos(
                docenteId,
                esAdmin,
                desde,
                hasta,
                idModulo,
                idCurso
        );

        StringBuilder csv = new StringBuilder();
        csv.append("Nombre,Email,XP,Ejercicios Completados,Total Intentos,Racha Actual,Fecha Registro\n");

        for (AlumnoProgresoDTO a : alumnos) {
            csv.append(escaparCSV(a.nombre())).append(",");
            csv.append(escaparCSV(a.email())).append(",");
            csv.append(a.xp()).append(",");
            csv.append(a.ejerciciosCompletados()).append(",");
            csv.append(a.totalIntentos()).append(",");
            csv.append(a.racha()).append(",");
            csv.append(a.fechaRegistro() != null ? a.fechaRegistro().toString() : "").append("\n");
        }

        return csv.toString();
    }

    public List<GrupoDocenteDTO> listarGrupos(String docenteId, boolean esAdmin) {
        List<Object> params = new ArrayList<>();

        String where = "";
        if (!esAdmin) {
            where = "WHERE gd.id_docente = ?::uuid ";
            params.add(docenteId);
        }

        String sql = "SELECT gd.id_grupo, gd.nombre_grupo, gd.codigo_acceso, gd.descripcion, gd.activo, gd.fecha_creacion, " +
                "COUNT(CASE WHEN ga.activo = true THEN ga.id_alumno END) AS total_alumnos " +
                "FROM lms_core.grupos_docente gd " +
                "LEFT JOIN lms_core.grupo_alumnos ga ON ga.id_grupo = gd.id_grupo " +
                where +
                "GROUP BY gd.id_grupo, gd.nombre_grupo, gd.codigo_acceso, gd.descripcion, gd.activo, gd.fecha_creacion " +
                "ORDER BY gd.fecha_creacion DESC";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new GrupoDocenteDTO(
                        rs.getLong("id_grupo"),
                        rs.getString("nombre_grupo"),
                        rs.getString("codigo_acceso"),
                        rs.getString("descripcion"),
                        rs.getBoolean("activo"),
                        rs.getTimestamp("fecha_creacion") != null
                                ? rs.getTimestamp("fecha_creacion").toLocalDateTime()
                                : null,
                        rs.getInt("total_alumnos")
                ));
    }

    public GrupoDocenteDTO crearGrupo(String docenteId, CrearGrupoRequest request) {
        if (request == null || request.nombreGrupo() == null || request.nombreGrupo().isBlank()) {
            throw new IllegalArgumentException("El nombre del grupo es obligatorio");
        }

        String codigoAcceso = generarCodigoGrupo();
        String sql = "INSERT INTO lms_core.grupos_docente (id_docente, nombre_grupo, codigo_acceso, descripcion) " +
                "VALUES (?::uuid, ?, ?, ?) " +
                "RETURNING id_grupo, nombre_grupo, codigo_acceso, descripcion, activo, fecha_creacion";

        return jdbcTemplate.queryForObject(sql,
                (rs, rowNum) -> new GrupoDocenteDTO(
                        rs.getLong("id_grupo"),
                        rs.getString("nombre_grupo"),
                        rs.getString("codigo_acceso"),
                        rs.getString("descripcion"),
                        rs.getBoolean("activo"),
                        rs.getTimestamp("fecha_creacion").toLocalDateTime(),
                        0
                ),
                docenteId,
                request.nombreGrupo().trim(),
                codigoAcceso,
                request.descripcion()
        );
    }

    private String generarCodigoGrupo() {
        for (int intento = 0; intento < 6; intento++) {
            String codigo = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.grupos_docente WHERE UPPER(codigo_acceso) = ?",
                    Integer.class,
                    codigo
            );
            if (total == null || total == 0) {
                return codigo;
            }
        }
        throw new IllegalStateException("No se pudo generar un codigo de grupo unico");
    }

    public List<AlumnoProgresoDTO> listarAlumnosGrupo(String docenteId, boolean esAdmin, Long idGrupo) {
        validarGrupoDelDocente(docenteId, esAdmin, idGrupo);

        String sql = "SELECT u.id_usuario, u.nombre, u.email, u.racha_actual, u.fecha_registro, " +
                "COALESCE(r.xp_total, 0) AS xp, " +
                "COALESCE(r.ejercicios_resueltos, 0) AS ejercicios_completados, " +
                "COALESCE(intentos.total_intentos, 0) AS total_intentos " +
                "FROM lms_core.grupo_alumnos ga " +
                "JOIN lms_core.usuarios u ON u.id_usuario = ga.id_alumno " +
                "LEFT JOIN lms_core.v_ranking_alumnos r ON r.id_usuario = u.id_usuario " +
                "LEFT JOIN ( " +
                "   SELECT id_usuario, COUNT(*) AS total_intentos " +
                "   FROM lms_core.intentos " +
                "   GROUP BY id_usuario " +
                ") intentos ON intentos.id_usuario = u.id_usuario " +
                "WHERE ga.id_grupo = ? " +
                "AND ga.activo = true " +
                "AND u.activo = true " +
                "ORDER BY u.nombre";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new AlumnoProgresoDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("xp"),
                        rs.getInt("ejercicios_completados"),
                        rs.getInt("total_intentos"),
                        rs.getInt("racha_actual"),
                        rs.getTimestamp("fecha_registro") != null
                                ? rs.getTimestamp("fecha_registro").toLocalDateTime()
                                : null
                ),
                idGrupo
        );
    }

    public void agregarAlumnoGrupo(String docenteId, boolean esAdmin, Long idGrupo, String alumnoId, String emailAlumno) {
        validarGrupoDelDocente(docenteId, esAdmin, idGrupo);

        String alumnoResuelto = resolverAlumnoParaGrupo(alumnoId, emailAlumno);

        jdbcTemplate.update(
                "INSERT INTO lms_core.grupo_alumnos (id_grupo, id_alumno, activo) " +
                        "VALUES (?, ?::uuid, true) " +
                        "ON CONFLICT (id_grupo, id_alumno) DO UPDATE SET activo = true, fecha_asignacion = now()",
                idGrupo,
                alumnoResuelto
        );
    }

    private String resolverAlumnoParaGrupo(String alumnoId, String emailAlumno) {
        if (alumnoId != null && !alumnoId.isBlank()) {
            Integer esAlumno = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.usuarios " +
                            "WHERE id_usuario = ?::uuid AND activo = true AND id_rol = 1",
                    Integer.class,
                    alumnoId
            );

            if (esAlumno != null && esAlumno > 0) {
                return alumnoId;
            }
        }

        if (emailAlumno != null && !emailAlumno.isBlank()) {
            try {
                return jdbcTemplate.queryForObject(
                        "SELECT id_usuario::text FROM lms_core.usuarios " +
                                "WHERE LOWER(email) = LOWER(?) AND activo = true AND id_rol = 1",
                        String.class,
                        emailAlumno.trim()
                );
            } catch (Exception ignored) {
                // Se lanza el error unificado abajo.
            }
        }

        throw new IllegalArgumentException("El alumno indicado no existe o no tiene rol de alumno");
    }

    public void quitarAlumnoGrupo(String docenteId, boolean esAdmin, Long idGrupo, String alumnoId) {
        validarGrupoDelDocente(docenteId, esAdmin, idGrupo);

        jdbcTemplate.update(
                "UPDATE lms_core.grupo_alumnos " +
                        "SET activo = false " +
                        "WHERE id_grupo = ? AND id_alumno = ?::uuid",
                idGrupo,
                alumnoId
        );
    }

    public EvaluacionDTO guardarEvaluacion(
            String docenteId,
            boolean esAdmin,
            CrearEvaluacionRequest request) {

        if (request == null || request.idAlumno() == null || request.idAlumno().isBlank()) {
            throw new IllegalArgumentException("El alumno es obligatorio");
        }

        if (request.calificacion() < 0 || request.calificacion() > 10) {
            throw new IllegalArgumentException("La calificacion debe estar entre 0 y 10");
        }

        validarAlumnoDelDocente(docenteId, esAdmin, request.idAlumno());

        String sql = "INSERT INTO lms_core.evaluaciones_docente " +
                "(id_docente, id_alumno, id_curso, id_modulo, calificacion, comentario) " +
                "VALUES (?::uuid, ?::uuid, ?, ?, ?, ?) " +
                "ON CONFLICT (id_docente, id_alumno, id_modulo) " +
                "DO UPDATE SET calificacion = EXCLUDED.calificacion, " +
                "comentario = EXCLUDED.comentario, " +
                "fecha_evaluacion = now() " +
                "RETURNING id_evaluacion, id_docente, id_alumno, id_curso, id_modulo, calificacion, comentario, fecha_evaluacion";

        return jdbcTemplate.queryForObject(sql,
                (rs, rowNum) -> new EvaluacionDTO(
                        rs.getLong("id_evaluacion"),
                        UUID.fromString(rs.getString("id_docente")),
                        UUID.fromString(rs.getString("id_alumno")),
                        rs.getObject("id_curso") != null ? rs.getInt("id_curso") : null,
                        rs.getObject("id_modulo") != null ? rs.getInt("id_modulo") : null,
                        rs.getDouble("calificacion"),
                        rs.getString("comentario"),
                        rs.getTimestamp("fecha_evaluacion").toLocalDateTime()
                ),
                docenteId,
                request.idAlumno(),
                request.idCurso(),
                request.idModulo(),
                request.calificacion(),
                request.comentario()
        );
    }

    public List<EvaluacionDTO> obtenerEvaluacionesAlumno(
            String docenteId,
            boolean esAdmin,
            String alumnoId) {

        validarAlumnoDelDocente(docenteId, esAdmin, alumnoId);

        List<Object> params = new ArrayList<>();
        params.add(alumnoId);

        String whereDocente = "";
        if (!esAdmin) {
            whereDocente = "AND id_docente = ?::uuid ";
            params.add(docenteId);
        }

        String sql = "SELECT id_evaluacion, id_docente, id_alumno, id_curso, id_modulo, " +
                "calificacion, comentario, fecha_evaluacion " +
                "FROM lms_core.evaluaciones_docente " +
                "WHERE id_alumno = ?::uuid " +
                whereDocente +
                "ORDER BY fecha_evaluacion DESC";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new EvaluacionDTO(
                        rs.getLong("id_evaluacion"),
                        UUID.fromString(rs.getString("id_docente")),
                        UUID.fromString(rs.getString("id_alumno")),
                        rs.getObject("id_curso") != null ? rs.getInt("id_curso") : null,
                        rs.getObject("id_modulo") != null ? rs.getInt("id_modulo") : null,
                        rs.getDouble("calificacion"),
                        rs.getString("comentario"),
                        rs.getTimestamp("fecha_evaluacion").toLocalDateTime()
                ));
    }

    public List<EjercicioDocenteDTO> listarEjerciciosDocente(String docenteId, boolean esAdmin) {
    List<Object> params = new ArrayList<>();

    String where;
    if (esAdmin) {
        where = "WHERE COALESCE(ep.visibilidad, 'GLOBAL') <> 'GLOBAL' ";
    } else {
        where = "WHERE ep.creado_por = ?::uuid ";
        params.add(docenteId);
    }

    String sql = "SELECT ep.id_ejercicio, ep.id_modulo, ep.titulo, ep.enunciado, " +
            "ep.query_maestra, ep.dificultad, ep.formato, ep.configuracion_extra::text AS configuracion_extra, " +
            "ep.orden, ep.tipo_mision, ep.creado_por, ep.visibilidad, ep.id_grupo, gd.nombre_grupo " +
            "FROM lms_core.ejercicios_practicos ep " +
            "LEFT JOIN lms_core.grupos_docente gd ON gd.id_grupo = ep.id_grupo " +
            where +
            "ORDER BY ep.id_modulo, ep.orden, ep.id_ejercicio";

    return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) -> mapEjercicioDocente(rs));
}

public EjercicioDocenteDTO crearEjercicioDocente(
        String docenteId,
        boolean esAdmin,
        CrearEjercicioDocenteRequest request) {

    if (request == null) {
        throw new IllegalArgumentException("Los datos del ejercicio son obligatorios");
    }

    if (request.idModulo() == null) {
        throw new IllegalArgumentException("El modulo es obligatorio");
    }

    if (request.titulo() == null || request.titulo().isBlank()) {
        throw new IllegalArgumentException("El titulo es obligatorio");
    }

    if (request.enunciado() == null || request.enunciado().isBlank()) {
        throw new IllegalArgumentException("El enunciado es obligatorio");
    }

    // IO solo admite misiones NUMERICO (sin SQL); SQL sigue exigiendo su query maestra.
    String materia = jdbcTemplate.query(
            "SELECT COALESCE(c.materia_slug, 'sql') FROM lms_core.modulos m " +
                    "LEFT JOIN lms_core.cursos c ON c.id_curso = m.id_curso WHERE m.id_modulo = ?",
            rs -> rs.next() ? rs.getString(1) : null, request.idModulo());
    if (materia == null) {
        throw new IllegalArgumentException("El modulo no existe");
    }
    boolean esIo = "io".equals(materia);
    String configuracionNumerica = esIo ? normalizarMisionNumerica(request.configuracionExtra()) : null;
    if (!esIo && esConfiguracionNumerica(request.configuracionExtra())) {
        throw new IllegalArgumentException("Las misiones numericas solo se publican en modulos de Investigacion de Operaciones");
    }
    if (!esIo && (request.queryMaestra() == null || request.queryMaestra().isBlank())) {
        throw new IllegalArgumentException("La query maestra es obligatoria");
    }

    String visibilidad = request.visibilidad();

    if (visibilidad == null || visibilidad.isBlank()) {
        visibilidad = request.idGrupo() != null ? "GRUPO" : "DOCENTE";
    }

    visibilidad = visibilidad.trim().toUpperCase(Locale.ROOT);

    if (!visibilidad.equals("GRUPO") && !visibilidad.equals("DOCENTE")) {
        throw new IllegalArgumentException("La visibilidad debe ser GRUPO o DOCENTE");
    }

    Long idGrupo = request.idGrupo();

    if (visibilidad.equals("GRUPO")) {
        if (idGrupo == null) {
            throw new IllegalArgumentException("Para visibilidad GRUPO debes indicar idGrupo");
        }

        validarGrupoDelDocente(docenteId, esAdmin, idGrupo);
    } else {
        idGrupo = null;
    }

    Integer dificultad = request.dificultad() != null ? request.dificultad() : 1;

    if (dificultad < 1 || dificultad > 5) {
        throw new IllegalArgumentException("La dificultad debe estar entre 1 y 5");
    }

    String formato = request.formato();

    if (formato == null || formato.isBlank()) {
        formato = "editor";
    }

    formato = formato.trim().toLowerCase(Locale.ROOT);

    if (!formato.equals("editor") && !formato.equals("drag_drop") && !formato.equals("diagram")) {
        throw new IllegalArgumentException("El formato debe ser editor, drag_drop o diagram");
    }

    String tipoMision = request.tipoMision();

    if (tipoMision == null || tipoMision.isBlank()) {
        tipoMision = "DOCENTE";
    }

    Integer orden = request.orden();

    if (orden == null) {
        orden = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(orden), 0) + 1 " +
                        "FROM lms_core.ejercicios_practicos " +
                        "WHERE id_modulo = ?",
                Integer.class,
                request.idModulo()
        );
    }

    String configuracionExtra = esIo ? configuracionNumerica : request.configuracionExtra();

    if (configuracionExtra != null && configuracionExtra.isBlank()) {
        configuracionExtra = null;
    }

    String sql = "INSERT INTO lms_core.ejercicios_practicos " +
            "(id_modulo, titulo, enunciado, query_maestra, dificultad, formato, " +
            "configuracion_extra, orden, tipo_mision, creado_por, visibilidad, id_grupo) " +
            "VALUES (?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?, ?, ?::uuid, ?, ?) " +
            "RETURNING id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, " +
            "formato, configuracion_extra::text AS configuracion_extra, orden, tipo_mision, " +
            "creado_por, visibilidad, id_grupo";

    return jdbcTemplate.queryForObject(sql,
            (rs, rowNum) -> mapEjercicioDocente(rs),
            request.idModulo(),
            request.titulo(),
            request.enunciado(),
            esIo ? "" : request.queryMaestra(),
            dificultad,
            formato,
            configuracionExtra,
            orden,
            tipoMision,
            docenteId,
            visibilidad,
            idGrupo
    );
}

private static final com.fasterxml.jackson.databind.ObjectMapper JSON_MISION = new com.fasterxml.jackson.databind.ObjectMapper();

private static boolean esConfiguracionNumerica(String json) {
    if (json == null || json.isBlank()) return false;
    try {
        return "NUMERICO".equalsIgnoreCase(JSON_MISION.readTree(json).path("tipo_validacion").asText());
    } catch (Exception e) {
        return false;
    }
}

/**
 * Valida y normaliza una mision NUMERICO de IO creada por un docente: campos numero/opcion,
 * respuestas para cada campo (numeros finitos o fracciones a/b) y tolerancias acotadas.
 * Devuelve el JSON que se guarda; las respuestas nunca viajan al alumno (ver EjercicioDTO).
 */
static String normalizarMisionNumerica(String json) {
    if (json == null || json.isBlank()) throw new IllegalArgumentException("Define los campos y las respuestas de la mision");
    com.fasterxml.jackson.databind.JsonNode raiz;
    try {
        raiz = JSON_MISION.readTree(json);
    } catch (Exception e) {
        throw new IllegalArgumentException("La configuracion de la mision no es JSON valido");
    }
    var campos = raiz.path("campos");
    if (!campos.isArray() || campos.isEmpty() || campos.size() > 10) throw new IllegalArgumentException("La mision necesita de 1 a 10 campos");
    var respuestas = raiz.path("respuestas");
    if (!respuestas.isObject()) throw new IllegalArgumentException("Faltan las respuestas esperadas");
    var salida = JSON_MISION.createObjectNode().put("tipo_validacion", "NUMERICO");
    var camposSalida = salida.putArray("campos");
    var respuestasSalida = salida.putObject("respuestas");
    Set<String> claves = new HashSet<>();
    for (var campo : campos) {
        String clave = campo.path("clave").asText("");
        String etiqueta = campo.path("etiqueta").asText("").trim();
        String tipo = campo.path("tipo").asText("numero");
        if (!clave.matches("[a-zA-Z][a-zA-Z0-9_]{0,29}") || !claves.add(clave)) throw new IllegalArgumentException("Cada campo necesita una clave unica (letras, numeros y _)");
        if (etiqueta.isEmpty() || etiqueta.length() > 80) throw new IllegalArgumentException("Cada campo necesita una etiqueta de hasta 80 caracteres");
        if (!tipo.equals("numero") && !tipo.equals("opcion")) throw new IllegalArgumentException("El tipo de campo debe ser numero u opcion");
        var esperado = respuestas.get(clave);
        if (esperado == null || esperado.isNull()) throw new IllegalArgumentException("Falta la respuesta del campo " + clave);
        var salidaCampo = camposSalida.addObject().put("clave", clave).put("etiqueta", etiqueta).put("tipo", tipo);
        if (campo.hasNonNull("unidad")) salidaCampo.put("unidad", campo.path("unidad").asText("").trim());
        if (tipo.equals("opcion")) {
            var opciones = campo.path("opciones");
            if (!opciones.isArray() || opciones.size() < 2 || opciones.size() > 8) throw new IllegalArgumentException("Un campo de opcion necesita de 2 a 8 opciones");
            var lista = salidaCampo.putArray("opciones");
            boolean contiene = false;
            for (var o : opciones) {
                String opcion = o.asText("").trim();
                if (opcion.isEmpty() || opcion.length() > 80) throw new IllegalArgumentException("Las opciones deben tener texto de hasta 80 caracteres");
                lista.add(opcion);
                contiene |= opcion.equals(esperado.asText().trim());
            }
            if (!contiene) throw new IllegalArgumentException("La respuesta de " + clave + " debe ser una de sus opciones");
            respuestasSalida.put(clave, esperado.asText().trim());
        } else {
            double valor;
            if (esperado.isNumber()) valor = esperado.asDouble();
            else {
                String texto = esperado.asText("").trim().replace(',', '.');
                var fraccion = java.util.regex.Pattern.compile("^([-+]?\\d+(?:\\.\\d+)?)\\s*/\\s*([-+]?\\d+(?:\\.\\d+)?)$").matcher(texto);
                try {
                    valor = fraccion.matches() ? Double.parseDouble(fraccion.group(1)) / Double.parseDouble(fraccion.group(2)) : Double.parseDouble(texto);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("La respuesta de " + clave + " debe ser un numero o una fraccion a/b");
                }
            }
            if (!Double.isFinite(valor) || Math.abs(valor) > 1e12) throw new IllegalArgumentException("La respuesta de " + clave + " debe ser un numero finito");
            respuestasSalida.put(clave, valor);
        }
    }
    if (respuestas.size() != claves.size()) throw new IllegalArgumentException("Hay respuestas sin campo correspondiente");
    var tolerancia = raiz.path("tolerancia");
    double abs = tolerancia.path("abs").asDouble(0.001), rel = tolerancia.path("rel").asDouble(0.001);
    if (!(abs >= 0 && abs <= 1e6) || !(rel >= 0 && rel <= 1)) throw new IllegalArgumentException("Tolerancia fuera de rango (abs 0..1e6, rel 0..1)");
    salida.putObject("tolerancia").put("abs", abs).put("rel", rel);
    return salida.toString();
}

private EjercicioDocenteDTO mapEjercicioDocente(java.sql.ResultSet rs) throws java.sql.SQLException {
    String creadoPorRaw = rs.getString("creado_por");

    return new EjercicioDocenteDTO(
            rs.getInt("id_ejercicio"),
            rs.getInt("id_modulo"),
            rs.getString("titulo"),
            rs.getString("enunciado"),
            rs.getString("query_maestra"),
            rs.getObject("dificultad") != null ? rs.getInt("dificultad") : null,
            rs.getString("formato"),
            rs.getString("configuracion_extra"),
            rs.getObject("orden") != null ? rs.getInt("orden") : null,
            rs.getString("tipo_mision"),
            creadoPorRaw != null ? UUID.fromString(creadoPorRaw) : null,
            rs.getString("visibilidad"),
            rs.getObject("id_grupo") != null ? rs.getLong("id_grupo") : null,
            tieneColumna(rs, "nombre_grupo") ? rs.getString("nombre_grupo") : null
    );
}
    private boolean tieneColumna(java.sql.ResultSet rs, String columna) throws java.sql.SQLException {
        java.sql.ResultSetMetaData meta = rs.getMetaData();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            if (columna.equalsIgnoreCase(meta.getColumnLabel(i))) {
                return true;
            }
        }
        return false;
    }

    private String escaparCSV(String valor) {
        if (valor == null) return "";

        if (valor.contains(",") || valor.contains("\"") || valor.contains("\n")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }

        return valor;
    }
}
