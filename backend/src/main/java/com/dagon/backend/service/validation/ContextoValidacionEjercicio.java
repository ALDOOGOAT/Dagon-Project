package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;

public record ContextoValidacionEjercicio(
        EjercicioPractico ejercicio,
        String queryUsuario,
        String usuarioId,
        TipoValidacionEjercicio tipo
) {
}
