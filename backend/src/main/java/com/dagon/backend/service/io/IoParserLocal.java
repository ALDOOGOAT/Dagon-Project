package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.*;

/** Reconocimiento conservador: solamente patrones explícitos y cantidades con unidades. */
@Component
public class IoParserLocal {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String NUM = "([0-9]+(?:[.,][0-9]+)?)";
    static String normalizar(String texto) {
        return Normalizer.normalize(texto.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
    private static final Pattern INTEGRALIDAD = Pattern.compile(
            "\\b(?:enteros?|enteras?|binari[oa]s?|indivisibles?|unidades completas|piezas completas|numero entero)\\b"
            + "|\\b0 o 1\\b|\\bsi o no\\b|\\bse (?:acepta|elige|selecciona|toma|abre|instala)\\b[^.;?]{0,40}\\bo se (?:rechaza|descarta|omite|deja)\\b"
            + "|\\b(?:completo|completa) o se (?:rechaza|descarta)\\b");
    /** El enunciado exige variables enteras o de decisión 0/1: un modelo continuo daría un resultado distinto. */
    public static boolean exigeEnteros(String texto) {
        return INTEGRALIDAD.matcher(normalizar(texto)).find();
    }
    public IoInterpretacion interpretar(String enunciado) {
        String n = normalizar(enunciado);
        IoInterpretacion estructurado = modeloExplicito(enunciado, n);
        if (estructurado != null) return estructurado;
        if (Pattern.compile("[1-9][0-9]*[.,][0-9]{3}(?:\\D|$)|[0-9]+\\s*/\\s*[0-9]+").matcher(n).find())
            return IoInterpretacion.incompleto("Una cantidad tiene separador ambiguo o está escrita como fracción.", List.of("Aclara las cantidades en notación decimal sin separadores de miles; conserva sus unidades."));
        Set<String> monedas = new HashSet<>();
        Matcher moneda = Pattern.compile("\\b(pesos?|euros?|dolares?)\\b").matcher(n);
        while (moneda.find()) monedas.add(moneda.group(1).replaceFirst("s$", ""));
        if (monedas.size() > 1) return IoInterpretacion.incompleto("Hay monedas diferentes en el enunciado.", List.of("Expresa todos los costos y beneficios en la misma moneda o indica la conversión."));
        if (n.contains("mesa") && n.contains("silla")) return produccion(enunciado, n);
        if (n.contains("inventario") || n.contains("lote economico") || n.contains("eoq") || n.contains("demanda anual")) return inventario(enunciado, n);
        if (n.contains("llegan") || n.contains("cola") || n.contains("clientes por") || n.contains("lambda")) return colas(enunciado, n);
        IoInterpretacion explicito = modeloExplicito(enunciado, n);
        return explicito != null ? explicito : IoInterpretacion.noSoportado("No hay suficientes patrones explícitos para convertir este enunciado con el reconocimiento local.");
    }
    private IoInterpretacion produccion(String original, String n) {
        var preguntas = new ArrayList<String>();
        if (Pattern.compile("al menos|minimo|presupuesto|exactamente|demanda|obligatori|proporcion|porcentaje|por ciento|limite inferior").matcher(n).find())
            return IoInterpretacion.incompleto("Hay restricciones adicionales que necesitan modelado explícito.", List.of("Revisa los límites mínimos, proporciones y recursos adicionales; el parser local no los descarta."));
        Matcher listaProductos = Pattern.compile("produce(?:n)? ([^.]+)").matcher(n);
        if (listaProductos.find() && !listaProductos.group(1).matches("mesas? y sillas?|sillas? y mesas?"))
            return IoInterpretacion.incompleto("El reconocimiento local admite un par de productos.", List.of("Indica todas las variables y sus coeficientes; no se pueden ignorar otros productos."));
        boolean[] consumido = new boolean[n.length()];
        var datos = JSON.createObjectNode();
        double[] beneficios = new double[2];
        String[] productos = {"mesa", "silla"};
        for (int i = 0; i < 2; i++) {
            Matcher m = Pattern.compile("cada " + productos[i] + "\\b[^.;?]*?(?:ganancia|beneficio)(?: de)?\\s*" + NUM).matcher(n);
            boolean encontrado = m.find();
            if (!encontrado && i == 1) {
                m = Pattern.compile("ganancia[^.;?]*?y cada silla de\\s*" + NUM).matcher(n);
                encontrado = m.find();
            }
            if (!encontrado) preguntas.add("¿Cuál es la ganancia por cada " + productos[i] + "?");
            else { beneficios[i] = numero(m.group(1)); marcar(consumido, m.start(), m.end()); }
        }
        if (!n.contains("maximiz")) preguntas.add("¿El objetivo es maximizar la ganancia?");
        var restricciones = new ArrayList<String>();
        Matcher limites = Pattern.compile("(?:como maximo|a lo sumo|maximo)\\s+" + NUM + "\\s+(mesas?|sillas?)(?:\\s+y\\s+" + NUM + "\\s+(mesas?|sillas?))?").matcher(n);
        while (limites.find()) {
            marcar(consumido, limites.start(), limites.end());
            restricciones.add(variable(limites.group(2)) + "<=" + numero(limites.group(1)));
            if (limites.group(3) != null) restricciones.add(variable(limites.group(4)) + "<=" + numero(limites.group(3)));
        }
        Set<String> recursos = new LinkedHashSet<>();
        Matcher nombres = Pattern.compile("horas? de ([a-z]+)").matcher(n);
        while (nombres.find()) recursos.add(nombres.group(1));
        for (String recurso : recursos) {
            double[] coef = new double[2]; boolean[] tiene = new boolean[2];
            Matcher clausulas = Pattern.compile("cada (mesa|silla)\\b([^.;?]*?)(?=\\by cada\\b|[.;?]|$)").matcher(n);
            while (clausulas.find()) {
                int i = clausulas.group(1).equals("mesa") ? 0 : 1;
                Matcher uso = Pattern.compile(NUM + "\\s+horas?(?: de ([a-z]+))?").matcher(clausulas.group(2));
                while (uso.find()) {
                    if (recurso.equals(uso.group(2)) || (uso.group(2) == null && recursos.size() == 1)) {
                        coef[i] = numero(uso.group(1)); tiene[i] = true;
                        marcar(consumido, clausulas.start(2) + uso.start(), clausulas.start(2) + uso.end());
                    }
                }
            }
            Matcher disponible = Pattern.compile("(?:hay|dispone de|disponen de|disponibles?[: ]*)\\s*" + NUM + "\\s+horas? de " + recurso).matcher(n);
            if (!disponible.find()) { preguntas.add("¿Cuántas horas de " + recurso + " están disponibles?"); continue; }
            double rhs = numero(disponible.group(1));
            marcar(consumido, disponible.start(), disponible.end());
            if (!tiene[0] || !tiene[1]) preguntas.add("Indica las horas de " + recurso + " requeridas por cada producto (incluye 0 si no usa ese recurso).");
            else restricciones.add(coef[0] + "x1+" + coef[1] + "x2<=" + rhs);
        }
        if (restricciones.isEmpty()) preguntas.add("¿Qué recursos limitan la producción y cuánta disponibilidad tiene cada uno?");
        Matcher numeros = Pattern.compile(NUM).matcher(n);
        while (numeros.find()) if (!consumido[numeros.start()]) preguntas.add("Hay una cantidad sin interpretar: " + numeros.group() + ". Aclara la restricción correspondiente.");
        if (!preguntas.isEmpty()) return IoInterpretacion.incompleto("Modelo de producción de mesas y sillas incompleto.", preguntas);
        restricciones.add("x1,x2>=0");
        // Si el enunciado exige unidades completas se resuelve por branch & bound, nunca redondeando.
        boolean entero = exigeEnteros(original);
        if (entero) restricciones.add("x1,x2 enteras");
        datos.put("objetivo", "max z=" + beneficios[0] + "x1+" + beneficios[1] + "x2");
        datos.set("restricciones", JSON.valueToTree(restricciones));
        return listo("pl", entero ? "branch_bound" : "simplex", datos, List.of(variable("x1", "Cantidad de mesas", "mesas"), variable("x2", "Cantidad de sillas", "sillas")), original,
                List.of(entero ? "Las cantidades son enteras y no negativas; se resuelven por ramificación y acotamiento."
                        : "Las cantidades se tratan como continuas y no negativas. Si deben ser enteras, indícalo y se resolverá por branch & bound."));
    }
    private IoInterpretacion inventario(String original, String n) {
        if (n.matches("(?s).*(faltantes|descuentos|produccion|periodo fijo|punto de reorden).*")) {
            IoInterpretacion explicito = modeloExplicito(original, n);
            return explicito != null ? explicito : IoInterpretacion.incompleto("Se requiere precisar el modelo de inventario.", List.of("Indica el método y sus parámetros con la misma unidad temporal."));
        }
        Double d = buscar(n, "demanda anual(?: es| de| es de|:)?\\s*" + NUM);
        Double s = buscar(n, "costo (?:por|de cada|de realizar un) pedido(?: es| de| es de|:)?\\s*" + NUM);
        Double h = buscar(n, "costo (?:de mantener|de mantenimiento)[^.;]*?(?:al ano|anual)(?: es| de| es de|:)?\\s*" + NUM);
        if (h == null) h = buscar(n, "costo (?:de mantener|de mantenimiento)[^.;]*?" + NUM + "\\s*(?:pesos|euros|dolares)[^.;]*?(?:al ano|anual)");
        var preguntas = new ArrayList<String>();
        if (d == null) preguntas.add("¿Cuál es la demanda anual D en unidades por año?");
        if (s == null) preguntas.add("¿Cuál es el costo S por pedido?");
        if (h == null) preguntas.add("¿Cuál es el costo H de mantener una unidad por año?");
        if (!preguntas.isEmpty()) return IoInterpretacion.incompleto("Datos insuficientes para el lote económico EOQ.", preguntas);
        ObjectNode datos = JSON.createObjectNode().put("D", d).put("S", s).put("H", h);
        return listo("inventarios", "eoq", datos, List.of(variable("Q", "Cantidad por pedido", "unidades")), original,
                List.of("EOQ determinista: demanda constante, reposición instantánea y sin faltantes. D y H utilizan año como unidad temporal."));
    }
    private IoInterpretacion colas(String original, String n) {
        if (Pattern.compile("determinista|tiempo fijo|prioridad|capacidad limitada|cola finita|m/d/|m/g/").matcher(n).find())
            return IoInterpretacion.noSoportado("Los supuestos descritos no corresponden al modelo M/M/1 o M/M/s disponible.");
        boolean[] consumido = new boolean[n.length()];
        Matcher llegada = Pattern.compile("(?:llegan|llegadas? de|lambda\\s*=)\\s*" + NUM + "\\s*(?:clientes|personas|solicitudes)?\\s*(?:por|/)\\s*(hora|minuto|dia)").matcher(n);
        Matcher servicio = Pattern.compile("(?:se atienden|atiende|atienden|mu\\s*=)\\s*" + NUM + "\\s*(?:clientes|personas|solicitudes)?\\s*(?:por|/)\\s*(hora|minuto|dia)").matcher(n);
        if (!llegada.find() || !servicio.find()) return IoInterpretacion.incompleto("Faltan tasas para el sistema de espera.", List.of("Indica la tasa de llegadas λ y la tasa de servicio μ por servidor, con unidades temporales."));
        marcar(consumido, llegada.start(), llegada.end()); marcar(consumido, servicio.start(), servicio.end());
        if (!llegada.group(2).equals(servicio.group(2))) return IoInterpretacion.incompleto("Las tasas tienen unidades temporales distintas.", List.of("Expresa λ y μ usando la misma unidad temporal."));
        Matcher servidores = Pattern.compile("" + NUM + "\\s+servidores?\\b").matcher(n);
        boolean uno = n.contains("un servidor") || n.contains("un solo servidor") || n.contains("una ventanilla");
        boolean explicitos = servidores.find();
        if (explicitos) marcar(consumido, servidores.start(), servidores.end());
        double numeroServidores = explicitos ? numero(servidores.group(1)) : uno ? 1 : 0;
        if (numeroServidores != Math.rint(numeroServidores)) return IoInterpretacion.incompleto("El número de servidores no es entero.", List.of("Indica un número entero de servidores."));
        int cantidad = (int) numeroServidores;
        if (cantidad < 1) return IoInterpretacion.incompleto("Falta el número de servidores.", List.of("¿Cuántos servidores atienden y es μ la tasa individual de cada uno?"));
        Matcher restantes = Pattern.compile(NUM).matcher(n);
        while (restantes.find()) if (!consumido[restantes.start()]) return IoInterpretacion.incompleto("Hay cantidades o límites adicionales en la cola.", List.of("Aclara los costos, la capacidad y las tasas; no se descartan datos sin interpretar."));
        ObjectNode datos = JSON.createObjectNode().put("lambda", numero(llegada.group(1))).put("mu", numero(servicio.group(1)));
        if (cantidad != 1) datos.put("s", cantidad);
        return listo("colas", cantidad == 1 ? "mm1" : "mms", datos, List.of(variable("lambda", "Tasa de llegadas", "clientes/" + llegada.group(2)), variable("mu", "Tasa de servicio por servidor", "clientes/" + llegada.group(2))), original,
                List.of("Llegadas Poisson, servicios exponenciales independientes, cola ilimitada y disciplina FIFO (modelo M/M/s). μ debe ser la tasa de cada servidor."));
    }
    private IoInterpretacion modeloExplicito(String original, String n) {
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
    private static void marcar(boolean[] usados, int inicio, int fin) { Arrays.fill(usados, inicio, fin, true); }
    private static Map<String, String> variable(String simbolo, String nombre, String unidad) { return Map.of("simbolo", simbolo, "nombre", nombre, "unidad", unidad); }
    private static String variable(String nombre) { return nombre.startsWith("mesa") ? "x1" : "x2"; }
    private static double numero(String valor) { return Double.parseDouble(valor.replace(',', '.')); }
    private static Double buscar(String texto, String patron) { Matcher m = Pattern.compile(patron).matcher(texto); return m.find() ? numero(m.group(1)) : null; }
    private static IoInterpretacion listo(String tipo, String metodo, ObjectNode datos, List<Map<String, String>> variables, String evidencia, List<String> supuestos) {
        ObjectNode modelo = JSON.createObjectNode().put("tipo", tipo).put("metodo", metodo);
        modelo.set("variables", JSON.valueToTree(variables)); modelo.set("datos", datos);
        modelo.set("evidencias", JSON.valueToTree(List.of(Map.of("campo", "datos", "texto", evidencia))));
        return new IoInterpretacion("listo", "local", "Se identificó un modelo de " + tipo + ". Revisa sus datos y supuestos antes de resolver.", modelo, List.of(), List.of(), supuestos);
    }
}
