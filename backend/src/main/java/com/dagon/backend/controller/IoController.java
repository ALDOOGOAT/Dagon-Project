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
}
