package com.dagon.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SandboxDataSourceConfig {

    @Bean(name = "sandboxDataSource", destroyMethod = "close")
    public DataSource sandboxDataSource(
            @Value("${dagon.sandbox.url}") String url,
            @Value("${dagon.sandbox.username}") String username,
            @Value("${dagon.sandbox.password}") String password,
            @Value("${dagon.sandbox.pool.maximum-size:4}") int maximumPoolSize,
            @Value("${dagon.sandbox.pool.initialization-fail-timeout-ms:1}") long initializationFailTimeout
    ) {
        HikariConfig config = new HikariConfig();
        config.setPoolName("DagonSandboxPool");
        config.setJdbcUrl(normalizarJdbcUrl("DAGON_SANDBOX_URL", url));
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(Math.max(1, maximumPoolSize));
        config.setMinimumIdle(0);
        config.setConnectionTimeout(5_000);
        config.setIdleTimeout(60_000);
        config.setMaxLifetime(300_000);
        config.setLeakDetectionThreshold(15_000);
        config.setInitializationFailTimeout(initializationFailTimeout);
        config.setAutoCommit(true);
        return new HikariDataSource(config);
    }

    private String normalizarJdbcUrl(String propertyName, String url) {
        if (url == null) {
            return null;
        }
        String limpia = url.trim();
        if (limpia.contains("host:puerto/base") || limpia.contains(":puerto/")) {
            throw new IllegalStateException(propertyName + " sigue usando el valor de ejemplo. Reemplazalo en backend/.env con la URL real de PostgreSQL.");
        }
        if (limpia.startsWith("postgresql://")) {
            return "jdbc:" + limpia;
        }
        if (limpia.startsWith("postgres://")) {
            return "jdbc:postgresql://" + limpia.substring("postgres://".length());
        }
        return limpia;
    }
}
