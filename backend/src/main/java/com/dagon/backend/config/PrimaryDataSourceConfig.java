package com.dagon.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class PrimaryDataSourceConfig {

    @Bean(name = "dataSource", destroyMethod = "close")
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${spring.datasource.hikari.maximum-pool-size:8}") int maximumPoolSize,
            @Value("${spring.datasource.hikari.minimum-idle:1}") int minimumIdle,
            @Value("${spring.datasource.hikari.connection-timeout:5000}") long connectionTimeout,
            @Value("${spring.datasource.hikari.idle-timeout:120000}") long idleTimeout,
            @Value("${spring.datasource.hikari.max-lifetime:300000}") long maxLifetime,
            @Value("${spring.datasource.hikari.leak-detection-threshold:20000}") long leakDetectionThreshold,
            @Value("${spring.datasource.hikari.initialization-fail-timeout:1}") long initializationFailTimeout
    ) {
        HikariConfig config = new HikariConfig();
        config.setPoolName("DagonMainPool");
        config.setJdbcUrl(normalizarJdbcUrl("SPRING_DATASOURCE_URL", url));
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(Math.max(1, maximumPoolSize));
        config.setMinimumIdle(Math.max(0, minimumIdle));
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setLeakDetectionThreshold(leakDetectionThreshold);
        config.setInitializationFailTimeout(initializationFailTimeout);
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
