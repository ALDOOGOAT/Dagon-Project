package com.dagon.backend.service.validation;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class ValidadorTextual implements ValidadorEjercicio {

    @Override
    public boolean soporta(TipoValidacionEjercicio tipo) {
        return tipo == TipoValidacionEjercicio.TEXTUAL;
    }

    @Override
    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        if (contexto.queryUsuario() == null || contexto.queryUsuario().trim().isEmpty()) {
            return Optional.of(RespuestasValidacion.error(
                    "Escribe una instrucción antes de validar.",
                    contexto.ejercicio(),
                    contexto.queryUsuario(),
                    "La instrucción textual está vacía."
            ));
        }
        return Optional.empty();
    }
}
