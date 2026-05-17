package com.dagon.backend.controller;

import com.dagon.backend.dto.AuthResponseDTO;
import com.dagon.backend.dto.UsuarioResponseDTO;
import com.dagon.backend.model.Usuario;
import com.dagon.backend.security.AuthRateLimiter;
import com.dagon.backend.security.JwtUtil;
import com.dagon.backend.service.LeaderboardService;
import com.dagon.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private LeaderboardService leaderboardService;
    @Autowired
    private AuthRateLimiter authRateLimiter;

    // Cuando React pregunte por las estadísticas COMPLETAS del Perfil
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> obtenerEstadisticas(@PathVariable String id, Authentication authentication) {
        validarPropietario(id, authentication);
        return ResponseEntity.ok(usuarioService.obtenerEstadisticas(id));
    }

    // PUERTA 1: REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody Map<String, Object> body) {
        try {
            authRateLimiter.consumeRegistro((String) body.get("email"));

            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setNombre((String) body.get("nombre"));
            nuevoUsuario.setEmail((String) body.get("email"));
            nuevoUsuario.setPasswordHash((String) body.get("passwordHash"));

            // El registro publico siempre crea alumnos. Los roles elevados deben asignarse por un flujo docente/admin.
            Usuario usuarioGuardado = usuarioService.registrarUsuario(nuevoUsuario, "alumno");

            String token = jwtUtil.generarToken(usuarioGuardado.getIdUsuario().toString());

            return ResponseEntity.ok(new AuthResponseDTO(token, UsuarioResponseDTO.from(usuarioGuardado)));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUERTA 2: LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> loginUsuario(@RequestBody Usuario credenciales) {
        try {
            authRateLimiter.consumeLogin(credenciales.getEmail());

            Usuario usuarioAutenticado = usuarioService.iniciarSesion(
                    credenciales.getEmail(),
                    credenciales.getPasswordHash()
            );

            // ¡MAGIA! Generamos su pasaporte de sesión
            String token = jwtUtil.generarToken(usuarioAutenticado.getIdUsuario().toString());

            return ResponseEntity.ok(new AuthResponseDTO(token, UsuarioResponseDTO.from(usuarioAutenticado)));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // --- TEMPORAL: Puerta provisional para obtener el perfil ---
    @GetMapping("/{id}/profile")
    public ResponseEntity<?> obtenerPerfilPublico(@PathVariable String id, Authentication authentication) {
        validarPropietario(id, authentication);
        return usuarioService.obtenerPerfilSeguro(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.badRequest().body("Usuario no encontrado."));
    }

    // PUERTA: SALÓN DE LA FAMA (Tiempo Real Optimizado)
    @GetMapping("/ranking")
    public ResponseEntity<?> obtenerRanking() {
        return ResponseEntity.ok(leaderboardService.obtenerRankingGlobal());
    }

    @PostMapping("/{id}/foto")
    public ResponseEntity<?> subirFotoPerfil(@PathVariable String id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        validarPropietario(id, authentication);

        try {
            String fotoUrl = usuarioService.guardarFotoPerfil(id, file);
            return ResponseEntity.ok(Map.of("success", true, "fotoUrl", fotoUrl));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<?> obtenerFotoPerfil(@PathVariable String id, Authentication authentication) {
        validarPropietario(id, authentication);
        return ResponseEntity.ok(Map.of("fotoUrl", usuarioService.obtenerFotoPerfil(id)));
    }

    @GetMapping("/imagen/{filename}")
    public ResponseEntity<byte[]> servirImagen(@PathVariable String filename) throws IOException {
        UsuarioService.ImagenPerfil imagen = usuarioService.cargarImagenPerfil(filename);
        if (imagen != null) {
            return ResponseEntity.ok()
                .header("Content-Type", imagen.contentType())
                .body(imagen.bytes());
        }
        return ResponseEntity.notFound().build();
    }

    private void validarPropietario(String id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null || !authentication.getName().equals(id)) {
            throw new AccessDeniedException("No tienes permiso para modificar o consultar este perfil");
        }
    }
}
