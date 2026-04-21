package com.dagon.backend.controller;

import com.dagon.backend.service.ClawbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clawbot")
@CrossOrigin(origins = "*")
public class ClawbotController {

    @Autowired
    private ClawbotService clawbotService;

    // ==========================================
    // ENDPOINT 1: EL CHAT NORMAL
    // ==========================================
    @PostMapping("/chat")
    public ResponseEntity<?> chatearConClawbot(@RequestBody Map<String, Object> payload) {
        String mensaje = (String) payload.get("mensaje");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> historial = (List<Map<String, String>>) payload.get("historial");

        if (mensaje == null || mensaje.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El mensaje no puede estar vacío");
        }

        String respuestaIa = clawbotService.obtenerRespuestaClawbot(mensaje, historial);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("response", respuestaIa);

        return ResponseEntity.ok(respuesta);
    }

    // ==========================================
    // ENDPOINT 2: LA FASE 4 (Pedagogía Adaptativa)
    // ==========================================
    @PostMapping("/analyze")
    public ResponseEntity<?> analizarError(@RequestBody Map<String, Object> payload) {

        // 1. Extraemos los textos
        String descripcion = (String) payload.get("descripcion");
        String queryMaestra = (String) payload.get("queryMaestra");
        String queryAlumno = (String) payload.get("queryAlumno");
        String errorDb = (String) payload.get("errorDb");

        // 2. Extraemos el número de intentos de forma segura
        int intentos = 0;
        if (payload.get("intentos") != null) {
            intentos = Integer.parseInt(payload.get("intentos").toString());
        }

        // 3. Llamamos al servicio con los 5 parámetros requeridos
        String respuestaClawbot = clawbotService.obtenerAyudaSocratica(descripcion, queryMaestra, queryAlumno, errorDb, intentos);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("mensaje", respuestaClawbot);

        return ResponseEntity.ok(respuesta);
    }
}