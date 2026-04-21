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
@CrossOrigin(origins = "*")
public class ModuloController {

    @Autowired
    private ModuloService moduloService;

    @GetMapping
    public ResponseEntity<?> obtenerModulos(Authentication authentication) {
        String emailUsuario = authentication.getName();
        List<Map<String, Object>> modulos = moduloService.obtenerModulosConEstado(emailUsuario);
        return ResponseEntity.ok(modulos);
    }

    @GetMapping("/completados")
    public ResponseEntity<?> obtenerModulosCompletados(Authentication authentication) {
        String emailUsuario = authentication.getName();
        List<Integer> modulosCompletados = moduloService.obtenerModulosCompletados(emailUsuario);
        return ResponseEntity.ok(modulosCompletados);
    }
}