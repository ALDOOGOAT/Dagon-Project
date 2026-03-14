package com.dagon.backend.controller;

import com.dagon.backend.service.ClawbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/clawbot")
@CrossOrigin(origins = "http://localhost:3000")
public class ClawbotController {

    @Autowired
    private ClawbotService clawbotService;

    @PostMapping("/chat")
    public ResponseEntity<?> chatearConClawbot(@RequestBody Map<String, Object> payload) {
        String mensaje = (String) payload.get("mensaje");

        // ¡NUEVO! Atrapamos el historial de mensajes
        List<Map<String, String>> historial = (List<Map<String, String>>) payload.get("historial");

        if (mensaje == null || mensaje.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El mensaje no puede estar vacío");
        }

        String respuestaIa = clawbotService.obtenerRespuestaClawbot(mensaje, historial);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("response", respuestaIa);

        return ResponseEntity.ok(respuesta);
    }
}