package com.dagon.backend.service.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class ValidadorDiagrama implements ValidadorEjercicio {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public boolean soporta(TipoValidacionEjercicio tipo) {
        return tipo == TipoValidacionEjercicio.DIAGRAMA;
    }

    @Override
    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        try {
            JsonNode root = mapper.readTree(contexto.queryUsuario());
            JsonNode nodes = root.get("nodes");
            JsonNode edges = root.get("edges");
            if ((nodes != null && !nodes.isArray()) || (edges != null && !edges.isArray())) {
                return Optional.of(RespuestasValidacion.error(
                        "El diagrama no tiene una estructura válida.",
                        contexto.ejercicio(),
                        contexto.queryUsuario(),
                        "Los campos nodes y edges deben ser arreglos."
                ));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.of(RespuestasValidacion.error(
                    "El diagrama no se pudo leer. Revisa que la estructura visual sea válida.",
                    contexto.ejercicio(),
                    contexto.queryUsuario(),
                    "JSON de diagrama inválido: " + e.getMessage()
            ));
        }
    }
}
