package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.IoParserTexto.*;

/** Cadenas de Markov, inventarios (EOQ, faltantes, EPQ, descuentos, reorden, período fijo) y colas M/M/1 y M/M/s. */
final class IoParserEstocastico {
    private static final String ID = "(?:" + COD + ")";
    private static final String PERIODO = "(?:(?:al|por|cada|a\\s+la)\\s+(?<p1>ano|mes|semana|dia|trimestre|semestre|bimestre)|(?<p2>anual(?:es)?|mensual(?:es)?|semanal(?:es)?|diari[oa]s?|trimestral(?:es)?|semestral(?:es)?|bimestral(?:es)?))";
    private static final String SRV = "(?:servidor(?:es)?|cajer[oa]s?|cajas?|ventanillas?|operador(?:es|a|as)?|mostradores?|empleados?|mecanicos?|medicos?|enfermer[oa]s?|lineas?|canales|taquillas?|barberos?|estaciones|puestos?|dependientes?|vendedor(?:es)?|agentes?|recepcionistas?|bahias?|muelles?)";

    /** Cifras que se confirman (consumen) solo cuando el tema queda aceptado. */
    private static final class Ctx {
        final IoParserTexto t; final Set<Integer> usados = new HashSet<>(); final List<int[]> spans = new ArrayList<>();
        final List<String> preguntas = new ArrayList<>(), supuestos = new ArrayList<>();
        Ctx(IoParserTexto t) { this.t = t; }
        boolean libre(Matcher m, String g) { return t.libre(m, g) && !usados.contains(m.start(g)); }
        void tomar(Matcher m, String g) { usados.add(m.start(g)); spans.add(new int[]{m.start(g), m.end(g)}); }
        void tomar(int a, int b) { usados.add(a); spans.add(new int[]{a, b}); }
        void confirmar() { spans.forEach(s -> t.marcar(s[0], s[1])); }
        /** Primera coincidencia con la cifra "k" libre; la toma y devuelve su matcher (o null). */
        Matcher buscar(String regex) {
            Matcher m = Pattern.compile(regex).matcher(t.n);
            while (m.find()) if (libre(m, "k")) { tomar(m, "k"); return m; }
            return null;
        }
    }
    private static String periodo(Matcher m) {
        String p = m.group("p1") != null ? m.group("p1") : m.group("p2");
        if (p == null) return null;
        return p.startsWith("ano") || p.startsWith("anual") ? "ano" : p.startsWith("mes") || p.startsWith("mensual") ? "mes" : p.startsWith("semana") || p.startsWith("semanal") ? "semana"
                : p.startsWith("dia") || p.startsWith("diari") ? "dia" : p.startsWith("trimestr") ? "trimestre" : p.startsWith("semestr") ? "semestre" : "bimestre";
    }
    private static String nombrePeriodo(String p) { return switch (p) { case "ano" -> "año"; case "dia" -> "día"; default -> p; }; }
    private static double factor(String p, Double diasAno) {
        return switch (p) { case "ano" -> 1; case "semestre" -> 2; case "trimestre" -> 4; case "bimestre" -> 6; case "mes" -> 12; case "semana" -> 52; default -> diasAno == null ? Double.NaN : diasAno; };
    }

    // ================================================================== Markov
    static IoInterpretacion markov(IoParserTexto t) {
        if (!t.tiene("markov|matriz\\s+de\\s+transicion|probabilidad(?:es)?\\s+de\\s+transicion|\\bpermanec|se\\s+queda\\s+en|participacion\\s+de\\s+mercado|cuota\\s+de\\s+mercado|estado\\s+estable|estacionari|cadena\\s+de|\\bsi\\s+hoy\\s+(?:es|esta)")) return null;
        Ctx c = new Ctx(t);
        List<String> estados = new ArrayList<>(); List<List<Double>> P = new ArrayList<>(); List<Double> inicial = null;
        IoParserMatrices.Tabla tb = IoParserMatrices.tabla(t);
        if (tb != null) {
            List<Integer> filasP = new ArrayList<>(); int idxIni = -1;
            for (int i = 0; i < tb.filas().size(); i++) { if (IoParserLocal.normalizar(tb.etiquetas().get(i)).matches(".*(?:inicial|hoy|actual).*")) idxIni = i; else filasP.add(i); }
            int n = filasP.size(); boolean cuadrada = n >= 2;
            for (int i : filasP) { var f = tb.filas().get(i); if (f.size() != n || f.stream().anyMatch(x -> Double.isNaN(x))) cuadrada = false; }
            if (cuadrada) {
                for (int i : filasP) P.add(tb.filas().get(i));
                if (tb.enc().size() == n) estados.addAll(tb.enc()); else if (tb.enc().size() == n + 1) estados.addAll(tb.enc().subList(1, n + 1));
                else for (int i : filasP) estados.add(tb.etiquetas().get(i));
                if (idxIni >= 0) { inicial = tb.filas().get(idxIni); if (inicial.size() != n) inicial = null; }
                tb.spans().forEach(s -> c.tomar(s[0], s[1]));
            } else tb = null;
        }
        if (P.isEmpty()) {
            Map<String, Map<String, Double>> filas = new LinkedHashMap<>();
            if (!filasPorcentaje(t, c, filas)) filasSi(t, c, filas);
            if (filas.isEmpty()) return null;
            estados.addAll(filas.keySet());
            for (var e : filas.entrySet()) for (String d : e.getValue().keySet()) if (!estados.contains(d)) { estados.add(d); }
            for (String s : estados) {
                if (!filas.containsKey(s)) { c.preguntas.add("Falta la fila del estado «" + s + "»: ¿a qué estados pasa y con qué probabilidad?"); continue; }
                List<Double> f = new ArrayList<>(); for (String d : estados) f.add(filas.get(s).getOrDefault(d, 0.0)); P.add(f);
            }
        }
        if (!c.preguntas.isEmpty()) return t.incompleto("Matriz de transición incompleta.", c.preguntas);
        int n = estados.size();
        for (int i = 0; i < n; i++) {
            double suma = P.get(i).stream().mapToDouble(Double::doubleValue).sum();
            if (P.get(i).stream().anyMatch(x -> x < 0 || x > 1)) c.preguntas.add("Una probabilidad de la fila del estado «" + estados.get(i) + "» no está entre 0 y 1.");
            else if (Math.abs(suma - 1) > 1e-9) c.preguntas.add("La fila del estado «" + estados.get(i) + "» suma " + fmt(Math.rint(suma * 1e6) / 1e6) + ", no 1: ¿qué probabilidad falta o sobra?");
        }
        if (!c.preguntas.isEmpty()) return t.incompleto("La matriz de transición no es estocástica.", c.preguntas);
        boolean largoPlazo = t.tiene("largo\\s+plazo|estacionari|estado\\s+estable|equilibrio|a\\s+la\\s+larga");
        if (inicial == null) inicial = distribucionInicial(t, c, estados);
        Matcher mn = Pattern.compile("(?:despues\\s+de|dentro\\s+de|al\\s+cabo\\s+de|tras|luego\\s+de|en|durante)\\s+" + num("k") + "\\s+(?:pasos?|periodos?|transiciones|meses|dias|semanas|anos|etapas?|generaciones|jugadas|visitas|compras|ciclos|veces|minutos|horas)").matcher(t.n);
        Integer pasos = null;
        while (mn.find() && pasos == null) if (c.libre(mn, "k")) { double v = t.valor(mn, "k"); if (v == Math.rint(v) && v >= 0 && v <= 500) { pasos = (int) v; c.tomar(mn, "k"); } }
        List<String> sup = new ArrayList<>(List.of("Estados en este orden: " + String.join(", ", estados) + "."));
        if (inicial == null) {
            if (largoPlazo) { inicial = new ArrayList<>(); for (int i = 0; i < n; i++) inicial.add(i == 0 ? 1.0 : 0.0); sup.add("No se dio la distribución inicial: la distribución estacionaria no depende de ella; se usa el estado «" + estados.get(0) + "» solo para completar el formato."); }
            else return t.incompleto("Falta la distribución inicial.", "¿En qué estado (o con qué distribución de probabilidades) comienza el sistema?");
        }
        if (inicial.size() != n || Math.abs(inicial.stream().mapToDouble(Double::doubleValue).sum() - 1) > 1e-9) return t.incompleto("La distribución inicial no es válida.", "La distribución inicial debe tener un valor por estado (" + n + ") y sumar 1.");
        if (pasos == null) {
            if (largoPlazo) { pasos = 0; sup.add("Sin número de pasos: se calcula la distribución estacionaria."); }
            else return t.incompleto("Falta el número de pasos.", "¿Después de cuántos pasos (periodos) se quiere la distribución?");
        }
        if (!c.preguntas.isEmpty()) return t.incompleto("Datos de Markov incompletos.", c.preguntas);
        c.confirmar();
        ObjectNode datos = JSON.createObjectNode(); datos.set("P", mat(P)); datos.set("inicial", arr(inicial)); datos.put("n", pasos.intValue());
        return t.listo("markov", "discreto", datos, List.of(), sup, List.of());
    }
    private static String clave(IoParserTexto t, int a, int b) { return t.original.substring(a, b).replaceAll("\\s+", " ").strip(); }
    private static boolean filasPorcentaje(IoParserTexto t, Ctx c, Map<String, Map<String, Double>> filas) {
        Pattern entrada = Pattern.compile(num("k") + "\\s*(?:%|por\\s+ciento)[^.;?!0-9%]{0,50}?\\b(?:(?<st>permanece|permanecen|se\\s+queda|se\\s+quedan|continua|continuan|sigue|siguen|repite|se\\s+mantiene|se\\s+mantienen)\\s+(?:con|en|a)|(?<ch>cambia|cambian|pasa|pasan|se\\s+cambia|se\\s+cambian|migra|migran|se\\s+mueve|se\\s+mueven|va|van|se\\s+va|se\\s+van|compra|compran|prefiere|prefieren)\\s+(?:a|hacia|al|con))\\s+(?:la\\s+marca\\s+|el\\s+estado\\s+|marca\\s+|estado\\s+)?(?<t>" + ID + ")");
        Pattern fuente = Pattern.compile("\\b(?:de|desde)\\s+(?:la\\s+marca\\s+|el\\s+estado\\s+|marca\\s+|estado\\s+)?(?<s>" + ID + ")");
        boolean alguna = false;
        for (int[] fr : t.frases()) {
            Matcher e = entrada.matcher(t.n); e.region(fr[0], fr[1]);
            List<Object[]> entradas = new ArrayList<>(); String propio = null;
            while (e.find()) {
                if (!c.libre(e, "k")) continue;
                String dest = clave(t, e.start("t"), e.end("t")); boolean queda = e.group("st") != null;
                if (queda) propio = dest;
                entradas.add(new Object[]{e.start("k"), e.end("k"), t.valor(e, "k") / 100, dest, queda, e.start()});
            }
            for (Object[] x : entradas) {
                String origen = (boolean) x[4] ? (String) x[3] : null;
                if (origen == null) {
                    Matcher f = fuente.matcher(t.n); f.region(fr[0], (int) x[5]); String ult = null;
                    while (f.find()) ult = clave(t, f.start("s"), f.end("s"));
                    origen = ult != null ? ult : propio;
                }
                if (origen == null) { c.preguntas.add("No se sabe de qué estado parte el " + fmt((double) x[2] * 100) + "% que pasa a «" + x[3] + "»."); continue; }
                Map<String, Double> fila = filas.computeIfAbsent(origen, k -> new LinkedHashMap<>());
                if (fila.put((String) x[3], (double) x[2]) != null) c.preguntas.add("La transición de «" + origen + "» a «" + x[3] + "» aparece dos veces.");
                c.tomar((int) x[0], (int) x[1]); alguna = true;
            }
        }
        return alguna;
    }
    private static void filasSi(IoParserTexto t, Ctx c, Map<String, Map<String, Double>> filas) {
        Pattern fuente = Pattern.compile("\\bsi\\s+(?:hoy\\s+|ahora\\s+|actualmente\\s+|el\\s+sistema\\s+|el\\s+proceso\\s+)?(?:es|esta|se\\s+encuentra\\s+en|estaba|fue)\\s+(?:en\\s+)?(?:el\\s+estado\\s+)?(?<s>[a-z]{3,})");
        Pattern prob = Pattern.compile("(?<t>[a-z]{3,})\\s+con\\s+(?:una\\s+)?probabilidad\\s+(?:de\\s+)?" + num("k") + "(?<pc>\\s*%)?");
        for (int[] fr : t.frases()) {
            Matcher f = fuente.matcher(t.n); f.region(fr[0], fr[1]);
            if (!f.find()) continue;
            String origen = f.group("s"); Matcher p = prob.matcher(t.n); p.region(f.end(), fr[1]);
            while (p.find()) {
                if (!c.libre(p, "k")) continue;
                double v = t.valor(p, "k") / (p.group("pc") != null ? 100 : 1);
                if (filas.computeIfAbsent(origen, k -> new LinkedHashMap<>()).put(p.group("t"), v) != null) c.preguntas.add("La transición de «" + origen + "» a «" + p.group("t") + "» aparece dos veces.");
                c.tomar(p, "k");
            }
        }
    }
    private static List<Double> distribucionInicial(IoParserTexto t, Ctx c, List<String> estados) {
        int n = estados.size();
        // participaciones: "la marca A tiene el 50% del mercado y B el 50%", "40% usa A y 60% usa B"
        for (int[] fr : t.frases()) {
            String f = t.n.substring(fr[0], fr[1]);
            if (!f.matches("(?s).*(?:actualmente|hoy|inicial|ahora|al\\s+inicio|en\\s+este\\s+momento|participacion).*") || f.matches("(?s).*(?:permanece|cambia|pasa a|se queda).*") || f.strip().startsWith("si ")) continue;
            double[] v = new double[n]; boolean[] visto = new boolean[n]; List<int[]> sp = new ArrayList<>();
            Matcher a = Pattern.compile("(?:(?:la\\s+)?(?:marca|estado)\\s+)?(?<s>" + ID + "|[a-z]{3,})\\s+(?:(?:tiene|con|posee|domina|abarca|cuenta\\s+con)\\s+)?(?:el\\s+)?" + num("k") + "\\s*%").matcher(t.n); a.region(fr[0], fr[1]);
            Matcher b = Pattern.compile(num("k") + "\\s*%\\s+(?:de\\s+los\\s+[a-z]+\\s+)?(?:usa|usan|compra|compran|prefiere|prefieren|esta|estan|estan\\s+en|esta\\s+en)\\s+(?:la\\s+marca\\s+|el\\s+estado\\s+)?(?<s>" + ID + "|[a-z]{3,})").matcher(t.n); b.region(fr[0], fr[1]);
            for (Matcher m : List.of(a, b)) while (m.find()) {
                if (!c.libre(m, "k")) continue;
                int i = indice(estados, clave(t, m.start("s"), m.end("s")));
                if (i >= 0 && !visto[i]) { v[i] = t.valor(m, "k") / 100; visto[i] = true; sp.add(new int[]{m.start("k"), m.end("k")}); }
            }
            boolean todos = true; for (boolean x : visto) todos &= x;
            if (todos) { sp.forEach(s -> c.tomar(s[0], s[1])); List<Double> r = new ArrayList<>(); for (double x : v) r.add(x); return r; }
        }
        // estado de partida: "Comienza en el estado A", "Hoy está soleado", "Inicialmente ... en el estado 1"
        for (int[] fr : t.frases()) {
            String f = t.n.substring(fr[0], fr[1]);
            if (f.strip().startsWith("si ") || !f.matches("(?s).*(?:comienza|empieza|inicia|arranca|parte|inicialmente|al\\s+inicio|\\bhoy\\b|actualmente|ahora).*")) continue;
            for (int i = 0; i < n; i++) {
                String alias = IoParserLocal.normalizar(estados.get(i)).replaceAll("\\s+", " ");
                Matcher m;
                String num = alias.replaceAll("^\\D*(\\d+)$", "$1");
                if (num.matches("\\d+")) m = Pattern.compile("\\bestado\\s+" + num("k") + "(?!\\d)").matcher(t.n);
                else m = null;
                if (m != null) { m.region(fr[0], fr[1]); if (m.find() && c.libre(m, "k") && t.valor(m, "k") == Double.parseDouble(num)) { c.tomar(m, "k"); return uno(n, i); } continue; }
                Matcher q = Pattern.compile("(?<![\\p{L}])" + patronEstado(t, estados.get(i)) + "(?![\\p{L}0-9])").matcher(t.n); q.region(fr[0], fr[1]);
                if (q.find()) return uno(n, i);
            }
        }
        return null;
    }
    /** Nombre de estado tal como aparece en el texto normalizado (las letras sueltas A, B, P1 usan el rango privado). */
    private static String patronEstado(IoParserTexto t, String nombre) {
        if (nombre.matches("[A-Z][0-9]{0,2}")) return Pattern.quote((char) ('\uE001' + (nombre.charAt(0) - 'A')) + nombre.substring(1));
        return Pattern.quote(IoParserLocal.normalizar(nombre));
    }
    private static double valorEn(IoParserTexto t, int pos) { var k = t.tok(pos); return k == null ? Double.NaN : k.valor(); }
    private static int indice(List<String> estados, String clave) {
        for (int i = 0; i < estados.size(); i++) if (estados.get(i).equalsIgnoreCase(clave)) return i;
        return -1;
    }
    private static List<Double> uno(int n, int i) { List<Double> r = new ArrayList<>(); for (int k = 0; k < n; k++) r.add(k == i ? 1.0 : 0.0); return r; }

    // ================================================================== inventarios
    static IoInterpretacion inventarios(IoParserTexto t) {
        if (!t.tiene("lote\\s+economico|\\beoq\\b|punto\\s+de\\s+reorden|nivel\\s+de\\s+servicio|periodo\\s+fijo|revision\\s+periodica|costo\\s+(?:por|de)\\s+(?:pedido|ordenar|emitir|preparar)|costo\\s+(?:anual\\s+)?de\\s+mantener|demanda\\s+(?:anual|mensual|semanal|diaria)|faltantes|descuentos?\\s+por\\s+(?:cantidad|volumen)|tamano\\s+(?:optimo\\s+)?(?:de\\s+)?(?:lote|pedido)|cantidad\\s+economica|stock\\s+de\\s+seguridad|inventario\\s+de\\s+seguridad|tiempo\\s+de\\s+entrega|\\bcada\\s+pedido|mantener\\s+una\\s+unidad")) return null;
        Ctx c = new Ctx(t);
        boolean fijo = t.tiene("periodo\\s+fijo|revision\\s+periodica|revis\\w+\\s+(?:su\\s+|el\\s+)?inventario\\s+cada|nivel\\s+objetivo|periodo\\s+de\\s+revision");
        boolean reorden = !fijo && t.tiene("punto\\s+de\\s+reorden|nivel\\s+de\\s+servicio|stock\\s+de\\s+seguridad|inventario\\s+de\\s+seguridad|tiempo\\s+de\\s+entrega|lead\\s+time");
        if (fijo || reorden) return reposicion(t, c, fijo);
        Double diasAno = diasAno(t, c);
        Matcher dm = c.buscar("\\bdemanda\\s+(?:anual|mensual|semanal|diaria|trimestral|semestral|bimestral)\\b[^.;?!0-9]{0,60}?" + num("k"));
        String pD = null;
        if (dm != null) pD = periodoAdjetivo(dm.group().substring(0, Math.min(dm.group().length(), 30)));
        if (dm == null) { dm = c.buscar("\\bdemanda\\b[^.;?!0-9]{0,40}?" + num("k") + "\\s*(?:[a-z]+\\s+){0,2}?" + PERIODO); if (dm != null) pD = periodo(dm); }
        if (dm == null) { dm = c.buscar("(?:\\bvend\\w+|\\bconsum\\w+|\\butiliz\\w+|\\busa\\w*|\\brequier\\w+|\\bnecesit\\w+|se\\s+venden|se\\s+consumen)[^.;?!0-9]{0,30}?" + num("k") + "\\s*(?:[a-z]+\\s+){0,2}?" + PERIODO); if (dm != null) pD = periodo(dm); }
        Double D = dm == null ? null : t.valor(dm, "k");
        if (D != null) {
            double f = factor(pD, diasAno);
            if (Double.isNaN(f)) c.preguntas.add("La demanda está dada por día: ¿cuántos días al año se trabaja (250, 300, 365…)? Con ese dato se convierte a demanda anual.");
            else { if (f != 1) c.supuestos.add("Demanda " + fmt(D) + " por " + nombrePeriodo(pD) + " × " + fmt(f) + " " + (pD.equals("dia") ? "días" : pD.equals("mes") ? "meses" : pD.equals("semana") ? "semanas" : "periodos") + " al año = " + fmt(D * f) + " unidades al año."); D = D * f; }
        } else c.preguntas.add("¿Cuál es la demanda D (con su periodo: anual, mensual, semanal…)?");
        boolean anual = "ano".equals(pD);
        Double S = null;
        Matcher sm = c.buscar("(?:costo|cuesta|cargo|gasto)\\b[^.;?!0-9]{0,40}?\\b(?:pedido|orden|ordenar|emitir|colocar|preparar|preparacion|corrida|arranque|setup|puesta\\s+en\\s+marcha|lanzar)\\w*[^.;?!0-9]{0,45}?(?:es\\s+de\\s+|de\\s+|cuesta\\s+|:)?\\$?\\s*" + num("k"));
        if (sm == null) sm = c.buscar("\\b(?:cada|un|una|por)\\s+(?:pedido|orden|corrida|lote)\\w*[^.;?!0-9]{0,30}?(?:cuesta|cuestan|cobra|genera\\s+un\\s+costo\\s+de|implica\\s+un\\s+costo\\s+de|tiene\\s+un\\s+costo\\s+de)\\s*(?:de\\s+)?\\$?\\s*" + num("k"));
        if (sm != null) S = t.valor(sm, "k"); else c.preguntas.add("¿Cuál es el costo S de cada pedido (o de preparar cada corrida)?");
        // descuentos por cantidad
        List<double[]> tramos = tramos(t, c);
        boolean descuentos = tramos != null && tramos.size() >= 2;
        Double H = null, i = null, costoUnit = null;
        Matcher hp = c.buscar("\\b(?:mantener|mantenimiento|almacenar|almacenamiento|conservar|tenencia|posesion)\\w*[^.;?!0-9]{0,60}?(?:es\\s+(?:de\\s+|el\\s+)?|de\\s+|:)?" + num("k") + "\\s*(?:%|por\\s+ciento)");
        if (hp != null) i = t.valor(hp, "k") / 100;
        else {
            Matcher hm = c.buscar("\\b(?:mantener|mantenimiento|almacenar|almacenamiento|conservar|tenencia|posesion|mantiene)\\w*[^.;?!0-9]{0,60}?(?:es\\s+de\\s+|de\\s+|cuesta\\s+|:)?\\$?\\s*" + num("k") + "(?!\\s*(?:%|por\\s+ciento))");
            if (hm != null) H = convertirH(t, hm, t.valor(hm, "k"), pD, diasAno, c);
        }
        Matcher um = c.buscar("(?:precio|costo)\\s+(?:unitario|por\\s+unidad|de\\s+compra|de\\s+adquisicion|del\\s+articulo)[^.;?!0-9]{0,20}?(?:es\\s+de\\s+|de\\s+|:)?\\$?\\s*" + num("k"));
        if (um == null) um = c.buscar("\\bcada\\s+(?:unidad|articulo|pieza)\\s+(?:cuesta|vale)\\s+\\$?\\s*" + num("k"));
        if (um != null) costoUnit = t.valor(um, "k");
        boolean faltantes = !t.tiene("no\\s+se\\s+permit\\w+\\s+faltantes|sin\\s+faltantes") && t.tiene("\\bfaltantes?\\b|escasez|pedidos?\\s+pendientes");
        Double p = null;
        if (faltantes) {
            Matcher pm = c.buscar("\\b(?:faltantes?|escasez|agotamiento|pedidos?\\s+pendientes)\\b[^.;?!0-9]{0,60}?(?:costo|cuesta|penalizacion|multa|cargo)[^.;?!0-9]{0,40}?\\$?\\s*" + num("k"));
            if (pm == null) pm = c.buscar("costo\\s+(?:por|de)\\s+(?:cada\\s+)?(?:unidad\\s+)?(?:faltante|escasez)\\w*[^.;?!0-9]{0,40}?\\$?\\s*" + num("k"));
            if (pm != null) { p = convertirH(t, pm, t.valor(pm, "k"), pD, diasAno, c); } else c.preguntas.add("Se permiten faltantes: ¿cuál es el costo p por unidad faltante por año?");
        }
        Double P = null;
        boolean epq = t.tiene("tasa\\s+de\\s+produccion|lote\\s+de\\s+produccion|capacidad\\s+de\\s+produccion|\\bproduce\\b|fabrica\\b|corrida") && !descuentos;
        if (epq) {
            Matcher pm = c.buscar("\\b(?:produc\\w*|fabric\\w*|elabor\\w*|tasa\\s+de\\s+produccion|capacidad\\s+de\\s+produccion|ritmo\\s+de\\s+produccion)\\b[^.;?!0-9]{0,40}?(?:a\\s+razon\\s+de\\s+|de\\s+|es\\s+de\\s+)?" + num("k") + "\\s*(?:[a-z]+\\s+){0,2}?" + PERIODO);
            if (pm != null) { P = t.valor(pm, "k"); double f = factor(periodo(pm), diasAno); if (Double.isNaN(f)) c.preguntas.add("La tasa de producción está por día: ¿cuántos días al año se trabaja?"); else P *= f; }
            else epq = false;
        }
        String metodo = descuentos ? "descuentos" : epq ? "epq" : faltantes && p != null ? "faltantes" : "eoq";
        if (descuentos) {
            if (i == null) c.preguntas.add("Para los descuentos por cantidad indica el costo de mantener como porcentaje del precio (por ejemplo 20% anual).");
        } else if (H == null) {
            if (i != null && costoUnit != null) { H = i * costoUnit; c.supuestos.add("H = " + fmt(i * 100) + "% × precio unitario " + fmt(costoUnit) + " = " + fmt(H) + " por unidad al año."); }
            else if (i != null) c.preguntas.add("El costo de mantener es un porcentaje: ¿de qué precio o costo unitario?");
            else c.preguntas.add("¿Cuál es el costo H de mantener una unidad en inventario por año?");
        } else if (costoUnit != null) c.supuestos.add("El precio unitario (" + fmt(costoUnit) + ") no altera el lote óptimo; el costo total del modelo no incluye el costo de compra.");
        if (metodo.equals("epq") && D != null && P != null && P <= D) c.preguntas.add("La producción anual (" + fmt(P) + ") debe ser mayor que la demanda anual (" + fmt(D) + ").");
        if (!c.preguntas.isEmpty()) return t.incompleto("Datos insuficientes para el modelo de inventario.", c.preguntas.stream().distinct().toList());
        c.confirmar();
        ObjectNode datos = JSON.createObjectNode().put("D", D).put("S", S);
        if (metodo.equals("descuentos")) {
            datos.put("i", i); ArrayNode tr = JSON.createArrayNode();
            for (double[] x : tramos) tr.add(JSON.createObjectNode().put("min", x[0]).put("precio", x[1]));
            datos.set("tramos", tr);
        } else { datos.put("H", H); if (metodo.equals("faltantes")) datos.put("p", p); if (metodo.equals("epq")) datos.put("P", P); }
        c.supuestos.add(0, "Modelo " + metodo.toUpperCase() + " determinista: demanda constante" + (metodo.equals("epq") ? ", producción continua" : ", reposición instantánea") + (metodo.equals("faltantes") ? " con faltantes planeados" : metodo.equals("eoq") ? " y sin faltantes" : "") + ". D, S y H usan el año como unidad temporal.");
        return t.listo("inventarios", metodo, datos, List.of(variable("Q", "Cantidad por pedido", "unidades")), c.supuestos, List.of());
    }
    private static String periodoAdjetivo(String s) {
        Matcher m = Pattern.compile("(anual|mensual|semanal|diaria|trimestral|semestral|bimestral)").matcher(s);
        if (!m.find()) return "ano";
        return switch (m.group(1)) { case "anual" -> "ano"; case "mensual" -> "mes"; case "semanal" -> "semana"; case "diaria" -> "dia"; case "trimestral" -> "trimestre"; case "semestral" -> "semestre"; default -> "bimestre"; };
    }
    /** Costo por periodo (mes, semana…) a costo anual; sin periodo explícito se asume anual (misma base que D) solo si D es anual. */
    private static Double convertirH(IoParserTexto t, Matcher m, double valor, String pD, Double diasAno, Ctx c) {
        int a = Math.max(t.inicioFrase(m.start("k")), m.start() - 25), b = Math.min(t.finFrase(m.start("k")), m.end("k") + 30);
        Matcher pm = Pattern.compile(PERIODO).matcher(t.n); pm.region(a, b);
        if (pm.find()) {
            String per = periodo(pm); double f = factor(per, diasAno);
            if (Double.isNaN(f)) { c.preguntas.add("Un costo está dado por día: ¿cuántos días al año se trabaja para anualizarlo?"); return valor; }
            if (f != 1) c.supuestos.add("Costo " + fmt(valor) + " por " + nombrePeriodo(per) + " × " + fmt(f) + " = " + fmt(valor * f) + " por año.");
            return valor * f;
        }
        if (pD != null && !"ano".equals(pD)) c.preguntas.add("El costo " + fmt(valor) + " no dice su periodo y la demanda no es anual: ¿es por año, por mes…?");
        else c.supuestos.add("El costo " + fmt(valor) + " se tomó por año, la misma base que la demanda.");
        return valor;
    }
    private static Double diasAno(IoParserTexto t, Ctx c) {
        Matcher m = Pattern.compile("(?:trabaja\\w*|opera\\w*|labora\\w*|funciona\\w*|abre\\w*)[^.;?!0-9]{0,25}?" + num("k") + "\\s+dias\\s+(?:al|por|en\\s+un|cada)\\s+ano|" + num("k2") + "\\s+dias\\s+(?:laborables|habiles|laborales|de\\s+operacion|de\\s+trabajo)\\s+(?:al|por|en\\s+un|cada)\\s+ano|\\bano\\s+de\\s+" + num("k3") + "\\s+dias").matcher(t.n);
        while (m.find()) for (String g : List.of("k", "k2", "k3")) if (m.start(g) >= 0 && t.libre(m, g) && !c.usados.contains(m.start(g))) { c.tomar(m, g); return t.valor(m, g); }
        return null;
    }
    /** "$10 por unidad si se piden menos de 500 unidades y $9 por unidad si se piden 500 unidades o más". */
    private static List<double[]> tramos(IoParserTexto t, Ctx c) {
        if (!t.tiene("descuento|precio\\s+por\\s+cantidad|rangos?\\s+de\\s+precio|a\\s+partir\\s+de|o\\s+mas|menos\\s+de\\s+" + "\\d")) return null;
        Matcher pm = Pattern.compile("\\$\\s*" + num("k")).matcher(t.n); List<int[]> precios = new ArrayList<>();
        while (pm.find()) if (c.libre(pm, "k")) precios.add(new int[]{pm.start("k"), pm.end("k")});
        if (precios.size() < 2) return null;
        List<double[]> r = new ArrayList<>(); List<int[]> sp = new ArrayList<>();
        for (int j = 0; j < precios.size(); j++) {
            int ini = precios.get(j)[1], fin = j + 1 < precios.size() ? precios.get(j + 1)[0] - 1 : t.finFrase(ini);
            if (fin < ini) return null;
            String seg = t.n.substring(ini, Math.min(fin, t.n.length()));
            Matcher m;
            double min; int[] pos;
            if ((m = Pattern.compile(num("k") + "\\s*(?:unidad(?:es)?\\s+)?(?:a|-|hasta)\\s*" + num("k2")).matcher(seg)).find()) { min = valorEn(t, ini + m.start("k")); pos = new int[]{ini + m.start("k"), ini + m.end("k")}; sp.add(new int[]{ini + m.start("k2"), ini + m.end("k2")}); }
            else if ((m = Pattern.compile("menos\\s+de\\s+" + num("k")).matcher(seg)).find()) { min = 0; pos = new int[]{ini + m.start("k"), ini + m.end("k")}; }
            else if ((m = Pattern.compile("(?:a\\s+partir\\s+de|al\\s+menos|minimo\\s+de|desde)\\s+" + num("k")).matcher(seg)).find() || (m = Pattern.compile(num("k") + "\\s*(?:unidad(?:es)?\\s+)?(?:o\\s+mas|en\\s+adelante|o\\s+mayor)").matcher(seg)).find()) { min = valorEn(t, ini + m.start("k")); pos = new int[]{ini + m.start("k"), ini + m.end("k")}; }
            else return null;
            r.add(new double[]{min, valorEn(t, precios.get(j)[0])}); sp.add(pos); sp.add(precios.get(j));
        }
        sp.forEach(s -> c.tomar(s[0], s[1]));
        return r;
    }

    // ------------------------------------------------------------------ reorden y período fijo
    private static IoInterpretacion reposicion(IoParserTexto t, Ctx c, boolean fijo) {
        Matcher dm = c.buscar("\\bdemanda\\s+(?<p>diaria|semanal|mensual)(?:\\s+(?:promedio|media|esperada))?[^.;?!0-9]{0,40}?" + num("k"));
        String base = null; Double d = null;
        if (dm != null) { d = t.valor(dm, "k"); base = dm.group("p").startsWith("diaria") ? "dia" : dm.group("p").startsWith("semanal") ? "semana" : "mes"; }
        else { dm = c.buscar("\\bdemanda\\b[^.;?!0-9]{0,40}?" + num("k") + "\\s*(?:[a-z]+\\s+){0,2}?(?:(?:por|al|cada|a\\s+la)\\s+(?<p>dia|semana|mes))"); if (dm != null) { d = t.valor(dm, "k"); base = dm.group("p"); } }
        if (d == null) c.preguntas.add("¿Cuál es la demanda d por unidad de tiempo (por día, semana…)?");
        Double L = null; String uL = null;
        Matcher lm = c.buscar("(?:(?:tiempo|plazo)\\s+de\\s+(?:entrega|reposicion|abastecimiento)|\\btarda\\w*|\\bdemora\\w*|\\bentrega\\w*|lead\\s+time)[^.;?!0-9]{0,30}?" + num("k") + "\\s*(?<u>dias?|semanas?|meses|mes)");
        if (lm != null) { L = t.valor(lm, "k"); uL = lm.group("u").startsWith("dia") ? "dia" : lm.group("u").startsWith("semana") ? "semana" : "mes"; }
        else c.preguntas.add("¿Cuál es el tiempo de entrega L (días, semanas…)?");
        Double sigma = null; String uS = null; boolean sigmaEntrega = false;
        Matcher sm = c.buscar("desviacion\\s+(?:estandar|tipica)[^.;?!0-9]{0,50}?" + num("k") + "\\s*(?:unidad(?:es)?\\s*)?(?:(?:por|al|a\\s+la|cada)\\s*(?<u>dia|semana|mes))?");
        if (sm != null) { sigma = t.valor(sm, "k"); uS = sm.group("u"); sigmaEntrega = sm.group().matches("(?s).*(?:durante|en)\\s+el\\s+tiempo\\s+de\\s+entrega.*"); }
        else c.preguntas.add("¿Cuál es la desviación estándar de la demanda y en qué unidad de tiempo?");
        Double z = null;
        Matcher zm = c.buscar("nivel\\s+de\\s+servicio[^.;?!0-9]{0,30}?" + num("k") + "(?<pc>\\s*%)?");
        if (zm != null) {
            double v = t.valor(zm, "k"), pr = zm.group("pc") != null || v > 1 ? v / 100 : v;
            if (pr <= 0.5 || pr >= 1) c.preguntas.add("El nivel de servicio debe estar entre 50% y 100% (excluido el 100%).");
            else { z = Math.rint(zNormal(pr) * 1e4) / 1e4; c.supuestos.add("Nivel de servicio " + fmt(pr * 100) + "% → z = " + fmt(z) + " (cuantil de la normal estándar)."); }
        } else { zm = c.buscar("\\bz\\s*=\\s*" + num("k")); if (zm != null) z = t.valor(zm, "k"); else c.preguntas.add("¿Cuál es el nivel de servicio (por ejemplo 95%) o el factor z?"); }
        Double T = null, inv = null;
        if (fijo) {
            Matcher tm = c.buscar("(?:revis\\w+|periodo\\s+de\\s+revision)[^.;?!0-9]{0,40}?(?:cada\\s+|es\\s+de\\s+|de\\s+)?" + num("k") + "\\s*(?<u>dias?|semanas?|meses|mes)");
            if (tm != null && base != null) { T = convertirTiempo(t.valor(tm, "k"), tm.group("u"), base, c, "el período de revisión"); }
            else if (tm == null) c.preguntas.add("¿Cada cuántos días (o semanas) se revisa el inventario?");
            Matcher im = c.buscar("(?:\\bhay\\b|\\bexisten\\b|\\bse\\s+tienen\\b|\\btiene\\b|cuenta\\s+con|inventario\\s+(?:actual|disponible)\\s+(?:es\\s+de\\s+)?)[^.;?!0-9]{0,25}?" + num("k") + "\\s*(?:unidad(?:es)?|piezas?)(?:\\s+en\\s+(?:inventario|existencia|almacen))?");
            if (im != null) inv = t.valor(im, "k"); else c.preguntas.add("¿Cuál es la posición de inventario actual (existencias más pedidos en camino, menos faltantes)?");
        }
        if (base != null && L != null) L = convertirTiempo(L, uL, base, c, "el tiempo de entrega");
        if (base != null && sigma != null && uS != null && !uS.equals(base)) { Double f = convertirTiempo(1, uS, base, c, "la desviación estándar"); if (f != null) c.supuestos.add("Desviación estándar por " + uS + " convertida a la base " + base + " (σ no escala linealmente: confirma que sea σ por " + base + ")."); }
        if (sigma != null && sigmaEntrega && L != null && L > 0) { c.supuestos.add("σ dada durante el tiempo de entrega (" + fmt(sigma) + "): σ por unidad de tiempo = σ/√L."); sigma = sigma / Math.sqrt(L); }
        if (!c.preguntas.isEmpty()) return t.incompleto("Datos insuficientes para el modelo de reposición.", c.preguntas.stream().distinct().toList());
        c.confirmar();
        ObjectNode datos = JSON.createObjectNode().put("d", d).put("L", L).put("sigma", sigma).put("z", z);
        if (fijo) datos.put("T", T).put("inventario", inv);
        c.supuestos.add(0, "d, L, σ" + (fijo ? ", T" : "") + " usan " + (base.equals("dia") ? "el día" : "la " + base) + " como unidad de tiempo; la demanda de periodos distintos se supone independiente.");
        return t.listo("inventarios", fijo ? "periodo_fijo" : "reorden", datos, List.of(variable("R", fijo ? "Cantidad a pedir en cada revisión" : "Punto de reorden", "unidades")), c.supuestos, List.of());
    }
    /** Convierte un tiempo a la base solo si la equivalencia es exacta (semana = 7 días); mes↔semana/día se pregunta. */
    private static Double convertirTiempo(double v, String unidad, String base, Ctx c, String que) {
        String u = unidad.startsWith("dia") ? "dia" : unidad.startsWith("semana") ? "semana" : "mes";
        if (u.equals(base)) return v;
        if (u.equals("semana") && base.equals("dia")) { c.supuestos.add("1 semana = 7 días: " + que + " de " + fmt(v) + " semanas = " + fmt(v * 7) + " días."); return v * 7; }
        if (u.equals("dia") && base.equals("semana")) { c.supuestos.add("1 semana = 7 días: " + que + " de " + fmt(v) + " días = " + fmt(v / 7) + " semanas."); return v / 7; }
        c.preguntas.add("Ni " + que + " (en " + u + "s) ni la demanda (por " + base + ") comparten unidad y la equivalencia no es exacta: exprésalos en la misma unidad de tiempo.");
        return v;
    }

    // ================================================================== colas
    private static double segundos(String u) { return u.startsWith("seg") ? 1 : u.startsWith("min") ? 60 : u.startsWith("hor") ? 3600 : Double.NaN; }
    private static String unidadBase(String u) { return u.startsWith("seg") ? "segundo" : u.startsWith("min") ? "minuto" : u.startsWith("hor") ? "hora" : "dia"; }
    static IoInterpretacion colas(IoParserTexto t) {
        if (!t.tiene("\\bllegan?\\b|llegadas?|\\bcola\\b|fila\\s+de\\s+espera|servidor|cajero|ventanilla|lambda|m/m/|tiempo\\s+(?:medio\\s+|promedio\\s+)?(?:de\\s+)?servicio|tiempo\\s+entre\\s+llegadas|tasa\\s+de\\s+servicio|clientes\\s+por|\\batiende|\\batienden|operadores?|\\brecibe")) return null;
        if (t.tiene("determinista|tiempo\\s+fijo|prioridad|capacidad\\s+limitada|cola\\s+finita|m/d/|m/g/|\\bk\\s*=")) return IoInterpretacion.noSoportado("Los supuestos descritos no corresponden al modelo M/M/1 o M/M/s disponible.");
        Ctx c = new Ctx(t);
        String rate = "(?:[a-z]+\\s+){0,3}?(?:por|/|cada|al)\\s*(?<u>segundo|minuto|hora|dia)\\b";
        Matcher lr = c.buscar("(?:\\bllegan?\\b|\\bllegadas?\\b|arriban|arribos|\\brecibe\\w*|\\breciben\\b|\\bentran\\b|\\bingresan\\b|\\bsolicitudes\\b|\\blambda\\b|λ)[^.;?!0-9]{0,40}?" + num("k") + "\\s*" + rate);
        Double lam = lr == null ? null : t.valor(lr, "k"); String uLam = lr == null ? null : unidadBase(lr.group("u"));
        Double lamTiempo = null; String uLamT = null;
        if (lr == null) { Matcher lt = c.buscar("tiempo\\s+(?:medio\\s+|promedio\\s+)?entre\\s+(?:llegadas|arribos)[^.;?!0-9]{0,30}?" + num("k") + "\\s*(?<u>segundos?|minutos?|horas?)"); if (lt != null) { lamTiempo = t.valor(lt, "k"); uLamT = unidadBase(lt.group("u")); } }
        Matcher mr = c.buscar("(?:\\batiende\\w*|\\bsirve\\w*|\\bdespacha\\w*|\\bprocesa\\w*|\\bmu\\b|μ|tasa\\s+de\\s+servicio|capacidad\\s+de\\s+atencion)[^.;?!0-9]{0,40}?" + num("k") + "\\s*" + rate);
        Double mu = mr == null ? null : t.valor(mr, "k"); String uMu = mr == null ? null : unidadBase(mr.group("u"));
        Double muTiempo = null; String uMuT = null; int posMu = mr == null ? -1 : mr.start("k");
        if (mr == null) { Matcher mt = c.buscar("(?:\\btarda\\w*|\\bdemora\\w*|\\btoma\\b|\\bdura\\w*|\\brequiere\\w*|tiempo\\s+(?:medio\\s+|promedio\\s+)?(?:de\\s+)?(?:servicio|atencion))[^.;?!0-9]{0,40}?" + num("k") + "\\s*(?<u>segundos?|minutos?|horas?)"); if (mt != null) { muTiempo = t.valor(mt, "k"); uMuT = unidadBase(mt.group("u")); posMu = mt.start("k"); } }
        if ((lam == null && lamTiempo == null) || (mu == null && muTiempo == null)) return t.incompleto("Faltan tasas para el sistema de espera.", "Indica la tasa de llegadas λ y la tasa de servicio μ por servidor (o los tiempos medios entre llegadas y de servicio), con unidades temporales.");
        if (lam != null && mu != null && !uLam.equals(uMu)) return t.incompleto("Las tasas tienen unidades temporales distintas.", "λ está por " + uLam + " y μ por " + uMu + ": expresa λ y μ usando la misma unidad temporal.");
        String base = uLam != null ? uLam : uMu != null ? uMu : "hora";
        if (base.equals("dia") && (lamTiempo != null || muTiempo != null)) return t.incompleto("Tiempos medios por día.", "Los tiempos medios deben expresarse en la misma unidad temporal que la tasa: ¿cuántas horas tiene el día de operación?");
        List<String> sup = new ArrayList<>(List.of("Llegadas Poisson, servicios exponenciales independientes, cola ilimitada y disciplina FIFO (modelo M/M/s). μ es la tasa de cada servidor."));
        if (lamTiempo != null) { if (Double.isNaN(segundos(uLamT)) || lamTiempo <= 0) return t.incompleto("Tiempo entre llegadas inválido.", "Indica un tiempo medio entre llegadas positivo."); lam = segundos(base) / (lamTiempo * segundos(uLamT)); sup.add("Tiempo medio entre llegadas de " + fmt(lamTiempo) + " " + uLamT + "s → λ = " + fmt(Math.rint(lam * 1e6) / 1e6) + " por " + base + "."); }
        if (muTiempo != null) { if (Double.isNaN(segundos(uMuT)) || muTiempo <= 0) return t.incompleto("Tiempo de servicio inválido.", "Indica un tiempo medio de servicio positivo."); mu = segundos(base) / (muTiempo * segundos(uMuT)); sup.add("Tiempo medio de servicio de " + fmt(muTiempo) + " " + uMuT + "s → μ = " + fmt(Math.rint(mu * 1e6) / 1e6) + " por " + base + "."); }
        // servidores
        Set<Double> cantidades = new LinkedHashSet<>();
        Matcher mm = Pattern.compile("m/m/" + num("k")).matcher(t.n);
        while (mm.find()) if (c.libre(mm, "k")) { cantidades.add(t.valor(mm, "k")); c.tomar(mm, "k"); }
        Matcher ns = Pattern.compile(num("k") + "\\s+" + SRV + "\\b").matcher(t.n);
        while (ns.find()) if (c.libre(ns, "k")) { cantidades.add(t.valor(ns, "k")); c.tomar(ns, "k"); }
        if (Pattern.compile("\\bun(?:a)?\\s+(?:solo\\s+|sola\\s+|unico\\s+|unica\\s+)?" + SRV + "\\b").matcher(t.n).find()) cantidades.add(1.0);
        if (cantidades.isEmpty()) return t.incompleto("Falta el número de servidores.", "¿Cuántos servidores atienden y es μ la tasa individual de cada uno?");
        if (cantidades.size() > 1) return t.incompleto("Hay cantidades de servidores distintas.", "El enunciado menciona " + cantidades.size() + " cantidades distintas de servidores: ¿cuántos atienden?");
        double s = cantidades.iterator().next();
        if (s != Math.rint(s) || s < 1) return t.incompleto("El número de servidores no es entero.", "Indica un número entero de servidores.");
        int cantidad = (int) s;
        if (cantidad > 1 && posMu >= 0) {
            int[] f = t.frase(posMu);
            if (!t.n.substring(f[0], f[1]).matches("(?s).*(?:\\bcada\\b|\\bpor\\s+" + SRV + "|c/u|individual|\\buno\\b).*")) return t.incompleto("No se sabe si μ es por servidor.", "Hay " + cantidad + " servidores: ¿μ es la tasa de cada servidor o del sistema completo?");
        }
        // costos
        Matcher cs = c.buscar("(?:costo|cuesta|paga\\w*|salario)\\b[^.;?!0-9]{0,40}?(?:cada\\s+)?\\b" + SRV + "\\b[^.;?!0-9]{0,30}?(?:es\\s+de\\s+|de\\s+|:)?\\$?\\s*" + num("k") + "\\s*(?:pesos|dolares|euros)?\\s*(?:por|/|la)\\s*(?<u>segundo|minuto|hora|dia)");
        Matcher cw = c.buscar("(?:costo|cuesta|perdida)\\b[^.;?!0-9]{0,40}?(?:espera|esperar|permanencia|estancia|cliente\\s+en\\s+el\\s+sistema)[^.;?!0-9]{0,50}?(?:es\\s+de\\s+|de\\s+|:)?\\$?\\s*" + num("k") + "\\s*(?:pesos|dolares|euros)?\\s*(?:por|/)\\s*(?<u>segundo|minuto|hora|dia)");
        Double ccs = null, ccw = null;
        for (Matcher m : Arrays.asList(cs, cw)) {
            if (m == null) continue;
            String u = unidadBase(m.group("u")); double v = t.valor(m, "k");
            if (!u.equals(base)) { if (Double.isNaN(segundos(u)) || Double.isNaN(segundos(base))) return t.incompleto("Costos por día.", "Expresa los costos por " + base + " (o indica las horas del día de operación)."); v = v * segundos(base) / segundos(u); sup.add("Costo convertido de por " + u + " a por " + base + "."); }
            if (m == cs) ccs = v; else ccw = v;
        }
        if ((ccs == null) != (ccw == null)) return t.incompleto("Falta uno de los dos costos.", ccs == null ? "¿Cuál es el costo de cada servidor por unidad de tiempo?" : "¿Cuál es el costo de espera de un cliente en el sistema por unidad de tiempo?");
        if (lam >= cantidad * mu) return t.incompleto("La cola no es estable.", "Con λ = " + fmt(Math.rint(lam * 1e6) / 1e6) + " y capacidad s·μ = " + fmt(Math.rint(cantidad * mu * 1e6) / 1e6) + " (por " + base + ") la cola crece sin límite: revisa los datos.");
        c.confirmar();
        ObjectNode datos = JSON.createObjectNode().put("lambda", lam).put("mu", mu);
        if (cantidad != 1) datos.put("s", cantidad);
        if (ccs != null) datos.put("cs", ccs).put("cw", ccw);
        return t.listo("colas", cantidad == 1 ? "mm1" : "mms", datos, List.of(variable("lambda", "Tasa de llegadas", "clientes/" + base), variable("mu", "Tasa de servicio por servidor", "clientes/" + base)), sup, List.of());
    }
}
