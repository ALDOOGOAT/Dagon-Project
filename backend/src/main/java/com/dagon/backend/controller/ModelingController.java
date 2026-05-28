package com.dagon.backend.controller;

import com.dagon.backend.service.ModelingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modeling")
public class ModelingController {

    private final ModelingService modelingService;

    public ModelingController(ModelingService modelingService) {
        this.modelingService = modelingService;
    }

    @PostMapping("/ddl-to-erd")
    public ResponseEntity<Map<String, Object>> ddlToErd(@RequestBody Map<String, Object> request) {
        String sql = String.valueOf(request.getOrDefault("sql", ""));
        return ResponseEntity.ok(modelingService.construirErdDesdeDdl(sql));
    }

    @PostMapping("/erd-to-ddl")
    public ResponseEntity<Map<String, Object>> erdToDdl(@RequestBody Map<String, Object> request) {
        List<Map<String, Object>> nodes = castList(request.get("nodes"));
        List<Map<String, Object>> edges = castList(request.get("edges"));
        String ddl = modelingService.generarDdlDesdeDiagrama(nodes, edges);
        return ResponseEntity.ok(Map.of("ddl", ddl));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }
}
