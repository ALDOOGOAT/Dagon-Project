package com.dagon.backend.controller;

import com.dagon.backend.service.ClawbotService;
import com.dagon.backend.service.EjercicioService;
import com.dagon.backend.model.EjercicioPractico;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import com.dagon.backend.service.validation.EjercicioValidationRouter;
import com.dagon.backend.service.validation.TipoValidacionEjercicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clawbot")
public class ClawbotController {

    @Autowired
    private ClawbotService clawbotService;

    @Autowired
    private EjercicioPracticoRepository ejercicioRepository;

    @Autowired
    private EjercicioValidationRouter validationRouter;

    @Autowired
    private EjercicioService ejercicioService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ==========================================
    // ENDPOINT 1: EL CHAT NORMAL
    // ==========================================
    @PostMapping("/chat")
    public ResponseEntity<?> chatearConClawbot(@RequestBody Map<String, Object> payload, Authentication authentication) {
        String mensaje = (String) payload.get("mensaje");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> historial = (List<Map<String, String>>) payload.get("historial");

        if (mensaje == null || mensaje.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El mensaje no puede estar vacío");
        }

        String usuarioId = authentication != null ? authentication.getName() : "anonimo";
        String materia = payload.get("materia") != null ? payload.get("materia").toString() : null;
        String respuestaIa = clawbotService.obtenerRespuestaClawbot(usuarioId, mensaje, historial, materia);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("response", respuestaIa);

        return ResponseEntity.ok(respuesta);
    }

    // ==========================================
    // ENDPOINT 2: LA FASE 4 (Pedagogía Adaptativa)
    // ==========================================
    @PostMapping("/analyze")
    public ResponseEntity<?> analizarError(@RequestBody Map<String, Object> payload, Authentication authentication) {

        // 1. Extraemos los textos
        String descripcion = (String) payload.get("descripcion");
        String usuarioId = authentication != null ? authentication.getName() : "anonimo";
        EjercicioPractico ejercicio = resolverEjercicioServidor(payload, usuarioId);
        String queryMaestra = ejercicio != null
                && validationRouter.resolverTipo(ejercicio, null) != TipoValidacionEjercicio.NUMERICO
                ? ejercicio.getQueryMaestra() : null;
        if (ejercicio != null) {
            descripcion = ejercicio.getEnunciado();
        }
        String queryAlumno = (String) payload.get("queryAlumno");
        String errorDb = (String) payload.get("errorDb");

        // 2. Extraemos el número de intentos de forma segura
        int intentos = 0;
        if (payload.get("intentos") != null) {
            intentos = Integer.parseInt(payload.get("intentos").toString());
        }

        // 3. Contexto del nivel y ejercicio
        int nivelId = 0;
        if (payload.get("nivelId") != null) {
            nivelId = Integer.parseInt(payload.get("nivelId").toString());
        }
        String tituloEjercicio = payload.get("tituloEjercicio") != null ? payload.get("tituloEjercicio").toString() : "";

        // 4. Llamamos al servicio con contexto completo
        String materia = ejercicio != null ? resolverMateriaServidor(ejercicio) : "sql";
        if (ejercicio != null) {
            nivelId = ejercicio.getIdModulo();
            tituloEjercicio = ejercicio.getTitulo();
        }
        String respuestaClawbot = clawbotService.obtenerAyudaSocratica(usuarioId, descripcion, queryMaestra, queryAlumno, errorDb, intentos, nivelId, tituloEjercicio, materia);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("mensaje", respuestaClawbot);

        return ResponseEntity.ok(respuesta);
    }

    private EjercicioPractico resolverEjercicioServidor(Map<String, Object> payload, String usuarioId) {
        Object id = payload.get("ejercicioId");
        if (id == null) return null;
        final Integer ejercicioId;
        try {
            ejercicioId = Integer.valueOf(id.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de ejercicio inválido");
        }
        EjercicioPractico ejercicio = ejercicioRepository.findById(ejercicioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ejercicio no encontrado"));
        if (!ejercicioService.usuarioPuedeAccederEjercicio(ejercicio, usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este ejercicio");
        }
        return ejercicio;
    }

    private String resolverMateriaServidor(EjercicioPractico ejercicio) {
        return jdbcTemplate.queryForObject("SELECT c.materia_slug FROM lms_core.cursos c "
                + "JOIN lms_core.modulos m ON m.id_curso = c.id_curso WHERE m.id_modulo = ?",
                String.class, ejercicio.getIdModulo());
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> obtenerMetricas() {
        return ResponseEntity.ok(clawbotService.obtenerMetricas());
    }
}
