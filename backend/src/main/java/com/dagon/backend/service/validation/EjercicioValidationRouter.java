package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class EjercicioValidationRouter {

    private final List<ValidadorEjercicio> validadores;
    private final SqlExerciseGuard sqlExerciseGuard;
    private final ObjectMapper mapper = new ObjectMapper();

    public EjercicioValidationRouter(List<ValidadorEjercicio> validadores) {
        this(validadores, new SqlExerciseGuard());
    }

    @Autowired
    public EjercicioValidationRouter(List<ValidadorEjercicio> validadores, SqlExerciseGuard sqlExerciseGuard) {
        this.validadores = validadores;
        this.sqlExerciseGuard = sqlExerciseGuard;
    }

    public TipoValidacionEjercicio resolverTipo(EjercicioPractico ejercicio, String queryUsuario) {
        if ("diagram".equalsIgnoreCase(ejercicio.getFormato())) {
            return TipoValidacionEjercicio.DIAGRAMA;
        }
        if (tieneTipoValidacion(ejercicio, "TEXTUAL")) {
            return TipoValidacionEjercicio.TEXTUAL;
        }
        // Materias no SQL (IO): se valida contra respuestas de configuracion_extra, sin query_maestra.
        if (tieneTipoValidacion(ejercicio, "NUMERICO")) {
            return TipoValidacionEjercicio.NUMERICO;
        }
        if (esTransaccional(ejercicio)) {
            return TipoValidacionEjercicio.TRANSACCION;
        }

        TipoValidacionEjercicio tipoMaestro = resolverTipoPorSql(ejercicio.getQueryMaestra());
        if ("RAPIDA".equalsIgnoreCase(ejercicio.getTipoMision()) && tipoMaestro == TipoValidacionEjercicio.SELECT) {
            return TipoValidacionEjercicio.PRACTICA_RAPIDA;
        }
        return tipoMaestro;
    }

    private TipoValidacionEjercicio resolverTipoPorSql(String sql) {
        String upper = sql == null ? "" : sql.trim().toUpperCase(Locale.ROOT);
        if (upper.matches("^\\s*BEGIN\\b[\\s\\S]*")
                || upper.matches("[\\s\\S]*\\b(COMMIT|ROLLBACK|SAVEPOINT)\\b[\\s\\S]*")) {
            return TipoValidacionEjercicio.TRANSACCION;
        }
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
        Optional<Map<String, Object>> errorBase = validadores.stream()
                .filter(validador -> validador.soporta(tipo))
                .findFirst()
                .flatMap(validador -> validador.prevalidar(contexto));
        if (errorBase.isPresent()) {
            return errorBase;
        }
        return sqlExerciseGuard.prevalidar(contexto);
    }

    private boolean tieneTipoValidacion(EjercicioPractico ejercicio, String tipo) {
        String configExtra = ejercicio.getConfiguracionExtra();
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return false;
        }
        try {
            JsonNode config = mapper.readTree(configExtra);
            return config.has("tipo_validacion") && tipo.equalsIgnoreCase(config.get("tipo_validacion").asText());
        } catch (Exception e) {
            return configExtra.contains("\"tipo_validacion\":\"" + tipo + "\"");
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
