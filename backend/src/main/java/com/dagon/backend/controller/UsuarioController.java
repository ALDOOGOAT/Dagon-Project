package com.dagon.backend.controller;

import com.dagon.backend.repository.UsuarioRepository;
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
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private com.dagon.backend.security.JwtUtil jwtUtil;

    // Cuando React pregunte por las estadísticas COMPLETAS del Perfil
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> obtenerEstadisticas(@PathVariable String id) {
        Map<String, Object> stats = new HashMap<>();

        try {
            // 1. XP Total
            String sqlXP = "SELECT COALESCE(SUM(e.dificultad * 10), 0) " +
                    "FROM (SELECT DISTINCT id_ejercicio FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) as unicos " +
                    "JOIN lms_core.ejercicios_practicos e ON unicos.id_ejercicio = e.id_ejercicio";
            stats.put("xp", jdbcTemplate.queryForObject(sqlXP, Integer.class, id));

            // 2. Posición Global
            String sqlRank = "SELECT posicion FROM (" +
                    "  SELECT id_usuario, RANK() OVER (ORDER BY xp_total DESC) as posicion " +
                    "  FROM lms_core.v_ranking_alumnos" +
                    ") ranking_tabla WHERE id_usuario = ?::uuid";
            try {
                stats.put("posicion", jdbcTemplate.queryForObject(sqlRank, Integer.class, id));

            } catch (Exception noRank) {
                stats.put("posicion", "-");
            }

            // 3. Consultas Totales y Ejercicios Completados
            String sqlConsultas = "SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid";
            stats.put("consultas_totales", jdbcTemplate.queryForObject(sqlConsultas, Integer.class, id));

            String sqlCompletados = "SELECT COUNT(DISTINCT id_ejercicio) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true";
            stats.put("ejercicios_completados", jdbcTemplate.queryForObject(sqlCompletados, Integer.class, id));

            // 4. Calculadora de Racha Actual y Mejor Racha Histórica
            String sqlFechas = "SELECT DISTINCT DATE(fecha_intento) as fecha_actividad " +
                    "FROM lms_core.intentos WHERE id_usuario = ?::uuid ORDER BY fecha_actividad DESC";

            int rachaActual = 0;
            int mejorRacha = 0;

            java.util.List<java.sql.Date> fechas = jdbcTemplate.queryForList(sqlFechas, java.sql.Date.class, id);

            if (!fechas.isEmpty()) {
                java.time.LocalDate hoy = java.time.LocalDate.now();
                java.time.LocalDate ultimaActividad = fechas.get(0).toLocalDate();

                // Calcular racha actual
                if (ultimaActividad.equals(hoy) || ultimaActividad.equals(hoy.minusDays(1))) {
                    rachaActual = 1;
                    java.time.LocalDate diaRevisado = ultimaActividad;
                    for (int i = 1; i < fechas.size(); i++) {
                        java.time.LocalDate diaAnterior = fechas.get(i).toLocalDate();
                        if (diaRevisado.minusDays(1).equals(diaAnterior)) {
                            rachaActual++;
                            diaRevisado = diaAnterior;
                        } else {
                            break;
                        }
                    }
                }

                // Calcular mejor racha histórica
                int rachaTemp = 1;
                java.time.LocalDate diaRevisadoHist = fechas.get(0).toLocalDate();
                for (int i = 1; i < fechas.size(); i++) {
                    java.time.LocalDate diaAnterior = fechas.get(i).toLocalDate();
                    if (diaRevisadoHist.minusDays(1).equals(diaAnterior)) {
                        rachaTemp++;
                    } else {
                        if (rachaTemp > mejorRacha) mejorRacha = rachaTemp;
                        rachaTemp = 1;
                    }
                    diaRevisadoHist = diaAnterior;
                }
                if (rachaTemp > mejorRacha) mejorRacha = rachaTemp;
            }

            stats.put("racha", rachaActual);
            stats.put("mejor_racha", mejorRacha);

            // 5. ¡NUEVO! Distribución de XP por Dificultad
            // Agrupamos los puntos ganados dependiendo de si el ejercicio era nivel 1, 2, 3, etc.
            String sqlDistribucion = "SELECT e.dificultad, SUM(e.dificultad * 10) as xp_ganada " +
                    "FROM (SELECT DISTINCT id_ejercicio FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) as unicos " +
                    "JOIN lms_core.ejercicios_practicos e ON unicos.id_ejercicio = e.id_ejercicio " +
                    "GROUP BY e.dificultad " +
                    "ORDER BY e.dificultad";
            try {
                java.util.List<Map<String, Object>> distribucion = jdbcTemplate.queryForList(sqlDistribucion, id);
                stats.put("distribucion_xp", distribucion);
            } catch (Exception e) {
                stats.put("distribucion_xp", new java.util.ArrayList<>());
            }

            stats.put("success", true);

        } catch (Exception e) {
            stats.put("success", false);
        }

        return ResponseEntity.ok(stats);
    }

    // PUERTA 1: REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        try {
            Usuario usuarioGuardado = usuarioService.registrarUsuario(nuevoUsuario);

            // ¡MAGIA! Generamos su primer pasaporte oficial
            String token = jwtUtil.generarToken(usuarioGuardado.getIdUsuario().toString());

            // Empacamos el token y los datos en un mapa
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("token", token);
            respuesta.put("user", usuarioGuardado);

            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUERTA 2: LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> loginUsuario(@RequestBody Usuario credenciales) {
        try {
            Usuario usuarioAutenticado = usuarioService.iniciarSesion(
                    credenciales.getEmail(),
                    credenciales.getPasswordHash()
            );

            // ¡MAGIA! Generamos su pasaporte de sesión
            String token = jwtUtil.generarToken(usuarioAutenticado.getIdUsuario().toString());

            // Empacamos el token y los datos
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("token", token);
            respuesta.put("user", usuarioAutenticado);

            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // --- TEMPORAL: Puerta provisional para obtener el perfil ---
    @GetMapping("/{id}/profile")
    public ResponseEntity<?> obtenerPerfilPublico(@PathVariable String id) {
        // Buscamos al usuario en la base de datos real usando su UUID
        java.util.Optional<Usuario> usuarioOp = usuarioRepository.findById(java.util.UUID.fromString(id));

        if (usuarioOp.isPresent()) {
            return ResponseEntity.ok(usuarioOp.get()); // Devolvemos todo el usuario (incluyendo el nombre real)
        } else {
            return ResponseEntity.badRequest().body("Usuario no encontrado.");
        }
    }

    // PUERTA: SALÓN DE LA FAMA (Tiempo Real Optimizado)
    @GetMapping("/ranking")
    public ResponseEntity<?> obtenerRanking() {
        // Consultamos la vista dinámica que ya tiene toda la lógica calculada y sin trampas
        String sqlRanking = "SELECT nombre, xp_total FROM lms_core.v_ranking_alumnos LIMIT 10";

        try {
            java.util.List<Map<String, Object>> topAventureros = jdbcTemplate.queryForList(sqlRanking);
            return ResponseEntity.ok(topAventureros);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al cargar el ranking: " + e.getMessage());
        }
    }
}