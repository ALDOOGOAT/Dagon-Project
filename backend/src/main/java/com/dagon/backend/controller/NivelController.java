package com.dagon.backend.controller;

import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.service.EjercicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class NivelController {

    @Autowired
    private EjercicioService ejercicioService;

    // 1. Obtener todos los niveles/módulos
    // URL: http://localhost:8080/api/levels
    @GetMapping("/levels")
    public ResponseEntity<?> getLevels(Authentication authentication) {
        String usuarioId = authentication != null ? authentication.getName() : null;
        List<NivelDTO> niveles = ejercicioService.obtenerTodosLosNiveles(usuarioId);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("levels", niveles);
        return ResponseEntity.ok(respuesta);
    }

    // 2. Obtener misiones de un nivel específico
    // URL: http://localhost:8080/api/exercises/{id}
    @GetMapping("/exercises/{levelId}")
    public ResponseEntity<?> getExercisesByLevel(@PathVariable Integer levelId, Authentication authentication) {
        String usuarioId = authentication != null ? authentication.getName() : null;
        List<EjercicioDTO> ejercicios = ejercicioService.obtenerEjerciciosPorModulo(levelId, usuarioId);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exercises", ejercicios);
        respuesta.put("module", ejercicioService.obtenerMetadataModulo(levelId));
        return ResponseEntity.ok(respuesta);
    }

    // 3. ¡NUEVO! Obtener misiones para la Práctica Relámpago
    // URL: http://localhost:8080/api/practica-rapida
    @GetMapping("/practica-rapida")
    public ResponseEntity<?> getPracticaRapida(
            @RequestParam(defaultValue = "mixto") String nivel,
            @RequestParam(defaultValue = "6") Integer limite,
            Authentication authentication
    ) {
        String usuarioId = authentication != null ? authentication.getName() : null;
        List<EjercicioDTO> ejercicios = ejercicioService.obtenerEjerciciosPracticaRapida(nivel, limite != null ? limite : 6, usuarioId);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exercises", ejercicios);
        respuesta.put("nivel", nivel);
        return ResponseEntity.ok(respuesta);
    }

    // 4. Validar la respuesta del usuario (SQL, Drag&Drop o Diagrama)
    // URL: http://localhost:8080/api/exercises/{id}/validate
    @PostMapping("/exercises/{id}/validate")
    public ResponseEntity<?> validarEjercicio(@PathVariable Integer id, @RequestBody Map<String, String> request, Authentication authentication) {
        String queryUsuario = request.get("query");
        String usuarioId = authentication.getName();

        // El Service se encarga de decidir si es SQL o JSON de diagrama
        Map<String, Object> resultado = ejercicioService.validarConsulta(id, queryUsuario, usuarioId);

        return ResponseEntity.ok(resultado);
    }
}
