package com.dagon.backend.service.validation;

import java.util.Map;
import java.util.Optional;

public interface ValidadorEjercicio {

    boolean soporta(TipoValidacionEjercicio tipo);

    Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto);
}
