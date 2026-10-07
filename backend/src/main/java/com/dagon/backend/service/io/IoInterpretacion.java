package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import com.fasterxml.jackson.databind.ObjectMapper;

/** El proveedor únicamente modela; ninguna respuesta matemática forma parte del contrato. */
public record IoInterpretacion(String estado, String fuente, String resumen, JsonNode modelo,
                              List<String> preguntas, List<String> advertencias, List<String> supuestos) {
    /** Jackson 3 del servidor recibe valores Java ordinarios, nunca nodos de Jackson 2. */
    public Map<String, Object> contratoHttp() {
        Map<String, Object> salida = new LinkedHashMap<>();
        salida.put("estado", estado); salida.put("fuente", fuente); salida.put("resumen", resumen);
        salida.put("modelo", modelo == null ? null : new ObjectMapper().convertValue(modelo, Map.class));
        salida.put("preguntas", preguntas); salida.put("advertencias", advertencias); salida.put("supuestos", supuestos);
        return salida;
    }
    public static IoInterpretacion incompleto(String resumen, List<String> preguntas) {
        return new IoInterpretacion("incompleto", "local", resumen, null, preguntas, List.of(), List.of());
    }
    public static IoInterpretacion noSoportado(String resumen) {
        return new IoInterpretacion("no_soportado", "local", resumen, null,
                List.of("Indica el objetivo, las variables, los coeficientes y sus unidades."), List.of(), List.of());
    }
}
