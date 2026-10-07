package com.dagon.backend.controller;

import com.dagon.backend.service.ModuloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Va aparte de ModuloController porque este cuelga de /api/modulos y las materias de /api/materias.
@RestController
@RequestMapping("/api/materias")
public class MateriaController {

    @Autowired
    private ModuloService moduloService;

    // [{slug, nombre, descripcion, orden, xp, modulosTotal, modulosCompletados}] del usuario autenticado
    @GetMapping
    public ResponseEntity<?> obtenerMaterias(Authentication authentication) {
        return ResponseEntity.ok(moduloService.obtenerMateriasConProgreso(authentication.getName()));
    }
}
