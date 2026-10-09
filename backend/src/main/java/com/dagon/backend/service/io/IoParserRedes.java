package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.IoParserTexto.*;

/** Redes de proyecto (CPM/PERT) y grafos (ruta más corta, árbol de expansión mínima, flujo máximo). */
final class IoParserRedes {
    private static final String ID = "(?:" + COD + ")";
    private static final String TIEMPO = "(?<u>dias?|semanas?|meses|horas?|minutos?|anos?)";
    private static final String INICIAL = "sin\\s+predecesor\\w*|no\\s+tiene\\s+predecesor\\w*|de\\s+inmediato|inicia\\s+el\\s+proyecto|actividad\\s+inicial|es\\s+la\\s+primera|primera\\s+actividad|al\\s+inicio|no\\s+depende";

    private static String id(IoParserTexto t, int ini, int fin) { return t.original.substring(ini, fin); }
    private static List<String> ids(IoParserTexto t, int ini, int fin) {
        List<String> r = new ArrayList<>(); Matcher m = Pattern.compile(ID).matcher(t.n); m.region(ini, fin);
        while (m.find()) r.add(t.original.substring(m.start(), m.end()));
        return r;
    }
    private static String unidad(String u) { return u == null ? null : u.startsWith("dia") ? "días" : u.startsWith("semana") ? "semanas" : u.startsWith("mes") ? "meses" : u.startsWith("hora") ? "horas" : u.startsWith("minuto") ? "minutos" : "años"; }

    // ------------------------------------------------------------------ CPM / PERT
    private static final class Act {
        final String id; List<String> pred; Double dur, a, m, b;
        Act(String id) { this.id = id; }
    }
    static IoInterpretacion proyecto(IoParserTexto t) {
        if (!t.tiene("actividad|predecesor|ruta critica|camino critico|\\bcpm\\b|\\bpert\\b|holgura|precedid")) return null;
        Map<String, Act> acts = new LinkedHashMap<>(); List<int[]> spans = new ArrayList<>(); Set<String> unidades = new LinkedHashSet<>();
        if (!tablaActividades(t, acts, spans)) {
            acts.clear(); spans.clear();
            if (!prosaActividades(t, acts, spans, unidades)) return null;
        }
        List<String> preguntas = new ArrayList<>();
        boolean pert = acts.values().stream().anyMatch(x -> x.a != null || x.m != null || x.b != null);
        for (Act x : acts.values()) {
            if (x.pred == null) preguntas.add("¿Qué actividades preceden a " + x.id + "? (indica «ninguna» si puede empezar al inicio)");
            else for (String p : x.pred) if (!acts.containsKey(p)) preguntas.add("La actividad " + x.id + " depende de «" + p + "», que no aparece como actividad del proyecto.");
            if (pert) { if (x.a == null || x.m == null || x.b == null) preguntas.add("La actividad " + x.id + " necesita los tres tiempos (optimista, más probable y pesimista) para PERT."); else if (!(x.a <= x.m && x.m <= x.b)) preguntas.add("Los tiempos de " + x.id + " no cumplen optimista ≤ más probable ≤ pesimista."); }
            else if (x.dur == null) preguntas.add("¿Cuánto dura la actividad " + x.id + "?");
        }
        if (preguntas.isEmpty() && ciclo(acts)) preguntas.add("Las precedencias forman un ciclo: revisa qué actividad debe terminar antes de cuál.");
        if (unidades.size() > 1) preguntas.add("Las duraciones usan unidades distintas (" + String.join(" y ", unidades) + "): exprésalas en la misma unidad.");
        if (acts.size() < 2 && preguntas.isEmpty()) return null;
        Double plazo = null; List<int[]> sp2 = new ArrayList<>();
        if (pert) {
            Matcher m = Pattern.compile("(?:plazo\\s+(?:de|maximo\\s+de)\\s+|(?:terminar|completar|finalizar|concluir|cumplir)[^.;?!0-9]{0,45}?(?:en|antes\\s+de|dentro\\s+de|a\\s+mas\\s+tardar\\s+en)\\s+|(?:en|dentro\\s+de|antes\\s+de|menos\\s+de)\\s+)" + num("k") + "\\s*(?:" + TIEMPO + ")?").matcher(t.n);
            while (m.find() && plazo == null) if (t.libre(m, "k")) { plazo = t.valor(m, "k"); sp2.add(new int[]{m.start("k"), m.end("k")}); String u = unidad(m.group("u")); if (u != null && !unidades.isEmpty() && !unidades.contains(u)) preguntas.add("El plazo está en " + u + " y las duraciones en " + String.join(", ", unidades) + ": usa la misma unidad."); }
        }
        if (!preguntas.isEmpty()) return t.incompleto("Datos de red de proyecto incompletos o inconsistentes.", preguntas.stream().distinct().toList());
        spans.forEach(s -> t.marcar(s[0], s[1])); sp2.forEach(s -> t.marcar(s[0], s[1]));
        ArrayNode lista = JSON.createArrayNode();
        for (Act x : acts.values()) {
            ObjectNode o = JSON.createObjectNode().put("id", x.id); o.set("predecesoras", textos(x.pred));
            if (pert) o.put("a", x.a).put("m", x.m).put("b", x.b); else o.put("duracion", x.dur);
            lista.add(o);
        }
        ObjectNode datos = JSON.createObjectNode(); datos.set("actividades", lista);
        if (plazo != null) datos.put("plazo", plazo);
        List<String> sup = new ArrayList<>(List.of(pert ? "PERT: duración esperada (a+4m+b)/6 y varianza ((b−a)/6)² por actividad; la probabilidad usa la aproximación normal de la ruta crítica." : "CPM con duraciones deterministas."));
        if (!unidades.isEmpty()) sup.add("Todas las duraciones están en " + String.join(", ", unidades) + ".");
        return t.listo("redes", pert ? "pert" : "cpm", datos, List.of(), sup, List.of());
    }
    private static boolean ciclo(Map<String, Act> acts) {
        Set<String> hechas = new HashSet<>();
        for (int i = 0; i < acts.size(); i++) for (Act x : acts.values()) if (!hechas.contains(x.id) && hechas.containsAll(x.pred)) hechas.add(x.id);
        return hechas.size() != acts.size();
    }
    private static List<String> predecesoras(IoParserTexto t, String celda) {
        String c = IoParserLocal.normalizar(celda).strip();
        if (c.isEmpty() || c.matches("[-–—.]+|ninguna?|inicio|n/?a|ningun[oa]s?|-") ) return new ArrayList<>();
        List<String> r = new ArrayList<>();
        for (String p : celda.split("[,;/\\s]+|\\by\\b|\\be\\b")) if (!p.isBlank()) r.add(p.strip());
        return r;
    }
    private static boolean tablaActividades(IoParserTexto t, Map<String, Act> acts, List<int[]> spans) {
        var filas = t.filasTabla();
        if (filas.size() < 3) return false;
        var enc = filas.get(0);
        int cId = 0, cPred = -1, cDur = -1, cA = -1, cM = -1, cB = -1;
        for (int j = 0; j < enc.size(); j++) {
            String h = IoParserLocal.normalizar(enc.get(j).texto());
            if (h.matches(".*(?:predecesor|precedente|antecesor|precede|requiere|depende|despues).*")) cPred = j;
            else if (h.matches(".*optimist.*")) cA = j;
            else if (h.matches(".*(?:probable|modal).*")) cM = j;
            else if (h.matches(".*pesimist.*")) cB = j;
            else if (h.matches(".*(?:duracion|tiempo|dias|semanas|meses|horas).*")) cDur = j;
        }
        boolean pert = cA >= 0 && cM >= 0 && cB >= 0;
        if (cPred < 0 || (!pert && cDur < 0)) return false;
        for (var c : enc) spans.add(new int[]{c.ini(), c.fin()});
        for (int i = 1; i < filas.size(); i++) {
            var f = filas.get(i);
            if (f.size() <= cPred) return false;
            String idA = f.get(cId).texto().strip();
            if (idA.isEmpty() || t.esNumerica(f.get(cId)) || acts.containsKey(idA)) return false;
            Act x = new Act(idA); x.pred = predecesoras(t, f.get(cPred).texto());
            spans.add(new int[]{f.get(cId).ini(), f.get(cId).fin()}); spans.add(new int[]{f.get(cPred).ini(), f.get(cPred).fin()});
            int[] cols = pert ? new int[]{cA, cM, cB} : new int[]{cDur};
            Double[] v = new Double[cols.length];
            for (int k = 0; k < cols.length; k++) {
                if (cols[k] >= f.size() || f.get(cols[k]).vacia()) continue;
                double[] z = t.celdaValor(f.get(cols[k])); if (z == null) return false;
                v[k] = z[0]; spans.add(new int[]{f.get(cols[k]).ini(), f.get(cols[k]).fin()});
            }
            if (pert) { x.a = v[0]; x.m = v[1]; x.b = v[2]; } else x.dur = v[0];
            acts.put(idA, x);
        }
        return acts.size() >= 2;
    }
    /** Prosa: "La actividad B dura 4 días y empieza cuando termina A", "B (4 días, precedida por A)". */
    private static boolean prosaActividades(IoParserTexto t, Map<String, Act> acts, List<int[]> spans, Set<String> unidades) {
        // forma con paréntesis: B (4 días, precedida por A)
        Matcher p = Pattern.compile("(?<![\\p{L}])(?<i>" + ID + ")\\s*\\(\\s*" + num("k") + "\\s*(?:" + TIEMPO + ")?\\s*,\\s*(?:(?<s>" + INICIAL + ")|(?:precedida|precedidas|despues\\s+de|requiere|depende\\s+de|sigue\\s+a)(?:\\s+por)?\\s+(?<l>(?:" + ID + "(?:\\s*(?:,|y|e)\\s*)?){1,30}))\\s*\\)").matcher(t.n);
        while (p.find()) {
            String idA = id(t, p.start("i"), p.end("i")); if (!t.libre(p, "k")) continue;
            Act x = acts.computeIfAbsent(idA, Act::new); x.dur = t.valor(p, "k"); spans.add(new int[]{p.start("k"), p.end("k")});
            x.pred = p.group("s") != null ? new ArrayList<>() : ids(t, p.start("l"), p.end("l"));
            String u = unidad(p.group("u")); if (u != null) unidades.add(u);
        }
        if (acts.size() >= 2) return true;
        // forma por frases
        Pattern cabeza = Pattern.compile("^[^\\p{L}-]*(?:la\\s+|el\\s+)?(?:actividad\\s+|tarea\\s+)?(?<i>" + ID + ")(?![0-9\\p{L}])");
        Pattern dur = Pattern.compile("\\b(?:dura|duran|tarda|toma|demora|requiere|tiene\\s+(?:una\\s+)?duracion(?:\\s+de)?)\\s+" + num("k") + "\\s*(?:" + TIEMPO + ")?");
        Pattern abm = Pattern.compile("optimista\\s*(?:de\\s+|=\\s*)?" + num("a") + "[^.;?!0-9]{0,6}?(?:mas\\s+probable|probable|modal)\\s*(?:de\\s+|=\\s*)?" + num("m") + "[^.;?!0-9]{0,6}?pesimista\\s*(?:de\\s+|=\\s*)?" + num("b") + "\\s*(?:" + TIEMPO + ")?");
        Pattern pred = Pattern.compile("(?:(?:empieza|comienza|inicia|arranca|puede\\s+(?:empezar|comenzar|iniciar)|solo\\s+puede\\s+(?:empezar|comenzar|iniciar))\\s+(?:cuando|despues\\s+de(?:\\s+que)?|una\\s+vez\\s+que)\\s+(?:(?:termina|terminan|finaliza|finalizan|concluye|concluyen|se\\s+completa|se\\s+completan|acaba|acaban)\\s+)?|sigue\\s+a\\s+|siguen\\s+a\\s+|depende\\s+de\\s+|dependen\\s+de\\s+|precedida\\s+por\\s+|requiere\\s+que\\s+(?:termine|terminen)\\s+|va\\s+despues\\s+de\\s+)(?<l>(?:" + ID + "(?:\\s*(?:,|y|e)\\s*)?){1,30})");
        Pattern inicial = Pattern.compile(INICIAL);
        for (int[] fr : t.frases()) {
            int a = fr[0], b = fr[1];
            Matcher h = cabeza.matcher(t.n); h.region(a, b);
            if (!h.find()) continue;
            String idA = id(t, h.start("i"), h.end("i")); Act x = acts.get(idA);
            Matcher d = dur.matcher(t.n); d.region(a, b); Matcher q = abm.matcher(t.n); q.region(a, b); Matcher r = pred.matcher(t.n); r.region(a, b); Matcher s = inicial.matcher(t.n); s.region(a, b);
            boolean tiene = false;
            if (q.find() && t.libre(q, "a")) {
                x = x == null ? acts.computeIfAbsent(idA, Act::new) : x; x.a = t.valor(q, "a"); x.m = t.valor(q, "m"); x.b = t.valor(q, "b"); tiene = true;
                for (String g : List.of("a", "m", "b")) spans.add(new int[]{q.start(g), q.end(g)});
                String u = unidad(q.group("u")); if (u != null) unidades.add(u);
            } else if (d.find() && t.libre(d, "k")) {
                x = x == null ? acts.computeIfAbsent(idA, Act::new) : x; x.dur = t.valor(d, "k"); spans.add(new int[]{d.start("k"), d.end("k")}); tiene = true;
                String u = unidad(d.group("u")); if (u != null) unidades.add(u);
            }
            if (x == null) continue;
            if (r.find()) { x.pred = ids(t, r.start("l"), r.end("l")); } else if (s.find()) x.pred = new ArrayList<>();
            else if (tiene && x.pred == null) { /* se preguntará */ }
        }
        return acts.size() >= 2;
    }

    // ------------------------------------------------------------------ grafos
    private record Arista(String o, String d, double v, int ini, int fin) {}
    static IoInterpretacion grafos(IoParserTexto t) {
        String metodo = t.tiene("flujo\\s+maximo|maximo\\s+flujo") ? "flujo_maximo"
                : t.tiene("arbol\\s+de\\s+expansion|expansion\\s+minima|arbol\\s+(?:minimo|generador)|conectar\\s+(?:todas|todos|las|los|cada)") ? "arbol_minimo"
                : t.tiene("ruta\\s+(?:mas\\s+corta|minima|optima)|camino\\s+(?:mas\\s+corto|minimo)|trayecto\\s+(?:mas\\s+corto|minimo)|distancia\\s+minima") ? "ruta_corta" : null;
        if (metodo == null) return null;
        List<Arista> aristas = new ArrayList<>(); boolean flechas = false;
        var filas = t.filasTabla();
        if (filas.size() >= 3) {
            for (var f : filas) {
                if (f.size() != 3 || t.esNumerica(f.get(0)) || t.esNumerica(f.get(1)) || f.get(0).vacia() || f.get(1).vacia()) continue;
                double[] z = t.celdaValor(f.get(2)); if (z == null) continue;
                aristas.add(new Arista(f.get(0).texto(), f.get(1).texto(), z[0], f.get(0).ini(), f.get(2).fin()));
            }
        }
        if (aristas.size() < 2) {
            aristas.clear();
            String nodo = "(?:" + ID + "|nodo\\s*\\d+)";
            Pattern[] formas = {
                Pattern.compile("\\bde\\s+(?<o>" + nodo + ")\\s+(?:a|hasta|hacia)\\s+(?<d>" + nodo + ")\\s*(?:\\(|:|=|,|con|es\\s+de)?\\s*\\$?\\s*" + num("k")),
                Pattern.compile("(?<![\\p{L}])(?<o>" + nodo + ")\\s*(?<f>→|->|=>|-|–)\\s*(?<d>" + nodo + ")\\s*(?:\\(|:|=)?\\s*\\$?\\s*" + num("k")),
                Pattern.compile("\\bentre\\s+(?<o>" + nodo + ")\\s+y\\s+(?<d>" + nodo + ")[^.;?!0-9\\n]{0,30}?\\$?\\s*" + num("k"))};
            for (Pattern pat : formas) {
                Matcher m = pat.matcher(t.n);
                while (m.find()) {
                    if (!t.libre(m, "k")) continue;
                    String f = pat == formas[1] ? m.group("f") : ""; if (f.equals("→") || f.equals("->") || f.equals("=>")) flechas = true;
                    aristas.add(new Arista(t.original.substring(m.start("o"), m.end("o")).replaceAll("\\s+", ""), t.original.substring(m.start("d"), m.end("d")).replaceAll("\\s+", ""), t.valor(m, "k"), m.start("k"), m.end("k")));
                }
                if (aristas.size() >= 2) break;
                aristas.clear(); flechas = false;
            }
        }
        if (aristas.size() < 2) return null;
        if (aristas.size() > 80) return t.incompleto("La red tiene más de 80 aristas.", "Reduce la red a 80 aristas o menos.");
        Set<String> nodos = new LinkedHashSet<>(); for (Arista a : aristas) { nodos.add(a.o()); nodos.add(a.d()); }
        for (Arista a : aristas) if (a.o().equals(a.d())) return t.incompleto("Una arista une un nodo consigo mismo.", "Revisa la arista " + a.o() + "-" + a.d() + ": debe unir dos nodos distintos.");
        for (Arista a : aristas) if (a.v() < 0 && !metodo.equals("arbol_minimo")) return t.incompleto("Una distancia o capacidad es negativa.", "Indica valores no negativos para las aristas.");
        String origen = null, destino = null; List<int[]> spans = new ArrayList<>();
        if (!metodo.equals("arbol_minimo")) {
            String nodo = "(?:" + ID + "|nodo\\s*\\d+)";
            Matcher m = Pattern.compile("(?:\\bde(?:sde)?|\\bentre)\\s+(?:la\\s+|el\\s+)?(?:(?:fuente|origen|nodo|ciudad|estacion)\\s+)?(?<o>" + nodo + ")\\s+(?:a|hasta|al|hacia|y)\\s+(?:la\\s+|el\\s+)?(?:(?:destino|sumidero|nodo|ciudad|estacion)\\s+)?(?<d>" + nodo + ")(?!\\s*(?:\\(|:|=)?\\s*\\$?\\d)").matcher(t.n);
            if (m.find()) { origen = t.original.substring(m.start("o"), m.end("o")).replaceAll("\\s+", ""); destino = t.original.substring(m.start("d"), m.end("d")).replaceAll("\\s+", ""); }
            else {
                Matcher o = Pattern.compile("(?:origen|fuente|salida)\\s+(?:es\\s+)?(?:el\\s+|la\\s+)?(?:nodo\\s+)?(?<o>" + nodo + ")[^.?!]{0,30}?(?:destino|sumidero|llegada)\\s+(?:es\\s+)?(?:el\\s+|la\\s+)?(?:nodo\\s+)?(?<d>" + nodo + ")").matcher(t.n);
                if (o.find()) { origen = t.original.substring(o.start("o"), o.end("o")).replaceAll("\\s+", ""); destino = t.original.substring(o.start("d"), o.end("d")).replaceAll("\\s+", ""); }
            }
            if (origen == null) return t.incompleto("No se identificó el nodo de origen y el de destino.", "¿Cuáles son el nodo de origen y el nodo de destino" + (metodo.equals("flujo_maximo") ? " (fuente y sumidero)?" : " de la ruta?"));
            if (!nodos.contains(origen) || !nodos.contains(destino)) return t.incompleto("El origen o el destino no aparecen en la red.", "Los nodos " + origen + " y " + destino + " deben aparecer en alguna arista.");
        }
        for (Arista a : aristas) spans.add(new int[]{a.ini(), a.fin()});
        spans.forEach(s -> t.marcar(s[0], s[1]));
        ArrayNode lista = JSON.createArrayNode();
        for (Arista a : aristas) lista.add(JSON.createObjectNode().put("origen", a.o()).put("destino", a.d()).put("valor", a.v()));
        ObjectNode datos = JSON.createObjectNode(); datos.set("aristas", lista);
        List<String> sup = new ArrayList<>();
        if (!metodo.equals("arbol_minimo")) {
            datos.put("origen", origen).put("destino", destino);
            boolean dir = metodo.equals("flujo_maximo") ? !t.tiene("no\\s+dirigid|bidireccional|ambos\\s+sentidos|doble\\s+sentido")
                    : flechas || t.tiene("\\bdirigid|una\\s+sola\\s+via|sentido\\s+unico|unidireccional");
            boolean explicitoNo = t.tiene("bidireccional|ambos\\s+sentidos|doble\\s+sentido|no\\s+dirigid");
            if (metodo.equals("flujo_maximo") || dir || explicitoNo) { datos.put("dirigido", dir); if (metodo.equals("flujo_maximo")) sup.add(dir ? "Los arcos son dirigidos y el valor de cada uno es su capacidad." : "Los arcos se tratan como no dirigidos."); }
            if (!metodo.equals("flujo_maximo")) sup.add(dir ? "Los arcos son dirigidos (solo se recorren en el sentido indicado)." : "Se supone que cada arista se puede recorrer en ambos sentidos.");
        } else sup.add("Las aristas son no dirigidas; se busca el árbol que conecta todos los nodos con la menor longitud total (Kruskal).");
        return t.listo("grafos", metodo, datos, List.of(), sup, List.of());
    }
}
