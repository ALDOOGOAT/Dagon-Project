package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.IoParserTexto.*;

/** Temas de matriz: transporte, asignación, decisiones (incertidumbre y riesgo) y juegos de suma cero. */
final class IoParserMatrices {
    /** Tabla leída del texto; sus cifras se consumen solo cuando el tema queda confirmado. */
    record Tabla(List<String> enc, List<String> etiquetas, List<List<Double>> filas, List<int[]> spans) {
        void consumir(IoParserTexto t) { spans.forEach(s -> t.marcar(s[0], s[1])); }
    }
    private static final Pattern CONTEO = Pattern.compile(num("k") + "\\s+(?<w>[a-z]{3,})\\b");
    private static final Set<String> UNIDADES = Set.of("horas", "hora", "minutos", "dias", "unidades", "pesos", "dolares", "euros", "semanas", "meses", "kg", "kilos", "litros", "miles", "millones", "piezas", "toneladas", "veces", "por");

    static Tabla tabla(IoParserTexto t) {
        List<List<IoParserTexto.Celda>> filas = t.filasTabla();
        if (filas.size() >= 2) {
            List<String> enc = List.of(), et = new ArrayList<>(); List<List<Double>> vals = new ArrayList<>(); List<int[]> spans = new ArrayList<>();
            boolean ok = true;
            for (var f : filas) {
                boolean hayNumero = false; for (var c : f) hayNumero |= t.esNumerica(c);
                if (!hayNumero) {
                    if (enc.isEmpty() && vals.isEmpty()) { enc = f.stream().map(IoParserTexto.Celda::texto).toList(); f.forEach(c -> spans.add(new int[]{c.ini(), c.fin()})); }
                    continue;
                }
                List<Double> v = new ArrayList<>(); String etiqueta = ""; int ini = 0;
                if (!t.esNumerica(f.get(0))) { etiqueta = f.get(0).texto(); spans.add(new int[]{f.get(0).ini(), f.get(0).fin()}); ini = 1; }
                for (int j = ini; j < f.size() && ok; j++) {
                    var c = f.get(j);
                    if (c.vacia()) { v.add(Double.NaN); continue; }
                    double[] x = t.celdaValor(c);
                    if (x == null) { ok = false; break; }
                    spans.add(new int[]{c.ini(), c.fin()}); v.add(x[1] == 1 ? x[0] / 100 : x[0]);
                }
                et.add(etiqueta); vals.add(v);
            }
            if (ok && vals.size() >= 2) return new Tabla(enc, et, vals, spans);
        }
        var fs = t.filasConDosPuntos();
        if (fs.size() >= 2) {
            List<String> et = new ArrayList<>(); List<List<Double>> vals = new ArrayList<>(); List<int[]> spans = new ArrayList<>();
            for (var f : fs) { et.add(f.etiqueta()); vals.add(f.valores()); spans.add(new int[]{f.etiquetaIni(), f.fin()}); }
            return new Tabla(List.of(), et, vals, spans);
        }
        return null;
    }
    private static boolean tieneNaN(List<Double> v) { for (double x : v) if (Double.isNaN(x)) return true; return false; }
    private static String norm(String s) { return IoParserLocal.normalizar(s); }
    private static List<Double> sinBordesVacios(List<Double> v) {
        int a = 0, b = v.size(); while (a < b && Double.isNaN(v.get(a))) a++; while (b > a && Double.isNaN(v.get(b - 1))) b--;
        return new ArrayList<>(v.subList(a, b));
    }
    /** Cifras "NUM sustantivo" que repiten el tamaño de la tabla (3 trabajadores, 4 tareas) no son datos. */
    private static void conteos(IoParserTexto t, int... dims) {
        Matcher m = CONTEO.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k") || UNIDADES.contains(m.group("w"))) continue;
            double v = t.valor(m, "k");
            for (int d : dims) if (v == d) { t.marcar(m, "k"); break; }
        }
    }
    /** Lista de cifras tras una palabra clave en la misma frase ("la oferta de los almacenes es 35, 50 y 40"). */
    private static List<Double> listaTras(IoParserTexto t, String claves, List<int[]> spans) {
        Matcher m = Pattern.compile("\\b(?:" + claves + ")[^.;?!0-9\\n|]{0,80}?(?=\\d)").matcher(t.n);
        while (m.find()) {
            IoParserTexto.Tok k = t.tok(m.end());
            if (k == null || t.usado[k.ini()] || k.pegado()) continue;
            int[] fin = new int[1]; List<Double> v = t.lista(m.end(), fin);
            if (v.isEmpty()) continue;
            spans.add(new int[]{m.end(), fin[0]}); return v;
        }
        return null;
    }
    private static String dimension(String que, int esperado, int real) { return "La " + que + " tiene " + real + " valores pero se esperaban " + esperado + "."; }

    // ------------------------------------------------------------------ transporte
    static IoInterpretacion transporte(IoParserTexto t) {
        if (!t.tiene("transporte|\\benvi|\\bdistribu|\\borigen|\\bdestino|abastec|\\boferta|suministr")) return null;
        List<int[]> spans = new ArrayList<>();
        List<List<Double>> costos = new ArrayList<>(); List<Double> oferta = null, demanda = null;
        Tabla tb = tabla(t);
        if (tb != null) {
            List<List<Double>> filasCosto = new ArrayList<>();
            for (int i = 0; i < tb.filas().size(); i++) {
                String et = norm(tb.etiquetas().get(i)); List<Double> v = tb.filas().get(i);
                if (et.matches(".*(?:demanda|requerimiento|necesidad|pedido).*")) demanda = sinBordesVacios(v);
                else if (et.matches(".*(?:oferta|disponibilidad|suministro|produccion).*") || et.equals("capacidad")) oferta = sinBordesVacios(v);
                else filasCosto.add(v);
            }
            if (filasCosto.size() < 2) return null;
            int ancho = filasCosto.get(0).size(), supCol = -1;
            if (!tb.enc().isEmpty()) {
                List<String> enc = tb.enc().size() == ancho + 1 ? tb.enc().subList(1, tb.enc().size()) : tb.enc();
                for (int j = 0; j < enc.size() && j < ancho; j++) if (norm(enc.get(j)).matches(".*(?:oferta|capacidad|disponibilidad|suministro|produccion).*")) supCol = j;
            }
            if (supCol < 0 && demanda != null && ancho == demanda.size() + 1) supCol = ancho - 1;
            if (supCol >= 0 && oferta == null) { oferta = new ArrayList<>(); for (var f : filasCosto) oferta.add(f.size() > supCol ? f.get(supCol) : Double.NaN); }
            for (var f : filasCosto) { List<Double> c = new ArrayList<>(f); if (supCol >= 0 && supCol < c.size()) c.remove(supCol); costos.add(c); }
            spans.addAll(tb.spans());
        } else {
            Pairs p = pares(t);
            if (p == null) return null;
            if (!p.faltan.isEmpty()) return t.incompleto("Falta el costo de algunas rutas de envío.", p.faltan);
            costos = p.costos; spans.addAll(p.spans);
            p.spans.forEach(sp -> t.marcar(sp[0], sp[1])); // los costos ya no compiten por cifras con la oferta y la demanda
            Set<Integer> reservados = new HashSet<>();
            oferta = p.oferta(t, reservados, spans); demanda = p.demanda(t, reservados, spans);
            // los números de nombres como "planta 1" son rótulos, no datos
            for (String nom : p.norma.values()) if (nom.matches(".*\\d.*") && !nom.matches("[\uE001-\uE01A][0-9]{0,2}")) { Matcher mm = Pattern.compile(regexNombre(nom)).matcher(t.n); while (mm.find()) spans.add(new int[]{mm.start(), mm.end()}); }
        }
        if (costos.size() < 2 && !(costos.size() == 1 && costos.get(0).size() >= 2)) return null;
        int m = costos.size(), n = costos.get(0).size();
        for (var f : costos) if (f.size() != n || tieneNaN(f)) return t.incompleto("La matriz de costos de transporte no es rectangular o tiene celdas vacías.", "Indica el costo de cada ruta origen-destino (la matriz debe ser rectangular).");
        if (oferta == null) oferta = listaTras(t, "oferta|capacidad(?:es)?|disponibilidad|produccion|suministro", spans);
        if (demanda == null) demanda = listaTras(t, "demanda|requerimientos?|necesidades|requieren|demandan|necesitan", spans);
        List<String> preguntas = new ArrayList<>();
        if (oferta == null || oferta.isEmpty()) preguntas.add("¿Cuál es la oferta (capacidad) de cada origen?");
        else if (oferta.size() != m || tieneNaN(oferta)) preguntas.add(dimension("oferta", m, oferta.size()) + " Hay un valor de oferta por cada origen de la matriz de costos.");
        if (demanda == null || demanda.isEmpty()) preguntas.add("¿Cuál es la demanda de cada destino?");
        else if (demanda.size() != n || tieneNaN(demanda)) preguntas.add(dimension("demanda", n, demanda.size()) + " Hay un valor de demanda por cada destino de la matriz de costos.");
        for (var f : costos) for (double c : f) if (c < 0) preguntas.add("Un costo de transporte es negativo; indica costos no negativos.");
        if (!preguntas.isEmpty()) return t.incompleto("Datos de transporte incompletos o inconsistentes.", preguntas.stream().distinct().toList());
        spans.forEach(s -> t.marcar(s[0], s[1])); conteos(t, m, n);
        ObjectNode datos = JSON.createObjectNode(); datos.set("costos", mat(costos)); datos.set("oferta", arr(oferta)); datos.set("demanda", arr(demanda));
        String metodo = t.tiene("noroeste") ? "noroeste" : t.tiene("metodo (?:de(?:l)? )?costo minimo|costos? minimos? como metodo|metodo de costos minimos") ? "costo_minimo" : "vogel";
        List<String> sup = new ArrayList<>(List.of("Método " + metodo + " para la solución inicial; después se optimiza (MODI)."));
        double so = oferta.stream().mapToDouble(Double::doubleValue).sum(), sd = demanda.stream().mapToDouble(Double::doubleValue).sum();
        if (so != sd) sup.add("La oferta total (" + fmt(so) + ") y la demanda total (" + fmt(sd) + ") difieren; se balancea con un " + (so > sd ? "destino" : "origen") + " ficticio de costo cero.");
        return t.listo("transporte", metodo, datos, List.of(), sup, List.of());
    }
    /** Costos dados por frases ("enviar de P1 a C2 cuesta $6", "A a Norte 6 pesos") con oferta y demanda por nombre. */
    private static final class Pairs {
        final List<String> origenes = new ArrayList<>(), destinos = new ArrayList<>(), faltan = new ArrayList<>();
        final Map<String, String> norma = new HashMap<>(); // nombre → texto normalizado tal como aparece en n
        final List<int[]> spans = new ArrayList<>(); List<List<Double>> costos = new ArrayList<>();
        List<Double> oferta(IoParserTexto t, Set<Integer> reservados, List<int[]> sp) { return porNombre(t, origenes, reservados, sp); }
        List<Double> porNombre(IoParserTexto t, List<String> nombres, Set<Integer> reservados, List<int[]> sp) {
            List<Double> v = new ArrayList<>(); Set<Integer> locales = new HashSet<>(reservados);
            for (String nom : nombres) {
                Matcher m = Pattern.compile(regexNombre(norma.get(nom)) + "[^.;?!0-9\\n]{0,45}?" + num("k")).matcher(t.n); Double hallado = null;
                while (m.find() && hallado == null) {
                    IoParserTexto.Tok k = t.tok(m.start("k"));
                    if (!t.libre(m, "k") || locales.contains(k.ini()) || (k.palabra() && sustantivoDeEntidad(t, k.fin()))) continue;
                    hallado = k.valor(); locales.add(k.ini()); sp.add(new int[]{k.ini(), k.fin()});
                }
                v.add(hallado == null ? Double.NaN : hallado);
            }
            if (v.stream().anyMatch(x -> Double.isNaN(x))) { sp.removeIf(x -> locales.contains(x[0]) && !reservados.contains(x[0])); }
            reservados.addAll(locales);
            return v;
        }
        List<Double> demanda(IoParserTexto t, Set<Integer> reservados, List<int[]> sp) {
            List<int[]> propios = new ArrayList<>(); Set<Integer> copia = new HashSet<>(reservados);
            List<Double> v = porNombre(t, destinos, copia, propios);
            if (v.stream().noneMatch(x -> Double.isNaN(x))) { sp.addAll(propios); reservados.addAll(copia); return v; }
            // lista con palabra clave: "Los centros requieren 30, 40 y 30 unidades, respectivamente"
            Matcher m = Pattern.compile("\\b(?:demand\\w*|requier\\w*|necesit\\w*|pid\\w*)[^.;?!0-9\\n]{0,60}?(?=\\d)").matcher(t.n);
            while (m.find()) {
                IoParserTexto.Tok k = t.tok(m.end()); if (k == null || t.usado[k.ini()] || reservados.contains(k.ini())) continue;
                int[] fin = new int[1]; List<Double> l = t.lista(m.end(), fin);
                if (!l.isEmpty()) { sp.add(new int[]{m.end(), fin[0]}); return l; }
            }
            return v;
        }
    }
    private static String regexNombre(String norm) {
        String[] partes = norm.strip().split("\\s+"); List<String> q = new ArrayList<>(); for (String x : partes) q.add(Pattern.quote(x));
        boolean cod = norm.matches("[\uE001-\uE01A][0-9]{0,2}");
        return (cod ? "" : "(?<![\\p{L}])") + String.join("\\s?", q) + "(?![\\p{L}0-9])";
    }
    /** "tres centros", "dos plantas": una palabra-número seguida de un sustantivo de entidad no es una oferta ni una demanda. */
    private static boolean sustantivoDeEntidad(IoParserTexto t, int fin) {
        return Pattern.compile("\\s*(?:centros|almacenes|plantas|destinos|clientes|tiendas|ciudades|origenes|proveedores|bodegas|sucursales|fabricas|depositos)\\b").matcher(t.n).region(fin, Math.min(t.n.length(), fin + 14)).lookingAt();
    }
    private static final String NOMBRE = "(?:" + COD + "|(?:planta|almacen|bodega|centro|deposito|fabrica|cliente|tienda|ciudad|destino|origen|sucursal|mina|silo)\\s?\\d+|[a-z]{3,})";
    private static final Set<String> NO_NOMBRE = Set.of("unidades", "unidad", "pesos", "peso", "dolares", "euros", "costo", "costos", "hasta", "hacia", "cada", "para", "por", "con", "que", "los", "las", "del", "desde", "entre", "como", "cuesta", "cuestan", "son", "tiene", "dispone", "necesita", "requiere");
    private static boolean nombreValido(IoParserTexto t, int ini, int fin) {
        String n = t.n.substring(ini, fin);
        if (n.matches("[\uE001-\uE01A][0-9]{0,2}") || n.matches("(?:planta|almacen|bodega|centro|deposito|fabrica|cliente|tienda|ciudad|destino|origen|sucursal|mina|silo)\\s?\\d+")) return true;
        return Character.isUpperCase(t.original.charAt(ini)) && !NO_NOMBRE.contains(n);
    }
    private static Pairs pares(IoParserTexto t) {
        Matcher m = Pattern.compile("(?<![\\p{L}\\p{N}])(?:de\\s+)?(?<o>" + NOMBRE + ")(?:\\s+(?:a|hacia|al)\\s+|\\s*(?:→|->)\\s*)(?<d>" + NOMBRE + ")(?![\\p{L}])\\s*(?:cuesta\\s+|cuestan\\s+|es\\s+de\\s+|:|=)?\\s*\\$?\\s*" + num("k")).matcher(t.n);
        Pairs p = new Pairs(); Map<String, Double> costo = new LinkedHashMap<>(); int cuenta = 0;
        while (m.find()) {
            if (!t.libre(m, "k") || !nombreValido(t, m.start("o"), m.end("o")) || !nombreValido(t, m.start("d"), m.end("d"))) continue;
            String o = t.original.substring(m.start("o"), m.end("o")).replaceAll("\\s+", " "), d = t.original.substring(m.start("d"), m.end("d")).replaceAll("\\s+", " ");
            if (o.equalsIgnoreCase(d)) continue;
            if (!p.origenes.contains(o)) { p.origenes.add(o); p.norma.put(o, t.n.substring(m.start("o"), m.end("o"))); }
            if (!p.destinos.contains(d)) { p.destinos.add(d); p.norma.put(d, t.n.substring(m.start("d"), m.end("d"))); }
            if (costo.put(o + ">" + d, t.valor(m, "k")) != null) return pareja(p, "Hay dos costos para el envío de " + o + " a " + d + ".");
            p.spans.add(new int[]{m.start("k"), m.end("k")}); p.spans.add(new int[]{m.start("o"), m.end("o")}); p.spans.add(new int[]{m.start("d"), m.end("d")}); cuenta++;
        }
        if (cuenta < 2) return null;
        for (String o : p.origenes) if (p.destinos.contains(o)) return null; // un mismo nombre en ambos lados: no es un transporte
        for (String o : p.origenes) { List<Double> fila = new ArrayList<>(); for (String d : p.destinos) { Double c = costo.get(o + ">" + d); if (c == null) p.faltan.add("¿Cuánto cuesta enviar de " + o + " a " + d + "?"); fila.add(c == null ? Double.NaN : c); } p.costos.add(fila); }
        return p;
    }
    private static Pairs pareja(Pairs p, String pregunta) { p.faltan.add(pregunta); return p; }

    // ------------------------------------------------------------------ asignación
    static IoInterpretacion asignacion(IoParserTexto t) {
        if (!t.tiene("asign|\\btareas?\\b|\\bpuestos?\\b") || t.tiene("\\boferta|demanda|transporte|abastec")) return null;
        Tabla tb = tabla(t);
        if (tb == null || tb.filas().size() < 2) return null;
        int ancho = tb.filas().get(0).size();
        for (var f : tb.filas()) if (f.size() != ancho || tieneNaN(f)) return t.incompleto("La matriz de asignación debe ser rectangular y completa.", "Indica el costo (o beneficio) de cada trabajador en cada tarea: la matriz debe ser rectangular, sin celdas vacías.");
        String objetivo = objetivoMinMax(t, "costo|tiempo|distancia|duracion|horas|minutos|gasto|perdida", "ganancia|utilidad|beneficio|ventas|puntuacion|puntos|eficiencia|calificacion|productividad|rendimiento|ingreso");
        if (objetivo == null) return t.incompleto("No se sabe si la asignación minimiza o maximiza.", "¿Se busca minimizar (costos, tiempos, distancias) o maximizar (ganancias, ventas, puntuaciones) el total de la asignación?");
        tb.consumir(t); conteos(t, tb.filas().size(), ancho);
        ObjectNode datos = JSON.createObjectNode(); datos.set("matriz", mat(tb.filas())); datos.put("objetivo", objetivo);
        List<String> sup = new ArrayList<>(List.of("Cada fila se asigna a una sola columna y viceversa (método húngaro)."));
        if (tb.filas().size() != ancho) sup.add("La matriz no es cuadrada; el método húngaro completa con filas o columnas ficticias de valor cero.");
        return t.listo("asignacion", "hungaro", datos, List.of(), sup, List.of());
    }
    /** "min" o "max": el verbo explícito manda; si no, la familia de palabras presente (solo una); si hay duda, null. */
    static String objetivoMinMax(IoParserTexto t, String palabrasMin, String palabrasMax) {
        boolean eMin = t.tiene("minimiz|menor\\s+(?:costo|tiempo|gasto)|costo\\s+minimo|tiempo\\s+minimo"), eMax = t.tiene("maximiz|mayor\\s+(?:ganancia|utilidad|beneficio|ventas)|ganancia\\s+maxima");
        if (eMin != eMax) return eMin ? "min" : "max";
        if (eMin) return null;
        boolean fMin = t.tiene("\\b(?:" + palabrasMin + ")\\w*"), fMax = t.tiene("\\b(?:" + palabrasMax + ")\\w*");
        return fMin != fMax ? (fMin ? "min" : "max") : null;
    }

    // ------------------------------------------------------------------ decisiones
    static IoInterpretacion decisiones(IoParserTexto t) {
        if (!t.tiene("incertidumbre|riesgo|hurwicz|maximin|maximax|laplace|savage|arrepentimiento|(?:utilidad|valor|costo|ganancia|beneficio)\\s+esperad[oa]|naturaleza|alternativas?|probabilidades?")) return null;
        Tabla tb = tabla(t);
        if (tb == null) return null;
        List<Integer> pagosIdx = new ArrayList<>(); List<Double> probs = null; List<int[]> spans = new ArrayList<>();
        for (int i = 0; i < tb.filas().size(); i++) { if (norm(tb.etiquetas().get(i)).startsWith("probabilidad")) probs = sinBordesVacios(tb.filas().get(i)); else pagosIdx.add(i); }
        if (pagosIdx.size() < 2) return null;
        List<List<Double>> pagos = new ArrayList<>(); List<String> alternativas = new ArrayList<>();
        for (int i : pagosIdx) { pagos.add(tb.filas().get(i)); alternativas.add(tb.etiquetas().get(i)); }
        int cols = pagos.get(0).size();
        for (var f : pagos) if (f.size() != cols || tieneNaN(f)) return t.incompleto("La tabla de pagos debe ser rectangular y completa.", "Indica el pago de cada alternativa en cada estado de la naturaleza (tabla rectangular).");
        if (probs == null) probs = listaTras(t, "probabilidades?", spans);
        String objetivo = objetivoMinMax(t, "costo|perdida|gasto|tiempo", "ganancia|utilidad|beneficio|ingreso|rendimiento|pago|ventas");
        boolean criterios = t.tiene("hurwicz|maximin|maximax|laplace|savage|arrepentimiento|optimista|pesimista");
        List<String> preguntas = new ArrayList<>();
        if (objetivo == null) preguntas.add("¿Los pagos son ganancias (se maximiza) o costos (se minimiza)?");
        if (probs != null && !probs.isEmpty()) {
            double suma = probs.stream().mapToDouble(Double::doubleValue).sum();
            if (probs.size() != cols) preguntas.add("Hay " + probs.size() + " probabilidades para " + cols + " estados de la naturaleza: indica una por estado.");
            else if (Math.abs(suma - 1) > 1e-9) preguntas.add("Las probabilidades suman " + fmt(Math.rint(suma * 1e6) / 1e6) + ", no 1: revisa los valores.");
            if (criterios && !t.tiene("valor\\s+esperado|esperad[oa]")) preguntas.add("El enunciado da probabilidades y menciona criterios sin probabilidades (Hurwicz, maximin…): ¿se decide bajo riesgo (valor esperado) o bajo incertidumbre?");
        }
        Double alfa = null; Matcher a = Pattern.compile("(?:alfa|α|alpha|coeficiente\\s+de\\s+optimismo|indice\\s+de\\s+optimismo)\\s*(?:=|de|:|es)?\\s*" + num("k")).matcher(t.n);
        if (a.find() && t.libre(a, "k")) { alfa = t.valor(a, "k"); if (alfa < 0 || alfa > 1) preguntas.add("α debe estar entre 0 y 1; el enunciado indica " + fmt(alfa) + "."); else { spans.add(new int[]{a.start("k"), a.end("k")}); } }
        boolean riesgo = probs != null && !probs.isEmpty() && !(criterios && !t.tiene("valor\\s+esperado|esperad[oa]"));
        if (!riesgo && alfa == null && t.tiene("hurwicz")) preguntas.add("¿Cuál es el coeficiente de optimismo α del criterio de Hurwicz (entre 0 y 1)?");
        if (!preguntas.isEmpty()) return t.incompleto("Datos de decisión incompletos o inconsistentes.", preguntas);
        tb.consumir(t); spans.forEach(s -> t.marcar(s[0], s[1])); conteos(t, pagos.size(), cols);
        ObjectNode datos = JSON.createObjectNode(); datos.set("pagos", mat(pagos)); datos.put("objetivo", objetivo);
        if (alternativas.stream().noneMatch(String::isBlank)) datos.set("alternativas", textos(alternativas));
        if (tb.enc().size() == cols + 1 || tb.enc().size() == cols) datos.set("estados", textos(tb.enc().size() == cols + 1 ? tb.enc().subList(1, cols + 1) : tb.enc()));
        if (riesgo) datos.set("probabilidades", arr(probs)); else if (alfa != null) datos.put("alfa", alfa);
        return t.listo("decisiones", riesgo ? "riesgo" : "incertidumbre", datos, List.of(),
                List.of(riesgo ? "Decisión bajo riesgo: se compara el valor esperado de cada alternativa." : "Decisión bajo incertidumbre: se aplican los criterios clásicos (Laplace, maximin, maximax, Hurwicz, Savage)."), List.of());
    }

    // ------------------------------------------------------------------ juegos de suma cero
    static IoInterpretacion juegos(IoParserTexto t) {
        if (!t.tiene("suma\\s+cero|\\bjuego\\b|jugador(?:es)?|estrategia\\s+pura|punto\\s+de\\s+silla")) return null;
        Tabla tb = tabla(t);
        if (tb == null) return null;
        int cols = tb.filas().get(0).size();
        for (var f : tb.filas()) if (f.size() != cols || tieneNaN(f)) return t.incompleto("La matriz de pagos debe ser rectangular y completa.", "Indica el pago del jugador de las filas para cada pareja de estrategias (matriz rectangular).");
        tb.consumir(t); conteos(t, tb.filas().size(), cols);
        ObjectNode datos = JSON.createObjectNode(); datos.set("pagos", mat(tb.filas()));
        if (tb.etiquetas().stream().noneMatch(String::isBlank)) datos.set("filas", textos(tb.etiquetas()));
        if (tb.enc().size() == cols || tb.enc().size() == cols + 1) datos.set("columnas", textos(tb.enc().size() == cols + 1 ? tb.enc().subList(1, cols + 1) : tb.enc()));
        return t.listo("juegos", "suma_cero", datos, List.of(), List.of("Los pagos son del jugador de las filas; lo que gana él lo pierde el de las columnas (suma cero)."), List.of());
    }
}
