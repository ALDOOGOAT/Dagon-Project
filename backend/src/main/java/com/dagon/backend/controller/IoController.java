package com.dagon.backend.controller;

import com.dagon.backend.service.io.IoInterpretacionService;
import com.dagon.backend.service.clawbot.ClawbotRateLimiter;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/io")
public class IoController {
    private final IoInterpretacionService service;
    private final ClawbotRateLimiter limiter;
    public IoController(IoInterpretacionService service, ClawbotRateLimiter limiter) {
        this.service = service; this.limiter = limiter;
    }
    @PostMapping("/interpretar")
    public Object interpretar(@RequestBody Map<String, Object> entrada, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión para interpretar el problema.");
        }
        Object texto = entrada.get("enunciado");
        if (!(texto instanceof String enunciado) || enunciado.trim().length() < 20 || enunciado.length() > 12000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enunciado debe tener entre 20 y 12000 caracteres.");
        }
        limiter.consume(authentication.getName(), "analysis");
        return service.interpretar(enunciado.trim()).contratoHttp();
    }
    /** Interpreta (IA primero, servidor de respaldo) y resuelve en el servidor; o resuelve directamente un modelo ya escrito. */
    @PostMapping("/resolver")
    public Object resolver(@RequestBody Map<String, Object> entrada, Authentication authentication, jakarta.servlet.http.HttpServletRequest peticion) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión para resolver el problema.");
        }
        // Un modelo del contrato cabe de sobra en 64 KB; más es abuso, no un problema de IO.
        long largo = peticion.getContentLengthLong();
        // Sin Content-Length (chunked) no se puede acotar antes de procesar: se rechaza; axios y los navegadores siempre lo envían.
        if (largo < 0 || largo > 65_536) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "El problema enviado es demasiado grande.");
        if (entrada.get("modelo") instanceof Map<?, ?> modelo) {
            // Branch & bound puede costar CPU: mismo límite por usuario que el análisis.
            limiter.consume(authentication.getName(), "analysis");
            try {
                return service.resolverModelo(new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(modelo)).contratoHttp();
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
        }
        Object texto = entrada.get("enunciado");
        if (!(texto instanceof String enunciado) || enunciado.trim().length() < 20 || enunciado.length() > 12000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envía un enunciado de 20 a 12000 caracteres o un modelo.");
        }
        limiter.consume(authentication.getName(), "analysis");
        return service.resolver(enunciado.trim()).contratoHttp();
    }
}
