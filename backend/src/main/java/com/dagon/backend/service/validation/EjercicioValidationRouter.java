package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class EjercicioValidationRouter {

    private final List<ValidadorEjercicio> validadores;
    private final ObjectMapper mapper = new ObjectMapper();

    public EjercicioValidationRouter(List<ValidadorEjercicio> validadores) {
        this.validadores = validadores;
    }

    public TipoValidacionEjercicio resolverTipo(EjercicioPractico ejercicio, String queryUsuario) {
        if ("diagram".equalsIgnoreCase(ejercicio.getFormato())) {
            return TipoValidacionEjercicio.DIAGRAMA;
        }
        if ("RAPIDA".equalsIgnoreCase(ejercicio.getTipoMision())) {
            return TipoValidacionEjercicio.PRACTICA_RAPIDA;
        }
        if (esTextual(ejercicio)) {
            return TipoValidacionEjercicio.TEXTUAL;
        }
        if (esTransaccional(ejercicio)) {
            return TipoValidacionEjercicio.TRANSACCION;
        }

        String upper = queryUsuario == null ? "" : queryUsuario.trim().toUpperCase(Locale.ROOT);
        if (upper.matches("^\\s*(INSERT|UPDATE|DELETE)\\b[\\s\\S]*")) {
            return TipoValidacionEjercicio.DML;
        }
        if (upper.matches("^\\s*(CREATE|ALTER|DROP)\\b[\\s\\S]*")) {
            return TipoValidacionEjercicio.DDL;
        }
        return TipoValidacionEjercicio.SELECT;
    }

    public Optional<Map<String, Object>> prevalidar(EjercicioPractico ejercicio, String queryUsuario, String usuarioId) {
        TipoValidacionEjercicio tipo = resolverTipo(ejercicio, queryUsuario);
        ContextoValidacionEjercicio contexto = new ContextoValidacionEjercicio(ejercicio, queryUsuario, usuarioId, tipo);
        return validadores.stream()
                .filter(validador -> validador.soporta(tipo))
                .findFirst()
                .flatMap(validador -> validador.prevalidar(contexto));
    }

    private boolean esTextual(EjercicioPractico ejercicio) {
        String configExtra = ejercicio.getConfiguracionExtra();
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return false;
        }
        try {
            JsonNode config = mapper.readTree(configExtra);
            return config.has("tipo_validacion") && "TEXTUAL".equalsIgnoreCase(config.get("tipo_validacion").asText());
        } catch (Exception e) {
            return configExtra.contains("\"tipo_validacion\":\"TEXTUAL\"");
        }
    }

    private boolean esTransaccional(EjercicioPractico ejercicio) {
        if (Integer.valueOf(15).equals(ejercicio.getIdModulo())) {
            return true;
        }

        String configExtra = ejercicio.getConfiguracionExtra();
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return false;
        }

        try {
            JsonNode config = mapper.readTree(configExtra);
            if (config.has("tipo_validacion") && "transaccion".equalsIgnoreCase(config.get("tipo_validacion").asText())) {
                return true;
            }
            return config.has("modo") && "terminal_transaccional".equalsIgnoreCase(config.get("modo").asText());
        } catch (Exception e) {
            return false;
        }
    }
}
