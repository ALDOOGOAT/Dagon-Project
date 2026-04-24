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

    @GetMapping("/cursos-completados")
    public ResponseEntity<?> obtenerCursosCompletados(Authentication authentication) {
        String emailUsuario = authentication.getName();
        List<Map<String, Object>> cursosCompletados = moduloService.obtenerCursosCompletados(emailUsuario);
        return ResponseEntity.ok(cursosCompletados);
    }

    @GetMapping("/certificado/{cursoId}")
    public ResponseEntity<?> generarCertificado(@PathVariable Integer cursoId, Authentication authentication) {
        String emailUsuario = authentication.getName();
        Map<String, Object> certificado = moduloService.generarCertificado(emailUsuario, cursoId);
        if (certificado == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Curso no completado o no encontrado"));
        }
        return ResponseEntity.ok(certificado);
    }
}