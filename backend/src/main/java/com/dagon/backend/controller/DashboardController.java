package com.dagon.backend.controller;

import com.dagon.backend.service.LeaderboardService;
import com.dagon.backend.service.ModuloService;
import com.dagon.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ModuloService moduloService;

    @Autowired
    private LeaderboardService leaderboardService;

    @GetMapping("/resumen")
    public ResponseEntity<?> obtenerResumen(@RequestParam(defaultValue = "sql") String materia, Authentication authentication) {
        String usuarioId = authentication.getName();

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("usuario", usuarioService.obtenerPerfilSeguro(usuarioId).orElse(null));
        resumen.put("stats", usuarioService.obtenerEstadisticasResumen(usuarioId));
        resumen.put("modulos", moduloService.obtenerModulosConEstado(usuarioId, materia));
        resumen.put("leaderboard", leaderboardService.obtenerRankingGlobal(5, materia));

        return ResponseEntity.ok(resumen);
    }
}
