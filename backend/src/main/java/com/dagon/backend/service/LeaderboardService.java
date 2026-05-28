package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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

    public List<Map<String, Object>> obtenerRankingGlobal() {
        // ¡Mira qué limpio! Java solo llama a tu vista de PostgreSQL
        String sql = "SELECT id_usuario, nombre, xp_total, ejercicios_resueltos FROM lms_core.v_ranking_alumnos";

        List<Map<String, Object>> filas = jdbcTemplate.queryForList(sql);
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
}
