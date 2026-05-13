package com.dagon.backend.service.validation;

import java.util.Map;
import java.util.Optional;

abstract class ValidadorSqlBase implements ValidadorEjercicio {

    @Override
    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        String query = contexto.queryUsuario();
        if (query == null || query.trim().isEmpty()) {
            return Optional.of(RespuestasValidacion.error(
                    "Escribe una consulta antes de validar.",
                    contexto.ejercicio(),
                    query,
                    "La consulta enviada está vacía."
            ));
        }

        String queryClean = query.replaceAll("(?m)^--.*", "").trim().toLowerCase();
        if ((queryClean.contains("lms_core") || queryClean.contains("information_schema") || queryClean.contains("pg_catalog"))
                && !queryClean.startsWith("select")) {
            return Optional.of(RespuestasValidacion.error(
                    "🛡️ ¡Interferencia Detectada! No tienes permiso para modificar el núcleo de Dagon.",
                    contexto.ejercicio(),
                    query,
                    "El alumno intentó acceder a esquemas internos del sistema."
            ));
        }

        if (!query.trim().endsWith(";")) {
            return Optional.of(RespuestasValidacion.error(
                    "¡Error de Sintaxis! Te faltó cerrar la instrucción con el punto y coma (;) al final.",
                    contexto.ejercicio(),
                    query,
                    "Falta el punto y coma (;) al final de la instrucción SQL."
            ));
        }

        return Optional.empty();
    }
}
