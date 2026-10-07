package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LeaderboardService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Protege a Postgres de lecturas repetidas del ranking. materia null/vacia = ranking global;
    // con slug ('sql', 'io') solo cuenta la XP de esa materia. Ojo: NO agregues una sobrecarga
    // que llame a este metodo desde dentro de la clase; esa auto-invocacion se salta el proxy de
    // Spring y el cache deja de aplicarse. Llama siempre obtenerRankingGlobal(0, null).
    @Cacheable(value = "leaderboard", key = "#limite + ':' + (#materia ?: '')")
    public List<Map<String, Object>> obtenerRankingGlobal(int limite, String materia) {
        boolean porMateria = materia != null && !materia.isBlank();
        // ¡Mira qué limpio! Java solo llama a tu vista de PostgreSQL
        String sql = porMateria
                ? "SELECT x.id_usuario, u.nombre, x.xp AS xp_total, x.ejercicios_resueltos " +
                        "FROM lms_core.v_xp_por_materia x " +
                        "JOIN lms_core.usuarios u ON u.id_usuario = x.id_usuario " +
                        "WHERE x.materia_slug = ? " +
                        "ORDER BY x.xp DESC, x.ejercicios_resueltos DESC, u.nombre ASC"
                : "SELECT id_usuario, nombre, xp_total, ejercicios_resueltos " +
                        "FROM lms_core.v_ranking_alumnos " +
                        "ORDER BY xp_total DESC, ejercicios_resueltos DESC, nombre ASC";
        List<Object> parametros = new ArrayList<>();
        if (porMateria) {
            parametros.add(materia);
        }
        if (limite > 0) {
            sql += " LIMIT ?";
            parametros.add(limite);
        }
        Object[] params = parametros.toArray();

        List<Map<String, Object>> filas = jdbcTemplate.queryForList(sql, params);
        List<Map<String, Object>> ranking = new ArrayList<>();

        int posicion = 1;
        for (Map<String, Object> fila : filas) {
            Map<String, Object> usuarioRank = new HashMap<>();
            usuarioRank.put("rango", posicion);
            usuarioRank.put("idUsuario", fila.get("id_usuario").toString());
            usuarioRank.put("nombre", fila.get("nombre"));

            // Transformamos el dato numérico de Postgres a Integer seguro
            Number xpNum = (Number) fila.get("xp_total");
            usuarioRank.put("xp", xpNum != null ? xpNum.intValue() : 0);

            Number ejerciciosNum = (Number) fila.get("ejercicios_resueltos");
            usuarioRank.put("misionesResueltas", ejerciciosNum != null ? ejerciciosNum.intValue() : 0);

            ranking.add(usuarioRank);
            posicion++;
        }

        return ranking;
    }

    public Map<String, Object> obtenerRankingEjercicio(Integer ejercicioId) {
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("ejercicioId", ejercicioId);
        respuesta.put("eficiencia", obtenerRankingEjercicioPorCategoria(ejercicioId, "eficiencia", 10));
        respuesta.put("golf", obtenerRankingEjercicioPorCategoria(ejercicioId, "golf", 10));
        return respuesta;
    }

    public List<Map<String, Object>> obtenerRankingEjercicioPorCategoria(Integer ejercicioId, String categoria, int limite) {
        if (ejercicioId == null) {
            return List.of();
        }

        int limiteSeguro = Math.max(3, Math.min(limite, 25));
        boolean sqlGolf = "golf".equalsIgnoreCase(categoria);
        String ordenMejorIntento = sqlGolf
                ? "i.longitud_caracteres ASC NULLS LAST, i.costo_ejecucion ASC NULLS LAST, i.tiempo_ms ASC NULLS LAST, i.fecha_intento ASC"
                : "CASE WHEN i.costo_ejecucion IS NULL THEN 1 ELSE 0 END, i.costo_ejecucion ASC NULLS LAST, i.tiempo_ms ASC NULLS LAST, i.longitud_caracteres ASC NULLS LAST, i.fecha_intento ASC";
        String ordenFinal = sqlGolf
                ? "longitud_caracteres ASC NULLS LAST, costo_ejecucion ASC NULLS LAST, tiempo_ms ASC NULLS LAST, fecha_intento ASC"
                : "CASE WHEN costo_ejecucion IS NULL THEN 1 ELSE 0 END, costo_ejecucion ASC NULLS LAST, tiempo_ms ASC NULLS LAST, longitud_caracteres ASC NULLS LAST, fecha_intento ASC";

        String sql = "WITH mejores AS ( " +
                "SELECT DISTINCT ON (i.id_usuario) " +
                "i.id_usuario, u.nombre, i.costo_ejecucion, i.tiempo_ms, i.longitud_caracteres, i.fecha_intento " +
                "FROM lms_core.intentos i " +
                "JOIN lms_core.usuarios u ON u.id_usuario = i.id_usuario " +
                "WHERE i.id_ejercicio = ? AND i.es_correcto = true " +
                "ORDER BY i.id_usuario, " + ordenMejorIntento +
                ") SELECT * FROM mejores ORDER BY " + ordenFinal + " LIMIT ?";

        try {
            List<Map<String, Object>> filas = jdbcTemplate.queryForList(sql, ejercicioId, limiteSeguro);
            List<Map<String, Object>> ranking = new ArrayList<>();
            int posicion = 1;

            for (Map<String, Object> fila : filas) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("rango", posicion++);
                item.put("idUsuario", fila.get("id_usuario") != null ? fila.get("id_usuario").toString() : null);
                item.put("nombre", fila.get("nombre"));
                item.put("costoEjecucion", obtenerDouble(fila.get("costo_ejecucion")));
                item.put("tiempoMs", obtenerDouble(fila.get("tiempo_ms")));
                item.put("longitudCaracteres", obtenerInteger(fila.get("longitud_caracteres")));
                item.put("fechaIntento", fila.get("fecha_intento") != null ? fila.get("fecha_intento").toString() : null);
                ranking.add(item);
            }

            return ranking;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private Double obtenerDouble(Object valor) {
        if (valor instanceof Number numero) {
            return numero.doubleValue();
        }
        return null;
    }

    private Integer obtenerInteger(Object valor) {
        if (valor instanceof Number numero) {
            return numero.intValue();
        }
        return null;
    }

    // Red de seguridad: el cache tambien se invalida al registrar un intento correcto
    // (RewardService.registrarIntento). Este barrido cubre cambios de XP hechos por otras
    // vias (docente, admin) que no pasan por ahi.
    @CacheEvict(value = "leaderboard", allEntries = true)
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void evictCacheLeaderboard() {
        // Sin cuerpo: la anotación @CacheEvict hace el trabajo.
    }
}
