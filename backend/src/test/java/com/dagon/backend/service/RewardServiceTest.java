package com.dagon.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RewardServiceTest {

    private RewardService service;
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        service = new RewardService();
        jdbcTemplate = mock(JdbcTemplate.class);
        ReflectionTestUtils.setField(service, "jdbcTemplate", jdbcTemplate);
    }

    @Test
    void noRegistraIntentoSinUsuario() {
        service.registrarIntento(null, 1, "SELECT 1;", true, 10.0, 1.0);
        service.registrarIntento("  ", 1, "SELECT 1;", true, 10.0, 1.0);

        verify(jdbcTemplate, times(0)).update(anyString(), any(Object[].class));
    }

    @Test
    void caeAColumnasBasicasSiLaTablaNoSoportaColumnasCompetitivas() {
        // La consulta de information_schema devuelve menos de 2 columnas: no hay soporte competitivo.
        when(jdbcTemplate.queryForObject(org.mockito.ArgumentMatchers.contains("information_schema.columns"), org.mockito.ArgumentMatchers.eq(Integer.class)))
                .thenReturn(0);

        service.registrarIntento("11111111-1111-1111-1111-111111111111", 5, "SELECT 1;", true, 12.5, 3.0);

        verify(jdbcTemplate, times(1)).update(
                org.mockito.ArgumentMatchers.contains("(id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms)"),
                any(), any(), any(), any(), any());
    }

    @Test
    void contarAciertosRapidosHoyDevuelveCeroSinUsuario() {
        assertThat(service.contarAciertosRapidosHoy(null)).isZero();
        assertThat(service.contarAciertosRapidosHoy("")).isZero();
    }

    @Test
    void calcularTiempoMsEsNoNegativo() {
        long inicio = System.nanoTime() - 5_000_000; // ~5ms atrás
        assertThat(service.calcularTiempoMs(inicio)).isGreaterThanOrEqualTo(0.0);
    }
}
