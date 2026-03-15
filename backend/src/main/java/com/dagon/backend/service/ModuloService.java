package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class ModuloService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> obtenerModulosConEstado(String identificadorUsuario) {

        // ¡Usamos la vista! Buscamos por email o por UUID (el que venga en el token)
        String sqlXp = "SELECT xp_total FROM lms_core.v_ranking_alumnos WHERE email = ? OR id_usuario::varchar = ?";

        Integer xpUsuario = 0;
        try {
            Number xpNumber = jdbcTemplate.queryForObject(sqlXp, Number.class, identificadorUsuario, identificadorUsuario);
            xpUsuario = (xpNumber != null) ? xpNumber.intValue() : 0;
        } catch (Exception e) {
            // Si el usuario no existe en la vista (raro, pero posible si lo acaban de crear y no es activo), tiene 0 XP
            xpUsuario = 0;
        }

        // Traemos todos los módulos
        String sqlModulos = "SELECT id_modulo, titulo, descripcion, orden, xp_requerida " +
                "FROM lms_core.modulos ORDER BY orden ASC";

        List<Map<String, Object>> modulos = jdbcTemplate.queryForList(sqlModulos);
        List<Map<String, Object>> resultado = new ArrayList<>();

        // Evaluamos los candados
        for (Map<String, Object> mod : modulos) {
            Map<String, Object> moduloConEstado = new HashMap<>(mod);
            Integer xpReq = (Integer) mod.get("xp_requerida");

            boolean bloqueado = xpUsuario < (xpReq != null ? xpReq : 0);
            moduloConEstado.put("bloqueado", bloqueado);

            resultado.add(moduloConEstado);
        }

        return resultado;
    }
}