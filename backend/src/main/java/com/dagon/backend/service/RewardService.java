package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Registra los intentos de un alumno (correctos o no) en lms_core.intentos, con sus
 * métricas competitivas (tiempo, costo de ejecución, longitud). Esa fila es lo que
 * alimenta el XP y el racha del alumno (vía las vistas/consultas de lms_core) y el
 * ranking de eficiencia/SQL Golf. Extraído de EjercicioService para separar
 * "cómo se valida un ejercicio" de "cómo se deja constancia del intento".
 */
@Service
public class RewardService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Boolean columnasCompetitivasIntentosDisponibles;

    // Un acierto cambia XP y ejercicios resueltos, asi que el ranking cacheado deja de ser
    // valido: se invalida aqui, que es el unico embudo por el que pasan todos los intentos.
    @CacheEvict(value = "leaderboard", allEntries = true, condition = "#esCorrecto")
    public void registrarIntento(
            String usuarioId,
            Integer ejercicioId,
            String queryUsuario,
            boolean esCorrecto,
            Double tiempoMs,
            Double costoEjecucion
    ) {
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            return;
        }

        Integer longitudCaracteres = calcularLongitudSql(queryUsuario);
        Double tiempoSeguro = tiempoMs != null ? tiempoMs : 0.0;

        if (soportaColumnasCompetitivasIntentos()) {
            try {
                String insertSql = "INSERT INTO lms_core.intentos " +
                        "(id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms, costo_ejecucion, longitud_caracteres) " +
                        "VALUES (?::uuid, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(insertSql, usuarioId, ejercicioId, queryUsuario, esCorrecto,
                        tiempoSeguro, costoEjecucion, longitudCaracteres);
                return;
            } catch (Exception ignored) {
                columnasCompetitivasIntentosDisponibles = false;
            }
        }

        String insertSql = "INSERT INTO lms_core.intentos " +
                "(id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms) " +
                "VALUES (?::uuid, ?, ?, ?, ?)";
        jdbcTemplate.update(insertSql, usuarioId, ejercicioId, queryUsuario, esCorrecto, tiempoSeguro);
    }

    public int contarAciertosRapidosHoy(String usuarioId) {
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            return 0;
        }

        try {
            String sql = "SELECT COUNT(*) " +
                    "FROM lms_core.intentos i " +
                    "JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "WHERE i.id_usuario = ?::uuid " +
                    "AND i.es_correcto = true " +
                    "AND e.tipo_mision = 'RAPIDA' " +
                    "AND DATE(i.fecha_intento) = CURRENT_DATE";
            Integer total = jdbcTemplate.queryForObject(sql, Integer.class, usuarioId);
            return total != null ? total : 0;
        } catch (Exception ignored) {
            return 0;
        }
    }

    public Double calcularTiempoMs(long inicioNanos) {
        double ms = (System.nanoTime() - inicioNanos) / 1_000_000.0;
        return Math.round(ms * 100.0) / 100.0;
    }

    private boolean soportaColumnasCompetitivasIntentos() {
        if (columnasCompetitivasIntentosDisponibles != null) {
            return columnasCompetitivasIntentosDisponibles;
        }

        try {
            String sql = "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_schema = 'lms_core' " +
                    "AND table_name = 'intentos' " +
                    "AND column_name IN ('costo_ejecucion', 'longitud_caracteres')";
            Integer total = jdbcTemplate.queryForObject(sql, Integer.class);
            columnasCompetitivasIntentosDisponibles = total != null && total >= 2;
        } catch (Exception e) {
            columnasCompetitivasIntentosDisponibles = false;
        }

        return columnasCompetitivasIntentosDisponibles;
    }

    private Integer calcularLongitudSql(String queryUsuario) {
        return queryUsuario != null ? queryUsuario.trim().length() : 0;
    }
}
