package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;

import java.util.HashMap;
import java.util.Map;

final class RespuestasValidacion {

    private RespuestasValidacion() {
    }

    static Map<String, Object> error(String message, EjercicioPractico ejercicio, String queryUsuario, String errorDb) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("success", false);
        respuesta.put("message", message);
        respuesta.put("xp_gained", 0);
        if (ejercicio != null) {
            respuesta.put("descripcion", ejercicio.getEnunciado());
        }
        respuesta.put("queryAlumno", queryUsuario);
        respuesta.put("errorDb", errorDb);
        return respuesta;
    }
}
