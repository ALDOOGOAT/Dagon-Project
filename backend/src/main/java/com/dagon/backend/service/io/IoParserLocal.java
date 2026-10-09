package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.*;

/**
 * Intérprete determinista (sin IA) de enunciados en español: reglas y matemáticas por tema, en clases IoParser*.
 * Conservador: no inventa coeficientes; cualquier cifra sin papel, unidades o monedas mezcladas, o una ambigüedad real,
 * devuelven "incompleto" con preguntas concretas. Un modelo "listo" siempre cita fragmentos literales del enunciado.
 */
@Component
public class IoParserLocal {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Pattern FRACCION = Pattern.compile("(?<![0-9])[0-9]++\\s*+/\\s*+[0-9]++");
    private static final Pattern MONEDA = Pattern.compile("\\b(pesos?|euros?|dolar(?:es)?|usd|mxn|eur)\\b|€");
    private static final Pattern NO_SOPORTADO = Pattern.compile("programacion dinamica|monte carlo|simulacion|algoritmo genetico|heuristic|programacion estocastica|redes neuronales");
    static String normalizar(String texto) {
        return Normalizer.normalize(texto.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
    public static boolean exigeBinarias(String texto) {
        return Pattern.compile("\\bbinari[oa]s?\\b|\\b0\\s*(?:o|/|-)\\s*1\\b|\\bsi\\s*(?:o|/)\\s*no\\b").matcher(normalizar(texto)).find();
    }
    public static boolean exigeEnteros(String texto) {
        String n = normalizar(texto);
        if (Pattern.compile("no\\s+(?:tienen?\\s+que|necesitan?|necesariamente|es\\s+necesario\\s+que)[^.]{0,25}\\benter").matcher(n).find()) return false;
        return exigeBinarias(texto) || Pattern.compile("\\b(?:enteros|enteras|unidades\\s+completas|numeros?\\s+enteros?)\\b").matcher(n).find();
    }
    public IoInterpretacion interpretar(String enunciado) {
        try { return analizar(enunciado); }
        catch (RuntimeException | StackOverflowError e) { return IoInterpretacion.noSoportado("No se pudo analizar el enunciado con el reconocimiento local."); }
    }
    private IoInterpretacion analizar(String enunciado) {
        if (enunciado == null || enunciado.isBlank()) return IoInterpretacion.noSoportado("El enunciado está vacío.");
        IoInterpretacion estructurado = modeloExplicito(enunciado);
        if (estructurado != null) return estructurado;
        IoParserTexto t = new IoParserTexto(enunciado);
        var dudosa = t.ambiguo();
        if (dudosa != null || FRACCION.matcher(t.n).find())
            return IoInterpretacion.incompleto("Una cantidad tiene separador ambiguo o está escrita como fracción.", List.of(dudosa != null
                    ? "La cifra «" + t.original.substring(dudosa.ini(), dudosa.fin()) + "» puede leerse como miles o como decimal: escríbela sin separador de miles (1200) o con punto decimal (1.2), conservando sus unidades."
                    : "Aclara las cantidades en notación decimal sin separadores de miles ni fracciones; conserva sus unidades."));
        Set<String> monedas = new HashSet<>();
        Matcher moneda = MONEDA.matcher(t.n);
        while (moneda.find()) { String m = moneda.group(); monedas.add(m.startsWith("peso") || m.equals("mxn") ? "peso" : m.startsWith("euro") || m.equals("eur") || m.equals("€") ? "euro" : "dolar"); }
        if (monedas.size() > 1) return IoInterpretacion.incompleto("Hay monedas diferentes en el enunciado.", List.of("Expresa todos los costos y beneficios en la misma moneda o indica la conversión."));
        if (NO_SOPORTADO.matcher(t.n).find()) return IoInterpretacion.noSoportado("El método descrito queda fuera de los modelos disponibles (PL, transporte, asignación, redes, inventarios, colas, Markov, decisiones, juegos y no lineal).");
        if (!t.hayCifras()) return IoInterpretacion.noSoportado("No hay suficientes patrones explícitos para convertir este enunciado con el reconocimiento local.");
        // De lo más específico a lo más general; cada intérprete devuelve null si el enunciado no es de su tema.
        List<java.util.function.Function<IoParserTexto, IoInterpretacion>> temas = List.of(
                IoParserEstocastico::markov, IoParserMatrices::juegos, IoParserMatrices::decisiones, IoParserRedes::proyecto, IoParserRedes::grafos,
                IoParserMatrices::asignacion, IoParserMatrices::transporte, IoParserEstocastico::inventarios, IoParserEstocastico::colas,
                IoParserFormulas::interpretar, IoParserProgramacionLineal::interpretar);
        for (var tema : temas) {
            IoInterpretacion r = tema.apply(t);
            if (r != null) return r;
        }
        return IoInterpretacion.noSoportado("No hay suficientes patrones explícitos para convertir este enunciado con el reconocimiento local.");
    }
    private IoInterpretacion modeloExplicito(String original) {
        // Datos estructurados opcionales junto al texto: no interpreta ni ejecuta fórmulas arbitrarias.
        int inicio = original.indexOf('{'), fin = original.lastIndexOf('}');
        if (inicio < 0 || fin <= inicio) return null;
        try {
            var modelo = JSON.readTree(original.substring(inicio, fin + 1));
            if (!modelo.isObject() || !modelo.has("tipo") || !modelo.has("metodo") || !modelo.has("datos")) return null;
            ObjectNode copia = ((ObjectNode) modelo).deepCopy();
            if (!copia.has("variables")) copia.set("variables", JSON.createArrayNode());
            copia.set("evidencias", JSON.valueToTree(List.of(Map.of("campo", "datos", "texto", original.substring(inicio, fin + 1)))));
            return new IoInterpretacion("listo", "local", "Modelo explícito extraído del enunciado.", copia, List.of(), List.of(), List.of());
        } catch (Exception ignored) { return null; }
    }
}
