package com.dagon.backend.controller;

import com.dagon.backend.dto.UsuarioResponseDTO;
import com.dagon.backend.service.LeaderboardService;
import com.dagon.backend.service.ModuloService;
import com.dagon.backend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardControllerTest {

    private DashboardController controller;
    private UsuarioService usuarioService;
    private ModuloService moduloService;
    private LeaderboardService leaderboardService;

    @BeforeEach
    void setUp() {
        controller = new DashboardController();
        usuarioService = mock(UsuarioService.class);
        moduloService = mock(ModuloService.class);
        leaderboardService = mock(LeaderboardService.class);

        ReflectionTestUtils.setField(controller, "usuarioService", usuarioService);
        ReflectionTestUtils.setField(controller, "moduloService", moduloService);
        ReflectionTestUtils.setField(controller, "leaderboardService", leaderboardService);
    }

    @Test
    void resumenUsaUsuarioAutenticadoYAgrupaDatosIniciales() {
        String usuarioId = UUID.randomUUID().toString();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(usuarioId, null);
        UsuarioResponseDTO perfil = new UsuarioResponseDTO(UUID.fromString(usuarioId), "Aldo", "aldo@example.com", 1, true, null, null);
        Map<String, Object> stats = Map.of("success", true, "xp", 120, "racha", 2);
        List<Map<String, Object>> modulos = List.of(Map.of("id_curso", 1, "titulo", "SQL"));
        List<Map<String, Object>> ranking = List.of(Map.of("nombre", "Aldo", "xp", 120));

        when(usuarioService.obtenerPerfilSeguro(usuarioId)).thenReturn(Optional.of(perfil));
        when(usuarioService.obtenerEstadisticasResumen(usuarioId)).thenReturn(stats);
        when(moduloService.obtenerModulosConEstado(usuarioId, "io")).thenReturn(modulos);
        when(leaderboardService.obtenerRankingGlobal(5, "io")).thenReturn(ranking);

        var response = controller.obtenerResumen("io", auth);

        assertThat(response.getBody()).isInstanceOf(Map.class);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertThat(body.get("usuario")).isEqualTo(perfil);
        assertThat(body.get("stats")).isEqualTo(stats);
        assertThat(body.get("modulos")).isEqualTo(modulos);
        assertThat(body.get("leaderboard")).isEqualTo(ranking);

        verify(usuarioService).obtenerEstadisticasResumen(usuarioId);
        verify(moduloService).obtenerModulosConEstado(usuarioId, "io");
        verify(leaderboardService).obtenerRankingGlobal(5, "io");
    }
}
