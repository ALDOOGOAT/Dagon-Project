package com.dagon.backend.service.clawbot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Cache de respuestas de Clawbot.
 *
 * Dos alumnos que cometen el mismo error en el mismo ejercicio reciben la misma explicacion,
 * asi que se paga a la IA una sola vez. La capa en memoria evita el viaje a la base y la capa
 * en base sobrevive a los redeploys de Railway, que es donde se perdia todo el ahorro.
 *
 * Si la tabla no existe (migracion no aplicada), la capa persistente se apaga sola y el
 * servicio sigue funcionando solo con memoria.
 */
@Component
public class ClawbotCacheService {

    private static final Logger logger = LoggerFactory.getLogger(ClawbotCacheService.class);
    private static final int MAX_ENTRADAS_MEMORIA = 500;
    private static final int DIAS_VIGENCIA = 30;

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, String> memoria = new ConcurrentHashMap<>();
    private final AtomicBoolean persistenciaActiva = new AtomicBoolean(true);

    public ClawbotCacheService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Clave estable: mismo tipo + mismas partes normalizadas = misma clave. */
    public String clave(String tipo, String... partes) {
        StringBuilder sb = new StringBuilder(tipo);
        for (String parte : partes) {
            sb.append('|').append(normalizar(parte));
        }
        return sha256(sb.toString());
    }

    public Optional<String> buscar(String clave) {
        String enMemoria = memoria.get(clave);
        if (enMemoria != null) {
            return Optional.of(enMemoria);
        }
        if (!persistenciaActiva.get()) {
            return Optional.empty();
        }
        try {
            String respuesta = jdbcTemplate.query(
                    "UPDATE lms_core.clawbot_cache SET aciertos = aciertos + 1, ultimo_uso = now() " +
                            "WHERE clave = ? AND creado_en > now() - interval '" + DIAS_VIGENCIA + " days' " +
                            "RETURNING respuesta",
                    rs -> rs.next() ? rs.getString(1) : null,
                    clave);
            if (respuesta != null) {
                memoria.put(clave, respuesta);
                return Optional.of(respuesta);
            }
        } catch (Exception e) {
            desactivarPersistencia(e);
        }
        return Optional.empty();
    }

    public void guardar(String clave, String respuesta, String fuente) {
        if (respuesta == null || respuesta.isBlank()) {
            return;
        }
        if (memoria.size() >= MAX_ENTRADAS_MEMORIA) {
            memoria.clear();
        }
        memoria.put(clave, respuesta);

        if (!persistenciaActiva.get()) {
            return;
        }
        try {
            jdbcTemplate.update(
                    "INSERT INTO lms_core.clawbot_cache (clave, respuesta, fuente) VALUES (?, ?, ?) " +
                            "ON CONFLICT (clave) DO UPDATE SET respuesta = EXCLUDED.respuesta, ultimo_uso = now()",
                    clave, respuesta, fuente);
        } catch (Exception e) {
            desactivarPersistencia(e);
        }
    }

    /** Purga automatica: sin esto la tabla crece para siempre con respuestas que ya nadie pide. */
    @Scheduled(cron = "0 15 4 * * *")
    public void purgarVencidas() {
        if (!persistenciaActiva.get()) {
            return;
        }
        try {
            int borradas = jdbcTemplate.update(
                    "DELETE FROM lms_core.clawbot_cache WHERE ultimo_uso < now() - interval '" + DIAS_VIGENCIA + " days'");
            if (borradas > 0) {
                logger.info("Clawbot cache: {} respuestas vencidas purgadas", borradas);
            }
        } catch (Exception e) {
            desactivarPersistencia(e);
        }
    }

    private void desactivarPersistencia(Exception e) {
        if (persistenciaActiva.compareAndSet(true, false)) {
            logger.warn("Clawbot cache: capa persistente desactivada ({}). Aplica la migracion " +
                    "scripts/migraciones/2026_08_28_clawbot_cache.sql para recuperarla.", e.getMessage());
        }
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private String sha256(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return Integer.toHexString(valor.hashCode());
        }
    }
}
