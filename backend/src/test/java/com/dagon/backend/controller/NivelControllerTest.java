package com.dagon.backend.controller;

import com.dagon.backend.service.EjercicioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NivelControllerTest {

    private NivelController controller;
    private EjercicioService ejercicioService;

    @BeforeEach
    void setUp() {
        controller = new NivelController();
        ejercicioService = mock(EjercicioService.class);
        ReflectionTestUtils.setField(controller, "ejercicioService", ejercicioService);
    }

    @Test
    void validarEjercicioUsaUsuarioDelTokenYNoDelBody() {
        String usuarioToken = UUID.randomUUID().toString();
        String usuarioBody = UUID.randomUUID().toString();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(usuarioToken, null);
        when(ejercicioService.validarConsulta(7, "SELECT * FROM usuarios;", usuarioToken))
                .thenReturn(Map.of("success", true));

        var response = controller.validarEjercicio(7, Map.of(
                "query", "SELECT * FROM usuarios;",
                "usuarioId", usuarioBody
        ), auth);

        assertThat(response.getBody()).isEqualTo(Map.of("success", true));
        verify(ejercicioService).validarConsulta(7, "SELECT * FROM usuarios;", usuarioToken);
    }

    @Test
    void obtenerEjerciciosIncluyeMetadataDelModulo() {
        when(ejercicioService.obtenerEjerciciosPorModulo(4, null)).thenReturn(List.of());
        when(ejercicioService.obtenerMetadataModulo(4)).thenReturn(Map.of(
                "id_modulo", 4,
                "titulo", "Prueba de Dagon",
                "objetivos", List.of("Integrar MER, DDL y consultas")
        ));

        var response = controller.getExercisesByLevel(4, null);

        assertThat(response.getBody()).isInstanceOf(Map.class);
        Map<?, ?> body = (Map<?, ?>) response.getBody();

        assertThat(body.get("exercises")).isEqualTo(List.of());
        assertThat(body.get("module")).isEqualTo(Map.of(
                "id_modulo", 4,
                "titulo", "Prueba de Dagon",
                "objetivos", List.of("Integrar MER, DDL y consultas")
        ));

        verify(ejercicioService).obtenerEjerciciosPorModulo(4, null);
        verify(ejercicioService).obtenerMetadataModulo(4);
    }
}
