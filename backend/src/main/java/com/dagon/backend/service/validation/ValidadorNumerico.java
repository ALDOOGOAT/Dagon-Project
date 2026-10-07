package com.dagon.backend.service.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Validador de ejercicios de Investigación de Operaciones: el alumno responde un objeto JSON
 * {clave: valor} y se compara contra configuracion_extra.respuestas, sin ejecutar SQL.
 */
@Component
public class ValidadorNumerico implements ValidadorEjercicio {

    /** correcto = todos los campos esperados coinciden; campos = {clave -> coincide}. */
    public record Resultado(boolean correcto, Map<String, Boolean> campos) {
    }

    private static final double TOLERANCIA_ABS_DEFECTO = 0.01;
    private static final double TOLERANCIA_REL_DEFECTO = 0.001;
    private static final Pattern DECIMAL = Pattern.compile("[+-]?(\\d+([.,]\\d+)?|[.,]\\d+)");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public boolean soporta(TipoValidacionEjercicio tipo) {
        return tipo == TipoValidacionEjercicio.NUMERICO;
    }

    @Override
    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        String query = contexto.queryUsuario();
        boolean valido = false;
        if (query != null && !query.isBlank()) {
            try {
                JsonNode respuesta = MAPPER.readTree(query);
                valido = respuesta != null && respuesta.isObject() && respuesta.size() > 0;
            } catch (Exception ignored) {
                // JSON mal formado: se informa abajo
            }
        }
        if (valido) {
            return Optional.empty();
        }
        return Optional.of(RespuestasValidacion.error(
                "Completa los campos antes de validar.",
                contexto.ejercicio(),
                query,
                "La respuesta numérica debe ser un objeto JSON con al menos un campo."
        ));
    }

    /** Evaluación pura: no toca BD ni estado. Config o respuesta nulas nunca dan por correcto. */
    public static Resultado evaluar(JsonNode config, JsonNode respuesta) {
        Map<String, Boolean> campos = new LinkedHashMap<>();
        JsonNode esperadas = config != null ? config.get("respuestas") : null;
        if (esperadas == null || !esperadas.isObject() || esperadas.size() == 0) {
            return new Resultado(false, campos);
        }

        JsonNode tolerancia = config.path("tolerancia");
        double tolAbs = toleranciaSegura(tolerancia.path("abs").asDouble(TOLERANCIA_ABS_DEFECTO), TOLERANCIA_ABS_DEFECTO);
        double tolRel = toleranciaSegura(tolerancia.path("rel").asDouble(TOLERANCIA_REL_DEFECTO), TOLERANCIA_REL_DEFECTO);

        boolean todosOk = true;
        Iterator<Map.Entry<String, JsonNode>> it = esperadas.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> entrada = it.next();
            JsonNode dado = respuesta != null ? respuesta.get(entrada.getKey()) : null;
            boolean ok = coincide(entrada.getValue(), dado, tolAbs, tolRel);
            campos.put(entrada.getKey(), ok);
            todosOk &= ok;
        }
        return new Resultado(todosOk, campos);
    }

    private static double toleranciaSegura(double valor, double defecto) {
        return Double.isFinite(valor) && valor >= 0 ? valor : defecto;
    }

    private static boolean coincide(JsonNode esperado, JsonNode dado, double tolAbs, double tolRel) {
        if (dado == null || dado.isNull() || !dado.isValueNode()) {
            return false;
        }
        Double numEsperado = aNumero(esperado);
        if (esperado.isNumber() && numEsperado == null) return false;
        if (numEsperado != null) {
            Double numDado = aNumero(dado);
            return numDado != null
                    && Math.abs(numDado - numEsperado) <= Math.max(tolAbs, tolRel * Math.abs(numEsperado));
        }
        return normalizarTexto(esperado.asText()).equals(normalizarTexto(dado.asText()));
    }

    private static String normalizarTexto(String texto) {
        return texto.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    /** Número JSON, decimal con coma o punto ("2,5") o fracción ("3/4"); null si no lo es. */
    private static Double aNumero(JsonNode nodo) {
        if (nodo.isNumber()) {
            double valor = nodo.asDouble();
            return Double.isFinite(valor) ? valor : null;
        }
        if (!nodo.isTextual()) {
            return null;
        }
        String texto = nodo.asText().replaceAll("\\s+", "");
        int barra = texto.indexOf('/');
        if (barra < 0) {
            return decimal(texto);
        }
        Double num = decimal(texto.substring(0, barra));
        Double den = decimal(texto.substring(barra + 1));
        if (num == null || den == null || den == 0) return null;
        double valor = num / den;
        return Double.isFinite(valor) ? valor : null;
    }

    // Regex propia en vez de Double.parseDouble: este acepta "NaN", "Infinity" y exponentes.
    private static Double decimal(String texto) {
        if (!DECIMAL.matcher(texto).matches()) return null;
        double valor = Double.parseDouble(texto.replace(',', '.'));
        return Double.isFinite(valor) ? valor : null;
    }
}
