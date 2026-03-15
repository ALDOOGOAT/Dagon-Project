package com.dagon.backend.controller;

import com.dagon.backend.service.ModuloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modulos")
@CrossOrigin(origins = "http://localhost:3000")
public class ModuloController {

    @Autowired
    private ModuloService moduloService;

    @GetMapping
    public ResponseEntity<?> obtenerModulos(Authentication authentication) {
        // El email del usuario viene automáticamente dentro de su token JWT seguro
        String emailUsuario = authentication.getName();

        List<Map<String, Object>> modulos = moduloService.obtenerModulosConEstado(emailUsuario);

        return ResponseEntity.ok(modulos);
    }
}