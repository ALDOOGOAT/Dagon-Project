package com.dagon.backend.service.io.solver;

import com.dagon.backend.service.io.IoInterpretacionService;
import com.dagon.backend.service.io.IoModeloValidator;
import com.dagon.backend.service.io.IoParserLocal;
import com.dagon.backend.service.io.IoProveedorClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Contraste con los solvers JS del frontend (ya probados): resources/io/oraculo_io.json se generó resolviendo
 * cada modelo con frontend/src/lib/io/desdeEnunciado.js. El backend debe llegar a las mismas cifras.
 */
class IoOraculoCruzadoTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final IoInterpretacionService servicio = new IoInterpretacionService(new IoParserLocal(), mock(IoProveedorClient.class), new IoModeloValidator());

    @TestFactory
    Stream<DynamicTest> mismasCifrasQueElOraculo() throws Exception {
        JsonNode casos = JSON.readTree(getClass().getResourceAsStream("/io/oraculo_io.json"));
        List<DynamicTest> pruebas = new ArrayList<>();
        for (JsonNode caso : casos) pruebas.add(DynamicTest.dynamicTest(caso.path("nombre").asText(), () -> comprobar(caso)));
        return pruebas.stream();
    }

    private void comprobar(JsonNode caso) {
        String n = caso.path("nombre").asText() + " → ";
        var r = servicio.resolverModelo(caso.get("modelo"));
        if (caso.has("error")) {
            assertThat(r.solucion()).as(n + "debe rechazarse: " + caso.path("error").asText()).isNull();
            return;
        }
        assertThat(r.solucion()).as(n + "sin solución: " + r.errorSolucion() + " / " + r.interpretacion().preguntas()).isNotNull();
        String tipo = caso.path("modelo").path("tipo").asText();
        if (Set.of("pl", "cuadratica").contains(tipo)) assertThat(r.solucion().estado()).as(n + "estado").isEqualTo(caso.path("estado").asText());
        double tolerancia = Set.of("aproximado", "estacionario").contains(caso.path("estado").asText()) ? 1e-3 : 1e-6;
        caso.path("esperado").fields().forEachRemaining(e -> {
            Object real = ruta(r.solucion().resultado(), e.getKey());
            assertThat(real).as(n + e.getKey() + " en " + r.solucion().resultado().keySet()).isNotNull();
            if (e.getValue().isNumber()) {
                double esperado = e.getValue().asDouble(), valor = ((Number) real).doubleValue();
                assertThat(Math.abs(valor - esperado)).as(n + e.getKey() + ": " + valor + " vs " + esperado)
                        .isLessThanOrEqualTo(tolerancia * Math.max(1, Math.abs(esperado)));
            } else assertThat(String.valueOf(real)).as(e.getKey()).isEqualTo(e.getValue().asText());
        });
    }

    /** Navega "optimo.costo", "x.x1" o "historial.-1.0" (índice negativo = desde el final). */
    private static Object ruta(Object raiz, String camino) {
        Object actual = raiz;
        for (String parte : camino.split("\\.")) {
            if (actual instanceof Map<?, ?> m) actual = m.get(parte);
            else if (actual instanceof List<?> l && parte.matches("-?\\d+")) {
                int i = Integer.parseInt(parte);
                actual = l.get(i < 0 ? l.size() + i : i);
            } else return null;
        }
        return actual;
    }
}
