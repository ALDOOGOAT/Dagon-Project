package com.dagon.backend.service.validation;

import org.springframework.stereotype.Component;

@Component
public class ValidadorDdl extends ValidadorSqlBase {

    @Override
    public boolean soporta(TipoValidacionEjercicio tipo) {
        return tipo == TipoValidacionEjercicio.DDL;
    }
}
