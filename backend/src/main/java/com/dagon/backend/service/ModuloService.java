package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ModuloService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> obtenerModulosConEstado(String identificadorUsuario) {

        // 1. Obtenemos la XP del usuario
        String sqlXp = "SELECT xp_total FROM lms_core.v_ranking_alumnos WHERE email = ? OR id_usuario::varchar = ?";
        Integer xpUsuario = 0;
        try {
            Number xpNumber = jdbcTemplate.queryForObject(sqlXp, Number.class, identificadorUsuario, identificadorUsuario);
            xpUsuario = (xpNumber != null) ? xpNumber.intValue() : 0;
        } catch (Exception e) {
            xpUsuario = 0;
        }

        // 2. Traemos todos los Cursos activos
        String sqlCursos = "SELECT id_curso, titulo FROM lms_core.cursos ORDER BY id_curso ASC";
        List<Map<String, Object>> cursos = jdbcTemplate.queryForList(sqlCursos);

        // 3. Traemos todos los Módulos
        String sqlModulos = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida " +
                "FROM lms_core.modulos ORDER BY orden ASC";
        List<Map<String, Object>> todosLosModulos = jdbcTemplate.queryForList(sqlModulos);

        // 4. Anidamos los módulos dentro de su respectivo curso evaluando candados
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
}