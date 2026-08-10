package com.dagon.backend.controller;

import com.dagon.backend.service.DocenteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DocenteControllerTest {

    private DocenteController controller;
    private DocenteService docenteService;

    @BeforeEach
    void setUp() {
        controller = new DocenteController();
        docenteService = mock(DocenteService.class);
        ReflectionTestUtils.setField(controller, "docenteService", docenteService);
    }

    @Test
    void tableroUsaServicioLivianoConRolDocente() {
        String docenteId = UUID.randomUUID().toString();
        UsernamePasswordAuthenticationToken auth = docenteAuth(docenteId);
        Map<String, Object> tablero = Map.of("total_alumnos", 3, "alumnos", List.of());

        when(docenteService.obtenerTablero(docenteId, false, null, null, null, 2)).thenReturn(tablero);

        var response = controller.obtenerTablero(null, null, null, 2, auth);

        assertThat(response.getBody()).isEqualTo(tablero);
        verify(docenteService).obtenerTablero(docenteId, false, null, null, null, 2);
    }

    @Test
    void calificacionesEjerciciosPaginadasConservanFiltros() {
        String docenteId = UUID.randomUUID().toString();
        UsernamePasswordAuthenticationToken auth = docenteAuth(docenteId);
        String alumnoId = UUID.randomUUID().toString();
        Map<String, Object> page = Map.of("items", List.of(), "page", 1, "size", 25, "total", 0);

        when(docenteService.obtenerCalificacionesEjercicios(docenteId, false, 1, 4, alumnoId, 1, 25)).thenReturn(page);

        var response = controller.obtenerCalificacionesEjercicios(1, 4, alumnoId, 1, 25, auth);

        assertThat(response.getBody()).isEqualTo(page);
        verify(docenteService).obtenerCalificacionesEjercicios(docenteId, false, 1, 4, alumnoId, 1, 25);
    }

    private UsernamePasswordAuthenticationToken docenteAuth(String docenteId) {
        return new UsernamePasswordAuthenticationToken(
                docenteId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DOCENTE"))
        );
    }
}
