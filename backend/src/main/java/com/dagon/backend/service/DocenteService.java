package com.dagon.backend.service;

import com.dagon.backend.dto.DocenteDTO.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocenteService {

    private static final Logger logger = LoggerFactory.getLogger(DocenteService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<AlumnoProgresoDTO> obtenerProgresoAlumnos(LocalDate desde, LocalDate hasta,
                                                          Integer idModulo, Integer idCurso) {
        StringBuilder sql = new StringBuilder(
                "SELECT u.id_usuario, u.nombre, u.email, u.racha_actual, u.fecha_registro, " +
                "COALESCE(r.xp_total, 0) AS xp, " +
                "COALESCE(r.ejercicios_resueltos, 0) AS ejercicios_completados, " +
                "COALESCE(intentos.total, 0) AS total_intentos " +
                "FROM lms_core.usuarios u " +
                "LEFT JOIN lms_core.v_ranking_alumnos r ON u.id_usuario = r.id_usuario " +
                "LEFT JOIN (" +
                "  SELECT id_usuario, COUNT(*) AS total FROM lms_core.intentos ");

        List<Object> params = new ArrayList<>();
        List<String> filtrosIntentos = new ArrayList<>();

        if (desde != null) {
            filtrosIntentos.add("fecha_intento >= ?::timestamp");
            params.add(desde.toString() + " 00:00:00");
        }
        if (hasta != null) {
            filtrosIntentos.add("fecha_intento <= ?::timestamp");
            params.add(hasta.toString() + " 23:59:59");
        }
        if (idModulo != null) {
            filtrosIntentos.add("id_ejercicio IN (SELECT id_ejercicio FROM lms_core.ejercicios_practicos WHERE id_modulo = ?)");
            params.add(idModulo);
        }
        if (idCurso != null) {
            filtrosIntentos.add("id_ejercicio IN (SELECT ep.id_ejercicio FROM lms_core.ejercicios_practicos ep " +
                    "JOIN lms_core.modulos m ON ep.id_modulo = m.id_modulo WHERE m.id_curso = ?)");
            params.add(idCurso);
        }

        if (!filtrosIntentos.isEmpty()) {
            sql.append("WHERE ").append(String.join(" AND ", filtrosIntentos)).append(" ");
        }

        sql.append("  GROUP BY id_usuario) intentos ON u.id_usuario = intentos.id_usuario ");
        sql.append("WHERE u.activo = true ORDER BY xp DESC");

        return jdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) ->
                new AlumnoProgresoDTO(
                        UUID.fromString(rs.getString("id_usuario")),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getInt("xp"),
                        rs.getInt("ejercicios_completados"),
                        rs.getInt("total_intentos"),
                        rs.getInt("racha_actual"),
                        rs.getTimestamp("fecha_registro") != null
                                ? rs.getTimestamp("fecha_registro").toLocalDateTime() : null
                ));
    }

    public List<EjercicioFalladoDTO> obtenerEjerciciosFallados(Integer idModulo, Integer idCurso,
                                                                LocalDate desde, LocalDate hasta) {
        List<Object> params = new ArrayList<>();
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

        String where = filtros.isEmpty() ? "" : "WHERE " + String.join(" AND ", filtros) + " ";

        String sql = "SELECT ep.id_ejercicio, ep.titulo, m.titulo AS modulo, " +
                "COUNT(*) AS intentos_totales, " +
                "SUM(CASE WHEN i.es_correcto = false THEN 1 ELSE 0 END) AS intentos_fallidos, " +
                "ROUND(SUM(CASE WHEN i.es_correcto = false THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS tasa_error " +
                "FROM lms_core.intentos i " +
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

    public List<ModuloAbandonoDTO> obtenerAbandonoModulos(Integer idCurso) {
        List<Object> params = new ArrayList<>();
        String filtro = "";
        if (idCurso != null) {
            filtro = "WHERE m.id_curso = ? ";
            params.add(idCurso);
        }

        String sql = "SELECT m.id_modulo, m.titulo, " +
                "COUNT(DISTINCT i.id_usuario) AS alumnos_que_iniciaron, " +
                "COUNT(DISTINCT CASE WHEN i.es_correcto = true THEN i.id_usuario END) AS alumnos_que_completaron, " +
                "ROUND((1 - COUNT(DISTINCT CASE WHEN i.es_correcto = true THEN i.id_usuario END)::numeric / " +
                "NULLIF(COUNT(DISTINCT i.id_usuario), 0)) * 100, 1) AS tasa_abandono " +
                "FROM lms_core.modulos m " +
                "JOIN lms_core.ejercicios_practicos ep ON m.id_modulo = ep.id_modulo " +
                "LEFT JOIN lms_core.intentos i ON ep.id_ejercicio = i.id_ejercicio " +
                filtro +
                "GROUP BY m.id_modulo, m.titulo, m.orden " +
                "ORDER BY m.orden";

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) ->
                new ModuloAbandonoDTO(
                        rs.getInt("id_modulo"),
                        rs.getString("titulo"),
                        rs.getInt("alumnos_que_iniciaron"),
                        rs.getInt("alumnos_que_completaron"),
                        rs.getDouble("tasa_abandono")
                ));
    }

    public List<TiempoModuloDTO> obtenerTiempoPromedioPorModulo(Integer idCurso) {
        List<Object> params = new ArrayList<>();
        String filtro = "";
        if (idCurso != null) {
            filtro = "WHERE m.id_curso = ? ";
            params.add(idCurso);
        }

        String sql = "SELECT m.id_modulo, m.titulo, " +
                "ROUND(AVG(i.tiempo_ms)::numeric, 2) AS tiempo_promedio_ms, " +
                "COUNT(*) AS intentos_totales " +
                "FROM lms_core.modulos m " +
                "JOIN lms_core.ejercicios_practicos ep ON m.id_modulo = ep.id_modulo " +
                "JOIN lms_core.intentos i ON ep.id_ejercicio = i.id_ejercicio " +
                filtro +
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

    public List<IntentoDetalleDTO> obtenerIntentosAlumno(String alumnoId, Integer idModulo,
                                                          LocalDate desde, LocalDate hasta) {
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

    public Map<String, Object> obtenerResumen(LocalDate desde, LocalDate hasta,
                                               Integer idModulo, Integer idCurso) {
        Map<String, Object> resumen = new LinkedHashMap<>();

        resumen.put("alumnos", obtenerProgresoAlumnos(desde, hasta, idModulo, idCurso));
        resumen.put("ejercicios_fallados", obtenerEjerciciosFallados(idModulo, idCurso, desde, hasta));
        resumen.put("abandono_modulos", obtenerAbandonoModulos(idCurso));
        resumen.put("tiempo_promedio", obtenerTiempoPromedioPorModulo(idCurso));

        // Metricas globales rapidas
        try {
            int totalAlumnos = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.usuarios WHERE activo = true", Integer.class);
            int totalIntentos = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.intentos", Integer.class);
            int intentosCorrectos = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.intentos WHERE es_correcto = true", Integer.class);
            double tasaAciertoGlobal = totalIntentos > 0
                    ? Math.round(intentosCorrectos * 1000.0 / totalIntentos) / 10.0 : 0;

            resumen.put("total_alumnos", totalAlumnos);
            resumen.put("total_intentos", totalIntentos);
            resumen.put("intentos_correctos", intentosCorrectos);
            resumen.put("tasa_acierto_global", tasaAciertoGlobal);
        } catch (Exception e) {
            logger.warn("Error calculando metricas globales: {}", e.getMessage());
        }

        // Cursos disponibles para filtros del frontend
        resumen.put("cursos", jdbcTemplate.queryForList(
                "SELECT id_curso, titulo FROM lms_core.cursos ORDER BY id_curso"));
        resumen.put("modulos", jdbcTemplate.queryForList(
                "SELECT id_modulo, titulo, id_curso FROM lms_core.modulos ORDER BY orden"));

        return resumen;
    }

    public String exportarCSV(LocalDate desde, LocalDate hasta, Integer idModulo, Integer idCurso) {
        List<AlumnoProgresoDTO> alumnos = obtenerProgresoAlumnos(desde, hasta, idModulo, idCurso);

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

    private String escaparCSV(String valor) {
        if (valor == null) return "";
        if (valor.contains(",") || valor.contains("\"") || valor.contains("\n")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }
        return valor;
    }
}
