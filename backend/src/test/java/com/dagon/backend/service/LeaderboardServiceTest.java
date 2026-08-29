package com.dagon.backend.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeaderboardServiceTest {

    @Configuration
    @EnableCaching
    static class CacheTestConfig {
        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("leaderboard");
        }

        @Bean
        JdbcTemplate jdbcTemplate() {
            return mock(JdbcTemplate.class);
        }

        @Bean
        LeaderboardService leaderboardService() {
            return new LeaderboardService();
        }
    }

    private AnnotationConfigApplicationContext context;
    private JdbcTemplate jdbcTemplate;
    private LeaderboardService service;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigApplicationContext(CacheTestConfig.class);
        service = context.getBean(LeaderboardService.class);
        jdbcTemplate = context.getBean(JdbcTemplate.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void cacheaElRankingGlobalPorLimite() {
        String sql = "SELECT id_usuario, nombre, xp_total, ejercicios_resueltos " +
                "FROM lms_core.v_ranking_alumnos " +
                "ORDER BY xp_total DESC, ejercicios_resueltos DESC, nombre ASC";
        Map<String, Object> filaAna = Map.of("id_usuario", "u1", "nombre", "Ana", "xp_total", 10, "ejercicios_resueltos", 2);
        Map<String, Object> filaBeto = Map.of("id_usuario", "u2", "nombre", "Beto", "xp_total", 20, "ejercicios_resueltos", 4);
        // Dos respuestas distintas en llamadas sucesivas: si el cache fallara,
        // la segunda llamada a obtenerRankingGlobal traería la fila de Beto.
        // El servicio llama a la sobrecarga queryForList(sql, Object...), así que
        // el stub debe apuntar a esa misma sobrecarga (no a queryForList(String)).
        when(jdbcTemplate.queryForList(sql, new Object[] {})).thenReturn(List.of(filaAna), List.of(filaBeto));

        List<Map<String, Object>> primera = service.obtenerRankingGlobal(0);
        List<Map<String, Object>> segunda = service.obtenerRankingGlobal(0);

        assertThat(segunda).isEqualTo(primera);
        assertThat(segunda.get(0).get("nombre")).isEqualTo("Ana");
    }
}
