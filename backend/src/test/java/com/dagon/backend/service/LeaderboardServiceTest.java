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

        List<Map<String, Object>> primera = service.obtenerRankingGlobal(0, null);
        List<Map<String, Object>> segunda = service.obtenerRankingGlobal(0, null);

        assertThat(segunda).isEqualTo(primera);
        assertThat(segunda.get(0).get("nombre")).isEqualTo("Ana");
    }

    @Test
    void cacheaPorSeparadoElRankingGlobalYElDeCadaMateria() {
        Map<String, Object> filaGlobal = Map.of("id_usuario", "u1", "nombre", "Ana", "xp_total", 50, "ejercicios_resueltos", 5);
        Map<String, Object> filaIo = Map.of("id_usuario", "u2", "nombre", "Beto", "xp_total", 30, "ejercicios_resueltos", 3);
        String sqlIo = "SELECT x.id_usuario, u.nombre, x.xp AS xp_total, x.ejercicios_resueltos " +
                "FROM lms_core.v_xp_por_materia x " +
                "JOIN lms_core.usuarios u ON u.id_usuario = x.id_usuario " +
                "WHERE x.materia_slug = ? " +
                "ORDER BY x.xp DESC, x.ejercicios_resueltos DESC, u.nombre ASC LIMIT ?";
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.startsWith("SELECT id_usuario, nombre, xp_total"), org.mockito.ArgumentMatchers.<Object[]>any()))
                .thenReturn(List.of(filaGlobal));
        when(jdbcTemplate.queryForList(sqlIo, new Object[] {"io", 5})).thenReturn(List.of(filaIo));

        List<Map<String, Object>> global = service.obtenerRankingGlobal(5, null);
        List<Map<String, Object>> io1 = service.obtenerRankingGlobal(5, "io");
        List<Map<String, Object>> io2 = service.obtenerRankingGlobal(5, "io");

        assertThat(global.get(0).get("nombre")).isEqualTo("Ana");
        assertThat(io1.get(0).get("nombre")).isEqualTo("Beto");
        assertThat(io1.get(0).get("xp")).isEqualTo(30);
        // segunda llamada con la misma clave (limite + materia): sale del cache, no de la BD
        assertThat(io2).isEqualTo(io1);
        org.mockito.Mockito.verify(jdbcTemplate, org.mockito.Mockito.times(1)).queryForList(sqlIo, new Object[] {"io", 5});
        // materia vacia = global (misma clave que null)
        assertThat(service.obtenerRankingGlobal(5, "").get(0).get("nombre")).isEqualTo("Ana");
    }
}
