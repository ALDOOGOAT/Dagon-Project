package com.dagon.backend.controller;

import com.dagon.backend.dto.DocenteDTO.*;
import com.dagon.backend.service.DocenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/docente")
public class DocenteController {

    @Autowired
    private DocenteService docenteService;

    @GetMapping("/resumen")
    public ResponseEntity<?> obtenerResumen(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerResumen(
                authentication.getName(),
                esAdmin(authentication),
                parseFecha(desde),
                parseFecha(hasta),
                idModulo,
                idCurso
        ));
    }

    @GetMapping("/tablero")
    public ResponseEntity<?> obtenerTablero(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerTablero(
                authentication.getName(),
                esAdmin(authentication),
                parseFecha(desde),
                parseFecha(hasta),
                idModulo,
                idCurso
        ));
    }

    @GetMapping("/alumnos")
    public ResponseEntity<?> obtenerAlumnos(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerProgresoAlumnos(
                authentication.getName(),
                esAdmin(authentication),
                parseFecha(desde),
                parseFecha(hasta),
                idModulo,
                idCurso
        ));
    }

    @GetMapping("/ejercicios-fallados")
    public ResponseEntity<?> obtenerEjerciciosFallados(
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) Integer idCurso,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerEjerciciosFallados(
                authentication.getName(),
                esAdmin(authentication),
                idModulo,
                idCurso,
                parseFecha(desde),
                parseFecha(hasta)
        ));
    }

    @GetMapping("/abandono-modulos")
    public ResponseEntity<?> obtenerAbandonoModulos(
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerAbandonoModulos(
                authentication.getName(),
                esAdmin(authentication),
                idCurso
        ));
    }

    @GetMapping("/tiempo-promedio")
    public ResponseEntity<?> obtenerTiempoPromedio(
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerTiempoPromedioPorModulo(
                authentication.getName(),
                esAdmin(authentication),
                idCurso
        ));
    }

    @GetMapping("/calificaciones")
    public ResponseEntity<?> obtenerCalificaciones(
            @RequestParam(required = false) Integer idCurso,
            @RequestParam(required = false) Integer idModulo,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerCalificaciones(
                authentication.getName(),
                esAdmin(authentication),
                idCurso,
                idModulo
        ));
    }

    @GetMapping("/calificaciones/resumen")
    public ResponseEntity<?> obtenerResumenCalificaciones(
            @RequestParam(required = false) Integer idCurso,
            @RequestParam(required = false) Integer idModulo,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerResumenCalificaciones(
                authentication.getName(),
                esAdmin(authentication),
                idCurso,
                idModulo
        ));
    }

    @GetMapping("/calificaciones/ejercicios")
    public ResponseEntity<?> obtenerCalificacionesEjercicios(
            @RequestParam(required = false) Integer idCurso,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) String alumnoId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerCalificacionesEjercicios(
                authentication.getName(),
                esAdmin(authentication),
                idCurso,
                idModulo,
                alumnoId,
                page,
                size
        ));
    }

    @GetMapping("/intentos/{alumnoId}")
    public ResponseEntity<?> obtenerIntentosAlumno(
            @PathVariable String alumnoId,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerIntentosAlumno(
                authentication.getName(),
                esAdmin(authentication),
                alumnoId,
                idModulo,
                parseFecha(desde),
                parseFecha(hasta)
        ));
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCSV(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) Integer idModulo,
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {

        verificarRolDocente(authentication);

        String csv = docenteService.exportarCSV(
                authentication.getName(),
                esAdmin(authentication),
                parseFecha(desde),
                parseFecha(hasta),
                idModulo,
                idCurso
        );

        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=progreso_dagon.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @GetMapping("/grupos")
    public ResponseEntity<?> listarGrupos(Authentication authentication) {
        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.listarGrupos(
                authentication.getName(),
                esAdmin(authentication)
        ));
    }

    @PostMapping("/grupos")
    public ResponseEntity<?> crearGrupo(
            @RequestBody CrearGrupoRequest request,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.crearGrupo(
                authentication.getName(),
                request
        ));
    }

    @GetMapping("/grupos/{idGrupo}/alumnos")
    public ResponseEntity<?> listarAlumnosGrupo(
            @PathVariable Long idGrupo,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.listarAlumnosGrupo(
                authentication.getName(),
                esAdmin(authentication),
                idGrupo
        ));
    }

    @PostMapping("/grupos/{idGrupo}/alumnos")
    public ResponseEntity<?> agregarAlumnoGrupo(
            @PathVariable Long idGrupo,
            @RequestBody AgregarAlumnoRequest request,
            Authentication authentication) {

        verificarRolDocente(authentication);

        docenteService.agregarAlumnoGrupo(
                authentication.getName(),
                esAdmin(authentication),
                idGrupo,
                request.idAlumno(),
                request.emailAlumno()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alumno agregado al grupo"
        ));
    }

    @DeleteMapping("/grupos/{idGrupo}/alumnos/{alumnoId}")
    public ResponseEntity<?> quitarAlumnoGrupo(
            @PathVariable Long idGrupo,
            @PathVariable String alumnoId,
            Authentication authentication) {

        verificarRolDocente(authentication);

        docenteService.quitarAlumnoGrupo(
                authentication.getName(),
                esAdmin(authentication),
                idGrupo,
                alumnoId
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Alumno removido del grupo"
        ));
    }

    @PostMapping("/evaluaciones")
    public ResponseEntity<?> guardarEvaluacion(
            @RequestBody CrearEvaluacionRequest request,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.guardarEvaluacion(
                authentication.getName(),
                esAdmin(authentication),
                request
        ));
    }

    @GetMapping("/evaluaciones/{alumnoId}")
    public ResponseEntity<?> obtenerEvaluacionesAlumno(
            @PathVariable String alumnoId,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.obtenerEvaluacionesAlumno(
                authentication.getName(),
                esAdmin(authentication),
                alumnoId
        ));
    }

    @GetMapping("/ejercicios")
    public ResponseEntity<?> listarEjerciciosDocente(Authentication authentication) {
        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.listarEjerciciosDocente(
                authentication.getName(),
                esAdmin(authentication)
        ));
    }

    @PostMapping("/ejercicios")
    public ResponseEntity<?> crearEjercicioDocente(
            @RequestBody CrearEjercicioDocenteRequest request,
            Authentication authentication) {

        verificarRolDocente(authentication);

        return ResponseEntity.ok(docenteService.crearEjercicioDocente(
                authentication.getName(),
                esAdmin(authentication),
                request
        ));
    }
    private void verificarRolDocente(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Autenticacion requerida");
        }

        boolean esDocente = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_DOCENTE") || a.equals("ROLE_ADMIN"));

        if (!esDocente) {
            throw new AccessDeniedException("Solo docentes y administradores pueden acceder al panel docente");
        }
    }

    private boolean esAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private LocalDate parseFecha(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        return LocalDate.parse(fecha, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
