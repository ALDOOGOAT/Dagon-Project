package com.dagon.backend.controller;

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
                parseFecha(desde), parseFecha(hasta), idModulo, idCurso));
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
                parseFecha(desde), parseFecha(hasta), idModulo, idCurso));
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
                idModulo, idCurso, parseFecha(desde), parseFecha(hasta)));
    }

    @GetMapping("/abandono-modulos")
    public ResponseEntity<?> obtenerAbandonoModulos(
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {
        verificarRolDocente(authentication);
        return ResponseEntity.ok(docenteService.obtenerAbandonoModulos(idCurso));
    }

    @GetMapping("/tiempo-promedio")
    public ResponseEntity<?> obtenerTiempoPromedio(
            @RequestParam(required = false) Integer idCurso,
            Authentication authentication) {
        verificarRolDocente(authentication);
        return ResponseEntity.ok(docenteService.obtenerTiempoPromedioPorModulo(idCurso));
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
                alumnoId, idModulo, parseFecha(desde), parseFecha(hasta)));
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
                parseFecha(desde), parseFecha(hasta), idModulo, idCurso);
        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=progreso_dagon.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
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

    private LocalDate parseFecha(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        return LocalDate.parse(fecha, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
