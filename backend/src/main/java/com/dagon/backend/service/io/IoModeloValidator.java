package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.regex.Pattern;

/** Contrato cerrado: limita tamaño/dimensiones, elimina claves ajenas y rechaza modelos no ejecutables. */
@Component
public class IoModeloValidator {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Map<String, Set<String>> METODOS = Map.ofEntries(
            Map.entry("pl", Set.of("simplex", "branch_bound")), Map.entry("cuadratica", Set.of("kkt")),
            Map.entry("transporte", Set.of("vogel", "noroeste", "costo_minimo")),
            Map.entry("asignacion", Set.of("hungaro")), Map.entry("redes", Set.of("cpm", "pert")),
            Map.entry("grafos", Set.of("ruta_corta", "arbol_minimo", "flujo_maximo")),
            Map.entry("inventarios", Set.of("eoq", "faltantes", "epq", "descuentos", "reorden", "periodo_fijo")),
            Map.entry("colas", Set.of("mm1", "mms")), Map.entry("markov", Set.of("discreto")),
            Map.entry("noLineal", Set.of("dorada", "newton", "lagrange", "multivariable")),
            Map.entry("decisiones", Set.of("incertidumbre", "riesgo")), Map.entry("juegos", Set.of("suma_cero")));
    private static final Map<String, Set<String>> CLAVES = Map.ofEntries(
            Map.entry("pl", Set.of("objetivo", "restricciones", "enteras", "binarias")), Map.entry("cuadratica", Set.of("objetivo", "restricciones")),
            Map.entry("transporte", Set.of("costos", "oferta", "demanda")),
            Map.entry("asignacion", Set.of("matriz", "objetivo")), Map.entry("redes", Set.of("actividades", "plazo")),
            Map.entry("grafos", Set.of("aristas", "origen", "destino", "dirigido")),
            Map.entry("inventarios", Set.of("D", "S", "H", "p", "P", "i", "tramos", "d", "L", "sigma", "z", "T", "inventario")),
            Map.entry("colas", Set.of("lambda", "mu", "s", "cs", "cw")), Map.entry("markov", Set.of("P", "inicial", "n")),
            Map.entry("noLineal", Set.of("f", "g", "c", "a", "b", "x0", "objetivo")),
            Map.entry("decisiones", Set.of("pagos", "objetivo", "alternativas", "estados", "probabilidades", "alfa")),
            Map.entry("juegos", Set.of("pagos", "filas", "columnas")));
    // "x1, x2 enteras" / "y1 binaria" / "y1,y2 ∈ {0,1}": declaraciones de integralidad dentro de las restricciones.
    static final Pattern DECLARACION = Pattern.compile("(?i)^\\s*([A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*)\\s+(?:son\\s+)?(enter[oa]s?|int|integer|binari[oa]s?|bin|∈\\s*\\{\\s*0\\s*,\\s*1\\s*\\})\\s*$");
    private static final Pattern NO_NEGATIVIDAD = Pattern.compile("[A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*\\s*>=\\s*0");
    private static final Set<String> FUNCIONES = Set.of("sin", "cos", "tan", "exp", "log", "sqrt", "abs", "pi", "e");
    private static final int MAX_ARISTAS = 80;

    public IoInterpretacion desdeProveedor(JsonNode respuesta, String fuente, String enunciado) {
        if (respuesta == null || !respuesta.isObject()) throw new IllegalArgumentException("Respuesta inválida");
        String estado = respuesta.path("estado").asText();
        if (!Set.of("listo", "incompleto", "no_soportado").contains(estado)) throw new IllegalArgumentException("Estado inválido");
        return validar(new IoInterpretacion(estado, fuente, texto(respuesta.path("resumen"), 500), respuesta.get("modelo"),
                textos(respuesta.path("preguntas")), textos(respuesta.path("advertencias")), textos(respuesta.path("supuestos"))), enunciado);
    }
    public IoInterpretacion validar(IoInterpretacion respuesta, String enunciado) {
        if (!"listo".equals(respuesta.estado())) return new IoInterpretacion(respuesta.estado(), respuesta.fuente(), respuesta.resumen(), null,
                respuesta.preguntas().isEmpty() ? List.of("Aclara los datos y las unidades que faltan.") : respuesta.preguntas(), respuesta.advertencias(), respuesta.supuestos());
        try {
            JsonNode raw = respuesta.modelo();
            exigir(raw != null && raw.isObject(), "Falta el modelo matemático.");
            limitar(raw, 0);
            String tipo = raw.path("tipo").asText(), metodo = raw.path("metodo").asText();
            exigir(METODOS.containsKey(tipo) && METODOS.get(tipo).contains(metodo), "Ese tipo o método todavía no está soportado.");
            JsonNode datos = raw.path("datos"); exigir(datos.isObject(), "Faltan los datos del modelo.");
            ObjectNode seguros = JSON.createObjectNode();
            for (String clave : claves(tipo, metodo)) if (datos.has(clave) && !datos.get(clave).isNull()) seguros.set(clave, datos.get(clave));
            if (tipo.equals("colas") && metodo.equals("mm1") && datos.has("s") && !datos.path("s").isNull()) exigir(datos.path("s").asDouble() == 1, "M/M/1 requiere un solo servidor.");
            if (tipo.equals("redes") && seguros.path("actividades").isArray()) seguros.set("actividades", soloClaves(seguros.path("actividades"), metodo.equals("cpm") ? List.of("id", "predecesoras", "duracion") : List.of("id", "predecesoras", "a", "m", "b")));
            if (tipo.equals("inventarios") && seguros.path("tramos").isArray()) seguros.set("tramos", soloClaves(seguros.path("tramos"), List.of("min", "precio")));
            if (tipo.equals("grafos") && seguros.path("aristas").isArray()) seguros.set("aristas", soloClaves(seguros.path("aristas"), List.of("origen", "destino", "valor")));
            Set<String> simbolosModelo = switch (tipo) {
                case "pl" -> pl(seguros, metodo);
                case "cuadratica" -> cuadratica(seguros);
                case "transporte" -> { transporte(seguros); yield Set.of(); }
                case "asignacion" -> { matriz(seguros.path("matriz"), false); exigir(Set.of("min", "max").contains(seguros.path("objetivo").asText()), "Define si se minimiza o maximiza la asignación."); yield Set.of(); }
                case "redes" -> { redes(seguros, metodo); yield Set.of(); }
                case "grafos" -> { grafos(seguros, metodo); yield Set.of(); }
                case "inventarios" -> { inventarios(seguros, metodo); yield Set.of(); }
                case "colas" -> { colas(seguros, metodo); yield Set.of(); }
                case "markov" -> { markov(seguros); yield Set.of(); }
                case "noLineal" -> { noLineal(seguros, metodo); yield Set.of(); }
                case "decisiones" -> { decisiones(seguros, metodo); yield Set.of(); }
                case "juegos" -> { tablaPagos(seguros, "filas", "columnas"); yield Set.of(); }
                default -> throw new IllegalArgumentException("Modelo no soportado.");
            };
            var variables = JSON.createArrayNode();
            JsonNode vars = raw.path("variables"); exigir(vars.isArray() && vars.size() <= 10, "Indica las variables del modelo (máximo 10).");
            Set<String> simbolos = new HashSet<>();
            boolean conFormulas = Set.of("pl", "cuadratica").contains(tipo);
            for (JsonNode v : vars) {
                String simbolo = texto(v.path("simbolo"), 30);
                boolean valido = simbolo.matches("[A-Za-z][A-Za-z0-9_]{0,29}") && !simbolos.contains(simbolo) && !Set.of("constructor", "prototype", "__proto__").contains(simbolo);
                // Fuera de PL/cuadrática el símbolo solo describe la decisión: uno inválido se omite.
                if (!valido && !conFormulas) continue;
                exigir(valido, "Hay símbolos de variables inválidos o duplicados.");
                simbolos.add(simbolo);
                ObjectNode variable = JSON.createObjectNode().put("simbolo", simbolo).put("nombre", texto(v.path("nombre"), 100));
                if (v.has("unidad") && !v.get("unidad").isNull()) variable.put("unidad", texto(v.path("unidad"), 80));
                variables.add(variable);
            }
            if (Set.of("pl", "cuadratica").contains(tipo) && !simbolos.isEmpty()) exigir(simbolosModelo.equals(simbolos), "Las variables declaradas deben coincidir con las fórmulas.");
            var evidencias = JSON.createArrayNode();
            JsonNode citas = raw.path("evidencias"); exigir(citas.isArray() && citas.size() > 0 && citas.size() <= 16, "Faltan las citas del enunciado que sustentan el modelo.");
            boolean citaOmitida = false;
            for (JsonNode cita : citas) {
                String fragmento = texto(cita.path("texto"), 12000), campo = texto(cita.path("campo"), 100);
                boolean literal = !fragmento.isBlank() && normalizarCita(enunciado).contains(normalizarCita(fragmento));
                // Una cita con cifras debe ser literal (protege contra datos inventados); una paráfrasis sin cifras se omite.
                if (!literal && !fragmento.matches("(?s).*\\d.*")) { citaOmitida = true; continue; }
                exigir(literal, "Una evidencia no aparece literalmente en el enunciado.");
                exigir(campo.equals("datos") || campo.startsWith("datos.") || campo.equals("variables") || campo.equals("tipo") || campo.equals("metodo") || campo.equals("objetivo"), "El campo de evidencia no corresponde al modelo.");
                evidencias.add(JSON.createObjectNode().put("campo", campo).put("texto", fragmento));
            }
            exigir(!evidencias.isEmpty(), "Faltan las citas del enunciado que sustentan el modelo.");
            ObjectNode modelo = JSON.createObjectNode().put("tipo", tipo).put("metodo", metodo);
            modelo.set("datos", seguros); modelo.set("variables", variables); modelo.set("evidencias", evidencias);
            var advertencias = new ArrayList<>(respuesta.advertencias());
            if (citaOmitida) advertencias.add("Se omitió una cita parafraseada; revisa que el modelo corresponda al enunciado.");
            if (tipo.equals("pl") && !metodo.equals("branch_bound")) advertencias.add("Se resuelve un modelo continuo. Si las cantidades deben ser enteras, decláralas como enteras: se resolverá por branch & bound, sin redondear.");
            if (tipo.equals("noLineal")) advertencias.add("El resultado puede ser local y depende del intervalo/punto inicial; revisa dominio y supuestos.");
            return new IoInterpretacion("listo", respuesta.fuente(), respuesta.resumen(), modelo, List.of(), advertencias, respuesta.supuestos());
        } catch (IllegalArgumentException e) {
            return new IoInterpretacion("incompleto", respuesta.fuente(), "El modelo extraído necesita revisión.", null, List.of(e.getMessage()), respuesta.advertencias(), respuesta.supuestos());
        }
    }
    private static Set<String> claves(String tipo, String metodo) {
        if (tipo.equals("inventarios")) return switch (metodo) {
            case "eoq" -> Set.of("D", "S", "H"); case "faltantes" -> Set.of("D", "S", "H", "p");
            case "epq" -> Set.of("D", "S", "H", "P"); case "descuentos" -> Set.of("D", "S", "i", "tramos");
            case "reorden" -> Set.of("d", "L", "sigma", "z"); default -> Set.of("d", "T", "L", "sigma", "z", "inventario"); };
        if (tipo.equals("colas")) return metodo.equals("mm1") ? Set.of("lambda", "mu", "cs", "cw") : Set.of("lambda", "mu", "s", "cs", "cw");
        if (tipo.equals("redes")) return metodo.equals("cpm") ? Set.of("actividades") : Set.of("actividades", "plazo");
        if (tipo.equals("noLineal")) return switch (metodo) {
            case "dorada" -> Set.of("f", "a", "b", "objetivo"); case "newton" -> Set.of("f", "x0", "a", "b");
            case "multivariable" -> Set.of("f", "simbolos", "inicio", "objetivo"); default -> Set.of("f", "g", "c"); };
        if (tipo.equals("grafos")) return metodo.equals("arbol_minimo") ? Set.of("aristas") : Set.of("aristas", "origen", "destino", "dirigido");
        if (tipo.equals("decisiones")) return metodo.equals("riesgo") ? Set.of("pagos", "objetivo", "alternativas", "estados", "probabilidades") : Set.of("pagos", "objetivo", "alternativas", "estados", "alfa");
        return CLAVES.get(tipo);
    }
    private static com.fasterxml.jackson.databind.node.ArrayNode soloClaves(JsonNode lista, List<String> permitidas) {
        var limpia = JSON.createArrayNode();
        for (JsonNode item : lista) { ObjectNode o = JSON.createObjectNode(); for (String k : permitidas) if (item.has(k) && !item.get(k).isNull()) o.set(k, item.get(k)); limpia.add(o); }
        return limpia;
    }
    /** Objetivo y restricciones lineales; devuelve los símbolos usados. Las declaraciones enteras/binarias cuentan como variables. */
    private static Set<String> pl(ObjectNode d, String metodo) {
        Set<String> usados = new HashSet<>();
        String objetivo = cabecera(d);
        var forma = IoExpresionLineal.parsear(objetivo);
        exigir(Math.abs(forma.constante()) < 1e-9 && !forma.coeficientes().isEmpty(), "El objetivo PL debe incluir variables y no contener un término constante.");
        usados.addAll(forma.coeficientes().keySet());
        Set<String> noNegativas = new HashSet<>();
        Set<String> declaradas = restriccionesLineales(d, usados, noNegativas);
        int enteras = listaVariables(d, "enteras", usados) + listaVariables(d, "binarias", usados) + declaradas.size();
        if (metodo.equals("branch_bound")) exigir(enteras > 0, "Branch & bound requiere declarar variables enteras o binarias.");
        exigir(!noNegativas.isEmpty() || enteras > 0, "Declara explícitamente variables no negativas: x1,x2>=0 (máximo 10).");
        exigir(usados.size() <= 10, "La programación lineal admite hasta 10 variables.");
        return usados;
    }
    private static Set<String> cuadratica(ObjectNode d) {
        String objetivo = cabecera(d);
        exigir(objetivo.matches("[A-Za-z0-9_+*/^().,\\s-]+"), "El objetivo contiene operadores no permitidos.");
        // Guarda ligera de grado: exponentes 1 o 2 y sin funciones; el solver comprueba el grado exacto.
        exigir(!Pattern.compile("\\^\\s*\\(?\\s*(?![12](?![0-9.]))").matcher(objetivo).find(), "La programación cuadrática admite exponentes 1 o 2.");
        Set<String> usados = new HashSet<>();
        var m = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*").matcher(objetivo.replaceAll("(?<=[0-9])(?=[A-Za-z])", " "));
        while (m.find()) { exigir(!FUNCIONES.contains(m.group()) || Set.of("pi", "e").contains(m.group()), "La programación cuadrática no admite funciones como " + m.group() + "."); if (!FUNCIONES.contains(m.group())) usados.add(m.group()); }
        exigir(!usados.isEmpty(), "El objetivo debe contener variables.");
        numerosEnFormula(objetivo);
        restriccionesLineales(d, usados, new HashSet<>());
        exigir(usados.size() <= 6, "La programación cuadrática admite hasta 6 variables.");
        return usados;
    }
    private static String cabecera(JsonNode d) {
        String objetivo = texto(d.path("objetivo"), 500);
        exigir(objetivo.matches("(?i)^(max|min)\\s+(?:z\\s*=\\s*)?.+"), "El objetivo debe comenzar por max o min.");
        return objetivo.replaceFirst("(?i)^(max|min)\\s+(?:z\\s*=\\s*)?", "");
    }
    /** Valida restricciones lineales y agrega sus símbolos; devuelve las variables declaradas enteras/binarias. */
    private static Set<String> restriccionesLineales(JsonNode d, Set<String> usados, Set<String> noNegativas) {
        JsonNode r = d.path("restricciones"); exigir(r.isArray() && r.size() > 0 && r.size() <= 30, "Indica de 1 a 30 restricciones.");
        Set<String> declaradas = new HashSet<>();
        for (JsonNode restriccion : r) {
            String expresion = texto(restriccion, 500).replace("≤", "<=").replace("≥", ">=");
            var declaracion = DECLARACION.matcher(expresion);
            if (declaracion.matches()) {
                for (String v : declaracion.group(1).split(",")) { declaradas.add(v.trim()); usados.add(v.trim()); }
                continue;
            }
            exigir(expresion.matches(".+(?:<=|>=|=).+"), "Una restricción no tiene relación <=, >= o =.");
            if (NO_NEGATIVIDAD.matcher(expresion).matches()) {
                for (String v : expresion.split(">=")[0].split(",")) { usados.add(v.trim()); noNegativas.add(v.trim()); }
            } else { for (String lado : expresion.split("<=|>=|=", -1)) usados.addAll(IoExpresionLineal.parsear(lado).coeficientes().keySet()); }
        }
        return declaradas;
    }
    private static int listaVariables(JsonNode d, String clave, Set<String> usados) {
        if (!d.has(clave)) return 0;
        JsonNode lista = d.get(clave); exigir(lista.isArray() && lista.size() <= 10, "La lista de variables " + clave + " no es válida.");
        for (JsonNode v : lista) exigir(v.isTextual() && usados.contains(v.asText()), "Una variable " + clave + " no aparece en las fórmulas.");
        return lista.size();
    }
    private static void numerosEnFormula(String f) {
        var m = Pattern.compile("(?<![A-Za-z0-9_])(?:[0-9]+(?:\\.[0-9]+)?)(?:[eE][+-]?[0-9]+)?").matcher(f);
        while (m.find()) exigir(Double.isFinite(Double.parseDouble(m.group())) && Math.abs(Double.parseDouble(m.group())) <= 1e12, "Un coeficiente excede el límite numérico.");
    }
    private static void transporte(JsonNode d) {
        matriz(d.path("costos"), true); exigir(d.path("costos").size() <= 12 && d.path("costos").get(0).size() <= 12, "Transporte admite hasta 12 orígenes y destinos."); vector(d.path("oferta"), true); vector(d.path("demanda"), true);
        exigir(d.path("costos").size() == d.path("oferta").size() && d.path("costos").get(0).size() == d.path("demanda").size(), "Las dimensiones de costos, oferta y demanda no coinciden.");
    }
    private static void matriz(JsonNode m, boolean noNegativa) {
        exigir(m.isArray() && m.size() > 0 && m.size() <= 20, "La matriz debe tener de 1 a 20 filas.");
        int ancho = m.get(0).size(); exigir(ancho > 0 && ancho <= 20, "La matriz debe tener de 1 a 20 columnas.");
        for (JsonNode fila : m) { vector(fila, noNegativa); exigir(fila.size() == ancho, "La matriz debe ser rectangular."); }
    }
    private static void vector(JsonNode v, boolean noNegativo) {
        exigir(v.isArray() && v.size() > 0 && v.size() <= 30, "Falta un vector numérico o excede 30 elementos.");
        for (JsonNode n : v) numero(n, noNegativo ? 0 : -1e12, false);
    }
    private static void nombres(JsonNode lista, int n) {
        exigir(lista.isArray() && lista.size() == n, "Indica un nombre por fila/columna de la tabla.");
        for (JsonNode x : lista) texto(x, 60);
    }
    private static void redes(JsonNode d, String metodo) {
        JsonNode a = d.path("actividades"); exigir(a.isArray() && a.size() > 0 && a.size() <= 50, "Indica de 1 a 50 actividades.");
        Set<String> ids = new HashSet<>(); Map<String, List<String>> aristas = new HashMap<>();
        for (JsonNode actividad : a) {
            String id = texto(actividad.path("id"), 30); exigir(id.matches("[A-Za-z0-9_-]+") && ids.add(id), "Los IDs de actividades deben ser únicos.");
            JsonNode p = actividad.path("predecesoras"); exigir(p.isArray() && p.size() <= 50, "Indica las predecesoras de cada actividad (lista vacía si no tiene).");
            List<String> pred = new ArrayList<>(); for (JsonNode x : p) pred.add(texto(x, 30)); aristas.put(id, pred);
            exigir(new HashSet<>(pred).size() == pred.size() && !pred.contains(id), "Las predecesoras no pueden repetirse ni contener la propia actividad.");
            if (metodo.equals("cpm")) numero(actividad.path("duracion"), 0, false);
            else { double min = numero(actividad.path("a"), 0, false), medio = numero(actividad.path("m"), 0, false), max = numero(actividad.path("b"), 0, false); exigir(min <= medio && medio <= max, "PERT requiere a <= m <= b."); }
        }
        Set<String> completadas = new HashSet<>();
        for (int k = 0; k < a.size(); k++) for (String id : ids) if (completadas.containsAll(aristas.get(id))) completadas.add(id);
        exigir(completadas.size() == ids.size(), "La red tiene ciclos o predecesoras inexistentes.");
        if (d.has("plazo")) numero(d.get("plazo"), 0, false);
    }
    private static void grafos(JsonNode d, String metodo) {
        JsonNode aristas = d.path("aristas"); exigir(aristas.isArray() && aristas.size() > 0 && aristas.size() <= MAX_ARISTAS, "Indica de 1 a " + MAX_ARISTAS + " aristas.");
        Set<String> nodos = new HashSet<>();
        for (JsonNode a : aristas) {
            String o = texto(a.path("origen"), 30), t = texto(a.path("destino"), 30);
            exigir(!o.isBlank() && !t.isBlank() && !o.equals(t), "Cada arista une dos nodos distintos.");
            numero(a.path("valor"), metodo.equals("arbol_minimo") ? -1e12 : 0, false);
            nodos.add(o); nodos.add(t);
        }
        if (!metodo.equals("arbol_minimo")) {
            exigir(nodos.contains(texto(d.path("origen"), 30)) && nodos.contains(texto(d.path("destino"), 30)), "El origen y el destino deben ser nodos de la red.");
        }
        if (d.has("dirigido")) exigir(d.get("dirigido").isBoolean(), "Indica si la red es dirigida.");
    }
    private static void inventarios(JsonNode d, String metodo) {
        if (Set.of("eoq", "faltantes", "epq").contains(metodo)) for (String k : List.of("D", "S", "H")) numero(d.path(k), 0, true);
        if (metodo.equals("faltantes")) numero(d.path("p"), 0, true);
        if (metodo.equals("epq")) exigir(numero(d.path("P"), 0, true) > d.path("D").asDouble(), "P debe ser mayor que D y compartir unidad temporal.");
        if (metodo.equals("descuentos")) {
            for (String k : List.of("D", "S", "i")) numero(d.path(k), 0, true);
            JsonNode tramos = d.path("tramos"); exigir(tramos.isArray() && tramos.size() > 0 && tramos.size() <= 20, "Indica los tramos de descuento.");
            double anterior = -1, precioAnterior = Double.MAX_VALUE;
            for (JsonNode t : tramos) { double min = numero(t.path("min"), 0, false), precio = numero(t.path("precio"), 0, true); exigir(min > anterior && precio <= precioAnterior, "Los tramos deben tener mínimos crecientes y precios no crecientes."); anterior = min; precioAnterior = precio; }
        }
        if (Set.of("reorden", "periodo_fijo").contains(metodo)) {
            for (String k : List.of("d", "L", "sigma", "z")) numero(d.path(k), 0, false);
            if (metodo.equals("periodo_fijo")) { numero(d.path("T"), 0, true); numero(d.path("inventario"), -1e12, false); }
        }
    }
    private static void colas(JsonNode d, String metodo) {
        double l = numero(d.path("lambda"), 0, true), m = numero(d.path("mu"), 0, true);
        int s = metodo.equals("mm1") ? 1 : entero(d.path("s"), 1, 100);
        exigir(l < s * m, "La cola no es estable: λ debe ser menor que s·μ. No existe solución estacionaria finita.");
        exigir(d.has("cs") == d.has("cw"), "Indica ambos costos cs y cw para calcular el costo total.");
        for (String k : List.of("cs", "cw")) if (d.has(k)) numero(d.get(k), 0, false);
    }
    private static void markov(JsonNode d) {
        JsonNode p = d.path("P"), inicial = d.path("inicial"); matriz(p, true); exigir(p.size() <= 12, "Markov admite hasta 12 estados."); vector(inicial, true);
        exigir(p.size() == p.get(0).size() && inicial.size() == p.size(), "Markov requiere matriz cuadrada e inicial del mismo tamaño.");
        for (JsonNode fila : p) probabilidad(fila); probabilidad(inicial); entero(d.path("n"), 0, 500);
    }
    private static void probabilidad(JsonNode v) { double suma = 0; for (JsonNode x : v) { double n = numero(x, 0, false); exigir(n <= 1, "Una probabilidad excede 1."); suma += n; } exigir(Math.abs(suma - 1) <= 1e-8, "Las probabilidades deben sumar 1."); }
    private static void noLineal(JsonNode d, String metodo) {
        if (metodo.equals("multivariable")) {
            JsonNode simbolos = d.path("simbolos"), inicio = d.path("inicio");
            exigir(simbolos.isArray() && simbolos.size() >= 1 && simbolos.size() <= 4, "Indica de 1 a 4 variables.");
            Set<String> vars = new HashSet<>();
            for (JsonNode s : simbolos) { String v = texto(s, 10); exigir(v.matches("[A-Za-z][A-Za-z0-9_]{0,9}") && !FUNCIONES.contains(v) && vars.add(v), "Símbolos de variables inválidos o duplicados."); }
            formula(d.path("f"), vars); vector(inicio, false);
            exigir(inicio.size() == simbolos.size(), "El punto inicial debe tener un valor por variable.");
            if (d.has("objetivo")) exigir(Set.of("max", "min").contains(d.path("objetivo").asText()), "Indica min o max.");
            return;
        }
        formula(d.path("f"), metodo.equals("lagrange") ? Set.of("x", "y") : Set.of("x"));
        if (metodo.equals("dorada")) { intervalo(d); exigir(Set.of("max", "min").contains(d.path("objetivo").asText()), "Indica min o max para sección dorada."); }
        if (metodo.equals("newton")) { numero(d.path("x0"), -1e12, false); if (d.has("a") || d.has("b")) intervalo(d); }
        if (metodo.equals("lagrange")) { formula(d.path("g"), Set.of("x", "y")); numero(d.path("c"), -1e12, false); }
    }
    private static void tablaPagos(JsonNode d, String filas, String columnas) {
        JsonNode pagos = d.path("pagos"); matriz(pagos, false);
        if (d.has(filas)) nombres(d.get(filas), pagos.size());
        if (d.has(columnas)) nombres(d.get(columnas), pagos.get(0).size());
    }
    private static void decisiones(JsonNode d, String metodo) {
        tablaPagos(d, "alternativas", "estados");
        exigir(Set.of("max", "min").contains(d.path("objetivo").asText()), "Indica si los pagos son ganancias (max) o costos (min).");
        if (metodo.equals("riesgo")) {
            JsonNode p = d.path("probabilidades"); vector(p, true);
            exigir(p.size() == d.path("pagos").get(0).size(), "Indica una probabilidad por estado de la naturaleza.");
            probabilidad(p);
        }
        if (d.has("alfa")) { double a = numero(d.get("alfa"), 0, false); exigir(a <= 1, "α debe estar entre 0 y 1."); }
    }
    private static void intervalo(JsonNode d) { exigir(numero(d.path("a"), -1e12, false) < numero(d.path("b"), -1e12, false), "El intervalo requiere a < b."); }
    private static void formula(JsonNode nodo, Set<String> variables) {
        String f = texto(nodo, 300); exigir(f.matches("[A-Za-z0-9_+*/^().,\\s-]+"), "La fórmula contiene operadores no permitidos.");
        Set<String> permitidos = new HashSet<>(FUNCIONES); permitidos.addAll(variables);
        var m = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*").matcher(f); while (m.find()) exigir(permitidos.contains(m.group()), "La fórmula contiene un símbolo o función no admitidos."); numerosEnFormula(f);
    }
    private static double numero(JsonNode n, double min, boolean estricto) { exigir(n.isNumber() && Double.isFinite(n.asDouble()) && Math.abs(n.asDouble()) <= 1e12 && (estricto ? n.asDouble() > min : n.asDouble() >= min), "Falta un número finito dentro del rango permitido."); return n.asDouble(); }
    private static int entero(JsonNode n, int min, int max) { double v = numero(n, min, false); exigir(v == Math.rint(v) && v <= max, "Indica un entero entre " + min + " y " + max + "."); return (int) v; }
    private static void limitar(JsonNode n, int profundidad) { exigir(profundidad <= 12, "El modelo está demasiado anidado."); if (n.isContainerNode()) { exigir(n.size() <= 80, "El modelo excede el tamaño permitido."); for (JsonNode hijo : n) limitar(hijo, profundidad + 1); } else if (n.isNumber()) numero(n, -1e12, false); else if (n.isTextual()) exigir(n.textValue().length() <= 12000, "Un texto del modelo excede el límite."); }
    private static String texto(JsonNode n, int max) { exigir(n.isTextual() && n.asText().length() <= max, "Falta texto o excede el límite de " + max + " caracteres."); return n.asText().trim(); }
    private static List<String> textos(JsonNode n) { if (!n.isArray()) return List.of(); exigir(n.size() <= 16, "Demasiados mensajes del proveedor."); List<String> r = new ArrayList<>(); for (JsonNode s : n) r.add(texto(s, 500)); return r; }
    private static void exigir(boolean ok, String mensaje) { if (!ok) throw new IllegalArgumentException(mensaje); }
    /** Cita comparable: sin distinguir mayúsculas, espacios repetidos ni puntuación en los extremos. Las cifras y su orden se conservan. */
    static String normalizarCita(String texto) {
        return texto.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim().replaceAll("^[\\p{Punct}¿¡«»“”\\s]+|[\\p{Punct}¿¡«»“”\\s]+$", "");
    }
}
