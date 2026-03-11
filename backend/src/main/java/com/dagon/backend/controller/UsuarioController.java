package com.dagon.backend.controller;
import org.springframework.jdbc.core.JdbcTemplate;
import com.dagon.backend.model.Usuario;
import com.dagon.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:3000")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    // Cuando React pregunte por los puntos de un usuario
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> obtenerEstadisticas(@PathVariable String id) {
        Map<String, Object> stats = new HashMap<>();

        // Calculamos la XP asegurándonos de contar cada ejercicio solo una vez (DISTINCT)
        String sqlXP = "SELECT COALESCE(SUM(e.dificultad * 10), 0) " +
                "FROM (SELECT DISTINCT id_ejercicio FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) as unicos " +
                "JOIN lms_core.ejercicios_practicos e ON unicos.id_ejercicio = e.id_ejercicio";
        try {
            Integer xpTotal = jdbcTemplate.queryForObject(sqlXP, Integer.class, id);
            stats.put("xp", xpTotal);
            stats.put("success", true);
        } catch (Exception e) {
            stats.put("xp", 0);
            stats.put("success", false);
        }

        return ResponseEntity.ok(stats);
    }
    // PUERTA 1: REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        try {
            Usuario usuarioGuardado = usuarioService.registrarUsuario(nuevoUsuario);
            return ResponseEntity.ok(usuarioGuardado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUERTA 2: LOGIN (¡NUEVO!)
    @PostMapping("/login")
    public ResponseEntity<?> loginUsuario(@RequestBody Usuario credenciales) {
        try {
            // Le pasamos el correo y la contraseña al Chef para que los verifique
            Usuario usuarioAutenticado = usuarioService.iniciarSesion(
                    credenciales.getEmail(),
                    credenciales.getPasswordHash()
            );
            return ResponseEntity.ok(usuarioAutenticado); // Devuelve los datos del usuario si todo está bien
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // Devuelve el error si falló
        }
    }
}