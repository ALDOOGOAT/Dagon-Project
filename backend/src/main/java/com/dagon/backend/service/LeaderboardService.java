package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
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
}