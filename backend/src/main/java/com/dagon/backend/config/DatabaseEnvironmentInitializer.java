package com.dagon.backend.config;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DatabaseEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String PROPERTY_SOURCE_NAME = "dagonDatabaseEnvironment";

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        DatabaseSettings mainDatabase = resolveMainDatabase(environment);
        DatabaseSettings sandboxDatabase = resolveSandboxDatabase(environment);

        Map<String, Object> properties = new HashMap<>();
        putIfPresent(properties, "spring.datasource.url", mainDatabase.url());
        putIfPresent(properties, "spring.datasource.username", mainDatabase.username());
        putIfPresent(properties, "spring.datasource.password", mainDatabase.password());
        putIfPresent(properties, "dagon.sandbox.url", sandboxDatabase.url());
        putIfPresent(properties, "dagon.sandbox.username", sandboxDatabase.username());
        putIfPresent(properties, "dagon.sandbox.password", sandboxDatabase.password());

        if (!properties.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private DatabaseSettings resolveMainDatabase(ConfigurableEnvironment environment) {
        DatabaseSettings fromUrl = parseDatabaseUrl(firstNonBlank(
            environment,
            "SPRING_DATASOURCE_URL",
            "DATABASE_PUBLIC_URL",
            "DATABASE_URL",
            "POSTGRES_URL"
        ));

        DatabaseSettings fromParts = fromParts(
            firstNonBlank(environment, "PGHOST", "POSTGRES_HOST", "DATABASE_HOST"),
            firstNonBlank(environment, "PGPORT", "POSTGRES_PORT", "DATABASE_PORT"),
            firstNonBlank(environment, "PGDATABASE", "POSTGRES_DB", "POSTGRES_DATABASE", "DATABASE_NAME"),
            firstNonBlank(environment, "PGUSER", "POSTGRES_USER", "DATABASE_USERNAME"),
            firstNonBlank(environment, "PGPASSWORD", "POSTGRES_PASSWORD", "DATABASE_PASSWORD")
        );

        return fromUrl
            .merge(fromParts)
            .withUsername(firstNonBlank(environment, "SPRING_DATASOURCE_USERNAME", "PGUSER", "POSTGRES_USER", "DATABASE_USERNAME"))
            .withPassword(firstNonBlank(environment, "SPRING_DATASOURCE_PASSWORD", "PGPASSWORD", "POSTGRES_PASSWORD", "DATABASE_PASSWORD"));
    }

    private DatabaseSettings resolveSandboxDatabase(ConfigurableEnvironment environment) {
        DatabaseSettings fromUrl = parseDatabaseUrl(firstNonBlank(
            environment,
            "DAGON_SANDBOX_URL",
            "SANDBOX_DATABASE_URL"
        ));

        return fromUrl
            .withUsername(firstNonBlank(environment, "DAGON_SANDBOX_USERNAME", "SANDBOX_DATABASE_USERNAME"))
            .withPassword(firstNonBlank(environment, "DAGON_SANDBOX_PASSWORD", "SANDBOX_DATABASE_PASSWORD"));
    }

    private DatabaseSettings fromParts(String host, String port, String database, String username, String password) {
        if (isBlank(host) || isBlank(database)) {
            return DatabaseSettings.empty();
        }

        String safePort = isBlank(port) ? "5432" : port.trim();
        String url = "jdbc:postgresql://" + host.trim() + ":" + safePort + "/" + database.trim();
        return new DatabaseSettings(url, emptyToNull(username), emptyToNull(password));
    }

    private DatabaseSettings parseDatabaseUrl(String rawUrl) {
        if (isBlank(rawUrl)) {
            return DatabaseSettings.empty();
        }

        String normalizedUrl = rawUrl.trim();
        if (normalizedUrl.startsWith("jdbc:postgresql://")) {
            return new DatabaseSettings(normalizedUrl, null, null);
        }

        if (!normalizedUrl.startsWith("postgres://") && !normalizedUrl.startsWith("postgresql://")) {
            return DatabaseSettings.empty();
        }

        try {
            URI uri = URI.create(normalizedUrl);
            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;

            if (!isBlank(userInfo)) {
                String[] credentials = userInfo.split(":", 2);
                username = decode(credentials[0]);
                if (credentials.length > 1) {
                    password = decode(credentials[1]);
                }
            }

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost())
                .append(uri.getPort() > 0 ? ":" + uri.getPort() : "")
                .append(uri.getPath());

            if (!isBlank(uri.getQuery())) {
                jdbcUrl.append("?").append(uri.getQuery());
            }

            return new DatabaseSettings(jdbcUrl.toString(), username, password);
        } catch (IllegalArgumentException error) {
            return DatabaseSettings.empty();
        }
    }

    private String firstNonBlank(ConfigurableEnvironment environment, String... names) {
        for (String name : names) {
            String value = environment.getProperty(name);
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private void putIfPresent(Map<String, Object> properties, String key, String value) {
        if (!isBlank(value)) {
            properties.put(key, value);
        }
    }

    private String decode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException error) {
            return value;
        }
    }

    private String emptyToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record DatabaseSettings(String url, String username, String password) {
        static DatabaseSettings empty() {
            return new DatabaseSettings(null, null, null);
        }

        DatabaseSettings merge(DatabaseSettings next) {
            if (next == null) {
                return this;
            }
            return new DatabaseSettings(
                next.url != null ? next.url : this.url,
                next.username != null ? next.username : this.username,
                next.password != null ? next.password : this.password
            );
        }

        DatabaseSettings withUsername(String nextUsername) {
            return new DatabaseSettings(url, nextUsername != null ? nextUsername : username, password);
        }

        DatabaseSettings withPassword(String nextPassword) {
            return new DatabaseSettings(url, username, nextPassword != null ? nextPassword : password);
        }
    }
}
