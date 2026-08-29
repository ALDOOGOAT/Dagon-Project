package com.dagon.backend.controller;

import com.dagon.backend.dto.AuthResponseDTO;
import com.dagon.backend.dto.UsuarioResponseDTO;
import com.dagon.backend.model.Usuario;
import com.dagon.backend.security.AuthRateLimiter;
import com.dagon.backend.security.JwtUtil;
import com.dagon.backend.service.LeaderboardService;
import com.dagon.backend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UsuarioControllerTest {

    private UsuarioController controller;
    private UsuarioService usuarioService;
    private LeaderboardService leaderboardService;
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        controller = new UsuarioController();
        usuarioService = mock(UsuarioService.class);
        leaderboardService = mock(LeaderboardService.class);
        jwtUtil = mock(JwtUtil.class);

        ReflectionTestUtils.setField(controller, "usuarioService", usuarioService);
        ReflectionTestUtils.setField(controller, "leaderboardService", leaderboardService);
        ReflectionTestUtils.setField(controller, "jwtUtil", jwtUtil);
        ReflectionTestUtils.setField(controller, "authRateLimiter", new AuthRateLimiter());
    }

    @Test
    void registroDevuelveDtoSeguroSinPasswordHash() {
        Map<String, Object> entrada = Map.of(
                "nombre", "Aldo",
                "email", "aldo@example.com",
                "passwordHash", "secreto"
        );

        Usuario guardado = usuario("Aldo", "aldo@example.com", "hash-real");
        when(usuarioService.registrarUsuario(any(Usuario.class), eq("alumno"), isNull(), isNull())).thenReturn(guardado);
        when(jwtUtil.generarToken(guardado.getIdUsuario().toString())).thenReturn("jwt");

        ResponseEntity<?> response = controller.registrarUsuario(entrada);

        assertThat(response.getBody()).isInstanceOf(AuthResponseDTO.class);
        AuthResponseDTO body = (AuthResponseDTO) response.getBody();
        assertThat(body.getToken()).isEqualTo("jwt");
        assertThat(body.getUser().getEmail()).isEqualTo("aldo@example.com");
        assertThat(body.getUser().getClass().getDeclaredFields())
                .noneMatch(field -> field.getName().equals("passwordHash"));
    }

    @Test
    void loginDevuelveDtoSeguroSinPasswordHash() {
        Usuario credenciales = new Usuario();
        credenciales.setEmail("aldo@example.com");
        credenciales.setPasswordHash("secreto");

        Usuario autenticado = usuario("Aldo", "aldo@example.com", "hash-real");
        when(usuarioService.iniciarSesion("aldo@example.com", "secreto")).thenReturn(autenticado);
        when(jwtUtil.generarToken(autenticado.getIdUsuario().toString())).thenReturn("jwt");

        ResponseEntity<?> response = controller.loginUsuario(credenciales);

        assertThat(response.getBody()).isInstanceOf(AuthResponseDTO.class);
        AuthResponseDTO body = (AuthResponseDTO) response.getBody();
        assertThat(body.getUser()).isInstanceOf(UsuarioResponseDTO.class);
        assertThat(body.getUser().getClass().getDeclaredFields())
                .noneMatch(field -> field.getName().equals("passwordHash"));
    }

    @Test
    void perfilYProgresoSoloConsultanServicioParaUsuarioAutenticado() {
        String usuarioId = UUID.randomUUID().toString();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(usuarioId, null);
        UsuarioResponseDTO perfil = new UsuarioResponseDTO(UUID.fromString(usuarioId), "Aldo", "aldo@example.com", 1, true, null, null);

        when(usuarioService.obtenerPerfilSeguro(usuarioId)).thenReturn(Optional.of(perfil));
        when(usuarioService.obtenerEstadisticas(usuarioId)).thenReturn(Map.of("success", true, "xp", 120));

        ResponseEntity<?> perfilResponse = controller.obtenerPerfilPublico(usuarioId, auth);
        ResponseEntity<?> statsResponse = controller.obtenerEstadisticas(usuarioId, auth);

        assertThat(perfilResponse.getBody()).isEqualTo(perfil);
        assertThat(statsResponse.getBody()).isEqualTo(Map.of("success", true, "xp", 120));
        verify(usuarioService).obtenerPerfilSeguro(usuarioId);
        verify(usuarioService).obtenerEstadisticas(usuarioId);
    }

    @Test
    void rankingDuplicadoDeUsuariosUsaLeaderboardService() {
        List<Map<String, Object>> ranking = List.of(Map.of("nombre", "Aldo", "xp", 300));
        when(leaderboardService.obtenerRankingGlobal(0)).thenReturn(ranking);

        ResponseEntity<?> response = controller.obtenerRanking();

        assertThat(response.getBody()).isEqualTo(ranking);
        verify(leaderboardService).obtenerRankingGlobal(0);
    }

    private Usuario usuario(String nombre, String email, String passwordHash) {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(UUID.randomUUID());
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordHash);
        usuario.setIdRol(1);
        usuario.setActivo(true);
        return usuario;
    }
}
