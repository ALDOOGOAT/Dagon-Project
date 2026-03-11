package com.dagon.backend.controller;

import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.service.EjercicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class NivelController {

    @Autowired
    private EjercicioService ejercicioService;

    // Cuando React haga una petición GET a http://localhost:8080/api/levels
    @GetMapping("/levels")
    public ResponseEntity<?> getLevels() {
        List<NivelDTO> niveles = ejercicioService.obtenerTodosLosNiveles();

        // React espera recibir un objeto JSON que se vea así: { "levels": [ ... ] }
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("levels", niveles);

        return ResponseEntity.ok(respuesta);
    }
    // Cuando React pida los detalles de un nivel (ej. /api/exercises/1)
    @GetMapping("/exercises/{levelId}")
    public ResponseEntity<?> getExercisesByLevel(@PathVariable Integer levelId) {
        // Llamamos al nuevo método del servicio
        List<EjercicioDTO> ejercicios = ejercicioService.obtenerEjerciciosPorModulo(levelId);

        // Lo envolvemos en el formato que React espera: { "exercises": [ ... ] }
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exercises", ejercicios);

        return ResponseEntity.ok(respuesta);
    }
    @PostMapping("/exercises/{id}/validate")
    public ResponseEntity<?> validarEjercicio(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String queryUsuario = request.get("query");
        // ¡NUEVO! Extraemos el ID del usuario que nos mandará React
        String usuarioId = request.get("usuarioId");

        // Le pasamos el usuarioId al Chef
        Map<String, Object> resultado = ejercicioService.validarConsulta(id, queryUsuario, usuarioId);

        return ResponseEntity.ok(resultado);
    }
}