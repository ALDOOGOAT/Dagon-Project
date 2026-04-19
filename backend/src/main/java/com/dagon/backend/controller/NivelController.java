package com.dagon.backend.controller;

import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.service.EjercicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // Permite que React se conecte
public class NivelController {

    @Autowired
    private EjercicioService ejercicioService;

    // 1. Obtener todos los niveles/módulos
    // URL: http://localhost:8080/api/levels
    @GetMapping("/levels")
    public ResponseEntity<?> getLevels() {
        List<NivelDTO> niveles = ejercicioService.obtenerTodosLosNiveles();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("levels", niveles);
        return ResponseEntity.ok(respuesta);
    }

    // 2. Obtener misiones de un nivel específico
    // URL: http://localhost:8080/api/exercises/{id}
    @GetMapping("/exercises/{levelId}")
    public ResponseEntity<?> getExercisesByLevel(@PathVariable Integer levelId) {
        List<EjercicioDTO> ejercicios = ejercicioService.obtenerEjerciciosPorModulo(levelId);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exercises", ejercicios);
        return ResponseEntity.ok(respuesta);
    }

    // 3. ¡NUEVO! Obtener misiones para la Práctica Relámpago
    // URL: http://localhost:8080/api/practica-rapida
    @GetMapping("/practica-rapida")
    public ResponseEntity<?> getPracticaRapida() {
        List<EjercicioDTO> ejercicios = ejercicioService.obtenerEjerciciosPracticaRapida();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exercises", ejercicios);
        return ResponseEntity.ok(respuesta);
    }

    // 4. Validar la respuesta del usuario (SQL, Drag&Drop o Diagrama)
    // URL: http://localhost:8080/api/exercises/{id}/validate
    @PostMapping("/exercises/{id}/validate")
    public ResponseEntity<?> validarEjercicio(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String queryUsuario = request.get("query");
        String usuarioId = request.get("usuarioId");

        // El Service se encarga de decidir si es SQL o JSON de diagrama
        Map<String, Object> resultado = ejercicioService.validarConsulta(id, queryUsuario, usuarioId);

        return ResponseEntity.ok(resultado);
    }
}