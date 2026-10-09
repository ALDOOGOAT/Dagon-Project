package com.dagon.backend.service.io.solver;

import java.util.List;
import java.util.Map;

/**
 * Solución determinista de un modelo IO. Solo tipos Java simples (Map, List, Double, Integer, String, Boolean, null):
 * Spring Boot 4 serializa con Jackson 3 y no admite nodos de Jackson 2 ni arreglos primitivos.
 * estado: optimo | infactible | no_acotado | aproximado | estacionario | calculado.
 */
public record IoSolucion(String tipo, String metodo, String estado, String resumen, List<Metrica> metricas,
                         List<Paso> pasos, Map<String, Object> resultado, List<String> advertencias) {
    public record Metrica(String etiqueta, Object valor, String unidad) {}
    public record Paso(String texto, Object tabla) {}
}
