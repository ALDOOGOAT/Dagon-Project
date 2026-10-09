package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.IoParserTexto.*;

/**
 * PL general de n productos por m recursos redactada en prosa o en tabla. Conservador: toda cifra debe tener un papel
 * (utilidad, uso de un recurso, disponibilidad, cota, proporción o total); si queda alguna, o falta un dato, se pregunta.
 */
final class IoParserProgramacionLineal {
    private static final String UN = "(?:horas?|hrs?|minutos?|dias?|semanas?|meses|kg|kilos?|kilogramos?|gramos?|litros?|toneladas?|metros?|unidad(?:es)?|piezas?|libras?|onzas?|galon(?:es)?|pesos|dolares|euros|millones|miles|hectareas?|cajas?|lotes?|bolsas?|paquetes?|botellas?|tazas?|docenas?|km|porcion(?:es)?)";
    private static final String MON = "(?:pesos|dolares|euros)";
    private static final String ART = "(?:(?:el|la|los|las|un|una)\\s+)?";
    private static final String SIN_UN_NO_MON = "(?!\\s*(?:horas?|hrs?|minutos?|dias?|semanas?|kg|kilos?|kilogramos?|gramos?|litros?|toneladas?|metros?|unidad(?:es)?|piezas?|onzas?|libras?)\\b)";
    private static final Pattern CUE = Pattern.compile("maximiz|minimiz|ganancia|utilidad|beneficio|costo|produc|fabric|elabor|recurso|dispon|dieta|mezcla|presupuesto|contribucion|rendimiento|vpn|hornea|siembra|prepara|ingreso|cuesta");
    private static final String LBL_ALT = "utilidad(?:es)?|ganancias?|beneficios?|contribucion(?:es)?|ingresos?|rendimientos?|margen(?:es)?|vpn|retorno|costos?|gastos?";
    private static final Pattern LBL = Pattern.compile("\\b(" + LBL_ALT + ")\\b");
    private static final Pattern LIM = Pattern.compile("(?<le>se\\s+dispone(?:n)?\\s+de|dispone(?:n)?\\s+de|se\\s+cuenta(?:n)?\\s+con|cuenta(?:n)?\\s+con|se\\s+tienen?|hay\\b|disponibilidad(?:\\s+de)?|disponibles?|capacidad(?:\\s+(?:maxima|total))?(?:\\s+de)?|limitad[oa]s?\\s+a|limite(?:\\s+de)?|existencias?(?:\\s+de)?|como\\s+maximo|a\\s+lo\\s+sumo|no\\s+mas\\s+de|maximo(?:\\s+de)?|hasta|se\\s+pueden\\s+(?:usar|utilizar|emplear|gastar)|pueden?\\s+(?:usar|utilizar|emplear|gastar))"
            + "|(?<ge>al\\s+menos|como\\s+minimo|por\\s+lo\\s+menos|no\\s+menos\\s+de|minimo(?:\\s+de)?|se\\s+requieren?|se\\s+necesitan?|debe(?:n)?\\s+(?:contener|incluir|tener|aportar|proporcionar|cubrir|satisfacer)|requerimientos?(?:\\s+minimos?)?(?:\\s+de)?|necesidades?(?:\\s+minimas?)?\\s+de)"
            + "|(?<eq>exactamente|igual\\s+a|justo|precisamente)");
    private static final Pattern BCUE = Pattern.compile("(?<le>como\\s+maximo|a\\s+lo\\s+sumo|no\\s+mas\\s+de|maximo(?:\\s+de)?|hasta|demanda\\s+maxima\\s+de)|(?<ge>al\\s+menos|como\\s+minimo|por\\s+lo\\s+menos|no\\s+menos\\s+de|minimo(?:\\s+de)?|demanda\\s+minima\\s+de)|(?<eq>exactamente|igual\\s+a)");
    private static final String[][] OPS = {
            {"no\\s+(?:debe|deben|puede|pueden)\\s+(?:ser\\s+)?(?:menor(?:es)?|inferior(?:es)?)\\s+(?:que|a|de)", ">="},
            {"no\\s+(?:debe|deben|puede|pueden)\\s+(?:ser\\s+)?(?:exceder|superar|excederse|mayor(?:es)?\\s+(?:que|a|de))", "<="},
            {"no\\s+(?:excede|excedera|supera|superara)", "<="},
            {"(?:debe|deben|puede|pueden)\\s+ser\\s+(?:menor(?:es)?|inferior(?:es)?)\\s+(?:que|a)", "<="},
            {"(?:debe|deben)\\s+(?:ser\\s+)?(?:mayor(?:es)?|superior(?:es)?)\\s+(?:que|a)", ">="},
            {"como\\s+maximo|a\\s+lo\\s+sumo|no\\s+mas\\s+(?:de|que)|maximo", "<="},
            {"al\\s+menos|como\\s+minimo|por\\s+lo\\s+menos|no\\s+menos\\s+(?:de|que)|minimo", ">="},
            {"igual\\s+a|igual\\s+que|exactamente|iguala", "="},
            {"(?:debe|deben)\\s+ser(?=\\s+(?:el|la)\\s+(?:doble|triple|cuadruple|mitad))", "="}};
    private static final Pattern PAT_OPS;
    static { StringBuilder sb = new StringBuilder(); for (int i = 0; i < OPS.length; i++) sb.append(i > 0 ? "|" : "").append("(?<o").append(i).append(">").append(OPS[i][0]).append(")"); PAT_OPS = Pattern.compile(sb.toString()); }
    private static final Set<String> STOP = Set.of("y", "e", "o", "u", "para", "por", "que", "al", "a", "en", "con", "cada", "disponibles", "disponible", "semanales", "semanal", "diarias", "diaria", "diario", "mensuales", "mensual", "del", "de", "la", "el", "los", "las", "lo", "se", "si",
            "mientras", "pero", "ademas", "producir", "fabricar", "unidad", "unidades", "cuando", "donde", "hay", "como", "entre", "hasta", "cuyo", "cuya", "segun", "sin", "sobre", "tras", "un", "una", "unos", "unas", "su", "sus", "no", "mas", "menos", "es", "son", "debe", "deben", "pueden", "puede", "tiene", "tienen", "total", "totales", "dispone", "cuenta", "estan", "esta", "ser", "sea");
    private static final Set<String> GENERICOS = Set.of("productos", "producto", "articulos", "articulo", "tipos", "tipo", "modelos", "modelo", "cantidades", "alimentos", "ingredientes", "elementos", "bienes", "variedades", "clases", "diferentes", "distintos", "proyectos", "empresas");
    private static final Set<String> TIEMPO = Set.of("hora", "dia", "semana", "mes", "ano", "vez", "uno", "una", "producto", "unidad", "pieza", "lote", "turno", "caja", "kilo", "litro", "cliente", "persona", "proyecto", "empresa");
    private static final Pattern ENUM = Pattern.compile("\\b(?:produc\\w*|fabric\\w*|elabor\\w*|manufactur\\w*|hornea\\w*|prepar\\w*|siembr\\w*|cultiv\\w*|vend\\w*|comercializ\\w*|ensambl\\w*|mezcl\\w*|combin\\w*|ofrec\\w*|compr\\w*|cria\\w*|invierte\\w*|elig\\w*)\\s+");
    private static final Pattern LISTA = Pattern.compile("(?:\\d+\\s+)?(?:(?:tipos|clases|variedades)\\s+de\\s+)?(?:(?:los|las|el|la|un|una|unos|unas)\\s+)?([a-z]{2,})((?:\\s*,\\s*(?:(?:los|las|el|la)\\s+)?[a-z]{2,}){0,12})(?:\\s+(?:y|e|o)\\s+(?:(?:los|las|el|la)\\s+)?([a-z]{2,}))?");

    private static final class Prod {
        final String nombre, unidad, rx; final boolean codigo; double c = Double.NaN;
        Prod(String nombre, String unidad, String rx, boolean codigo) { this.nombre = nombre; this.unidad = unidad; this.rx = rx; this.codigo = codigo; }
    }
    private static final class Lim { final String op; final double rhs; Lim(String op, double rhs) { this.op = op; this.rhs = rhs; } }
    private static final class Rec { final String clave; final Map<Integer, Double> uso = new HashMap<>(); final List<Lim> lim = new ArrayList<>(); final Set<String> unidades = new LinkedHashSet<>(); Rec(String c) { clave = c; } }
    private static final class Extra { final int pos; final String texto; Extra(int p, String t) { pos = p; texto = t; } }
    private record Cue(int ini, int fin, String op) {}

    private final IoParserTexto t;
    private final List<Prod> prods = new ArrayList<>();
    private final Map<String, Rec> recs = new LinkedHashMap<>();
    private final List<Extra> extras = new ArrayList<>();
    private final List<String> preguntas = new ArrayList<>(), supuestos = new ArrayList<>();
    private final List<int[]> menciones = new ArrayList<>();
    private final List<Cue> cues = new ArrayList<>();
    private boolean hayPres, labelMax, labelMin, tabla, listasModo;
    private String objetivoTabla;

    private IoParserProgramacionLineal(IoParserTexto t) { this.t = t; }

    static IoInterpretacion interpretar(IoParserTexto t) {
        if (!CUE.matcher(t.n).find()) return null;
        return new IoParserProgramacionLineal(t).resolver();
    }

    // ------------------------------------------------------------------ flujo
    private IoInterpretacion resolver() {
        hayPres = t.tiene("\\bpresupuesto|capital disponible|fondos disponibles");
        if (!tablaPL() && !listasPL()) descubrir();
        if (prods.size() > 10) return t.incompleto("La programación lineal admite hasta 10 variables.", "Reduce el modelo a 10 productos o actividades como máximo.");
        if (prods.size() < 2) return t.incompleto("No se identificaron al menos dos productos o actividades de decisión.", "Indica qué productos o actividades se deciden, y su utilidad o costo y el uso de cada recurso.");
        for (int i = 0; i < prods.size(); i++) { Matcher m = Pattern.compile(prods.get(i).rx).matcher(t.n); while (m.find()) menciones.add(new int[]{m.start(), i}); }
        menciones.sort(Comparator.comparingInt(a -> a[0]));
        Matcher mc = LIM.matcher(t.n);
        while (mc.find()) cues.add(new Cue(mc.start(), mc.end(), mc.group("le") != null ? "<=" : mc.group("ge") != null ? ">=" : "="));
        razones(); totales(); cotas(); objetivo(); items(); sinRecurso(); inversos(); genericos();
        return construir();
    }

    // ------------------------------------------------------------------ productos
    private static String singular(String w) {
        if (w.endsWith("ces")) return w.substring(0, w.length() - 3) + "z";
        if (w.endsWith("es") && w.length() > 4 && "lrnd".indexOf(w.charAt(w.length() - 3)) >= 0) return w.substring(0, w.length() - 2);
        if (w.endsWith("s") && w.length() > 3) return w.substring(0, w.length() - 1);
        return w;
    }
    private static String rxNombre(String sing) {
        String alt = Pattern.quote(sing) + "|" + Pattern.quote(sing + "s") + "|" + Pattern.quote(sing + "es");
        if (sing.endsWith("z")) alt += "|" + Pattern.quote(sing.substring(0, sing.length() - 1) + "ces");
        return "\\b(?:" + alt + ")\\b";
    }
    private boolean agregarNombre(String palabra, int pos) {
        String sing = singular(palabra);
        for (Prod p : prods) if (p.rx.equals(rxNombre(sing))) return false;
        String orig = t.original.substring(pos, pos + palabra.length());
        prods.add(new Prod(orig, orig.toLowerCase(Locale.ROOT), rxNombre(sing), false));
        return true;
    }
    private void descubrir() {
        Map<String, String> cods = new LinkedHashMap<>();
        Matcher mc = Pattern.compile(COD + "(?![0-9])").matcher(t.n);
        while (mc.find()) cods.putIfAbsent(mc.group(), t.original.substring(mc.start(), mc.end()));
        if (cods.size() >= 2 && cods.size() <= 10) { cods.forEach((n, o) -> prods.add(new Prod(o, "unidades", Pattern.quote(n) + "(?![0-9])", true))); return; }
        Matcher v = ENUM.matcher(t.n);
        while (v.find() && prods.isEmpty()) {
            int fin = t.finFrase(v.end());
            Matcher l = LISTA.matcher(t.n); l.region(v.end(), fin);
            if (!l.lookingAt()) continue;
            if (GENERICOS.contains(l.group(1))) { // "dos productos: mesas y sillas"
                int p = l.end(1); while (p < fin && ":,( ".indexOf(t.n.charAt(p)) >= 0) p++;
                l.region(p, fin); if (!l.lookingAt()) continue;
            }
            List<int[]> items = new ArrayList<>(List.of(new int[]{l.start(1), l.end(1)}));
            if (l.group(2) != null && !l.group(2).isEmpty()) { Matcher w = Pattern.compile("[a-z]{2,}").matcher(t.n); w.region(l.start(2), l.end(2)); while (w.find()) if (!Set.of("los", "las", "el", "la").contains(w.group())) items.add(new int[]{w.start(), w.end()}); }
            if (l.group(3) != null) items.add(new int[]{l.start(3), l.end(3)});
            List<int[]> validos = new ArrayList<>();
            for (int[] it : items) { String w = t.n.substring(it[0], it[1]); if (STOP.contains(w) || GENERICOS.contains(w)) break; validos.add(it); }
            if (validos.size() >= 2) for (int[] it : validos) agregarNombre(t.n.substring(it[0], it[1]), it[0]);
        }
        if (!prods.isEmpty()) return;
        Matcher c = Pattern.compile("\\bcada\\s+(?:([a-z]+)\\s+(?:de|del)\\s+)?([a-z]{2,})\\b").matcher(t.n);
        while (c.find()) {
            String x = c.group(2); int pos = c.start(2);
            if (STOP.contains(x) || TIEMPO.contains(singular(x)) || GENERICOS.contains(x)) continue;
            agregarNombre(x, pos);
        }
        if (prods.size() < 2) prods.clear();
    }

    // ------------------------------------------------------------------ utilidades de patrones
    private String prod(String pref) {
        StringBuilder sb = new StringBuilder("(?:");
        for (int i = 0; i < prods.size(); i++) sb.append(i > 0 ? "|" : "").append("(?<").append(pref).append(i).append(">").append(prods.get(i).rx).append(")");
        return sb.append(")").toString();
    }
    private int quien(Matcher m, String pref) { for (int i = 0; i < prods.size(); i++) if (m.start(pref + i) >= 0) return i; return -1; }
    private boolean monetario(Matcher m, String g) {
        int ini = m.start(g), fin = m.end(g);
        int i = ini - 1; while (i >= 0 && t.n.charAt(i) == ' ') i--;
        if (i >= 0 && t.n.charAt(i) == '$') return true;
        return Pattern.compile("\\s*" + MON + "\\b").matcher(t.n).region(fin, Math.min(t.n.length(), fin + 12)).lookingAt();
    }
    private boolean hayEtiqueta(int pos) { int[] f = t.frase(pos); Matcher m = LBL.matcher(t.n); m.region(f[0], f[1]); return m.find(); }
    private void etiqueta(String lbl) { if (lbl.startsWith("cost") || lbl.startsWith("gast")) labelMin = true; else labelMax = true; }
    private void etiquetaDe(int pos) { int[] f = t.frase(pos); Matcher m = LBL.matcher(t.n); m.region(f[0], f[1]); if (m.find()) etiqueta(m.group(1)); }
    private Cue cueAntes(int pos, Pattern pat) {
        int ini = Math.max(t.inicioFrase(pos), pos - 250); Matcher m = pat.matcher(t.n); m.region(ini, pos); Cue ultimo = null;
        while (m.find()) ultimo = new Cue(m.start(), m.end(), m.group("le") != null ? "<=" : m.group("ge") != null ? ">=" : "=");
        return ultimo;
    }
    private Cue limiteAntes(int pos) {
        Cue mejor = null;
        int desde = Math.max(t.inicioFrase(pos), pos - 400);
        for (Cue c : cues) { if (c.ini() >= pos) break; if (c.ini() >= desde) mejor = c; }
        return mejor;
    }
    /** Producto sujeto de la frase para una cifra (nombre más cercano a su izquierda sin un límite de por medio). */
    private int sujeto(int pos) {
        int ini = Math.max(t.inicioFrase(pos), pos - 400), mejor = -1, mejorPos = -1;
        for (int[] m : menciones) { if (m[0] >= pos) break; if (m[0] >= ini) { mejor = m[1]; mejorPos = m[0]; } }
        if (mejor < 0) return -1;
        Cue c = limiteAntes(pos);
        return c != null && c.ini() > mejorPos ? -1 : mejor;
    }
    private Rec rec(String clave) { return recs.computeIfAbsent(clave, Rec::new); }
    private static String unidadNorm(String u) {
        if (u == null) return null;
        if (u.startsWith("hora") || u.startsWith("hr")) return "horas";
        if (u.startsWith("minuto")) return "minutos";
        if (u.startsWith("kilo") || u.equals("kg")) return "kg";
        if (u.startsWith("gramo")) return "gramos";
        if (u.startsWith("litro")) return "litros";
        if (u.startsWith("tonelada")) return "toneladas";
        if (u.startsWith("onza")) return "onzas";
        if (u.startsWith("libra")) return "libras";
        if (u.startsWith("dia")) return "días";
        if (u.startsWith("semana")) return "semanas";
        if (u.startsWith("mes")) return "meses";
        if (u.startsWith("metro")) return "metros";
        if (u.startsWith("peso") || u.startsWith("dolar") || u.startsWith("euro")) return null;
        return u.startsWith("mill") || u.startsWith("mil") ? u : null;
    }

    // ------------------------------------------------------------------ razones, totales y cotas
    private void razones() {
        if (prods.size() < 2) return;
        String factor = "(?:(?:el\\s+)?(?<d>doble|triple|cuadruple)|(?:la\\s+)?(?<h>mitad)|" + num("k") + "\\s*(?<v>veces|%|por\\s+ciento))";
        Pattern p = Pattern.compile(prod("a") + "[^.;?!0-9]{0,35}?(?:" + PAT_OPS.pattern() + ")\\s*(?:de\\s+)?" + factor + "\\s*(?:de\\s+|del\\s+|que\\s+)?[^.;?!0-9]{0,30}?" + prod("b"));
        Matcher m = p.matcher(t.n);
        while (m.find()) {
            int a = quien(m, "a"), b = quien(m, "b");
            if (a < 0 || b < 0 || a == b) continue;
            String op = null; for (int i = 0; i < OPS.length; i++) if (m.start("o" + i) >= 0) { op = OPS[i][1]; break; }
            double f;
            if (m.group("d") != null) f = m.group("d").equals("doble") ? 2 : m.group("d").equals("triple") ? 3 : 4;
            else if (m.group("h") != null) f = 0.5;
            else if (!t.libre(m, "k")) continue;
            else { f = t.valor(m, "k"); if (!m.group("v").equals("veces")) f /= 100; t.marcar(m, "k"); }
            if (op == null || Double.isNaN(f)) continue;
            double[] coef = new double[prods.size()]; coef[a] = 1; coef[b] = -f;
            extras.add(new Extra(m.start(), fila(coef, op, 0)));
            if (m.group("d") != null || m.group("h") != null) supuestos.add("Proporción entre productos: " + prods.get(a).nombre + (op.equals("<=") ? " ≤ " : op.equals(">=") ? " ≥ " : " = ") + fmt(f) + " × " + prods.get(b).nombre + ".");
        }
    }
    private void totales() {
        String cue = "(?<le>como\\s+maximo|a\\s+lo\\s+sumo|no\\s+mas\\s+de|maximo(?:\\s+de)?|hasta)|(?<ge>al\\s+menos|como\\s+minimo|por\\s+lo\\s+menos|no\\s+menos\\s+de|minimo(?:\\s+de)?)|(?<eq>exactamente|igual\\s+a)";
        String tot = "(?:en\\s+total|en\\s+conjunto|entre\\s+ambos|entre\\s+ambas|entre\\s+los\\s+dos|entre\\s+todos|entre\\s+todas|produccion\\s+total|cantidad\\s+total|total\\s+de\\s+unidades)";
        Pattern a = Pattern.compile(tot + "[^.;?!0-9]{0,50}?(?:" + cue + ")\\s*(?:de\\s+)?" + num("k") + "(?!\\s*%)");
        Pattern b = Pattern.compile("(?:" + cue + ")\\s*(?:de\\s+)?" + num("k") + "\\s*(?:" + UN + "\\s+)?(?:(?:de\\s+)?(?:mezcla|produccion|productos|articulos|unidades)\\s+)?" + tot);
        for (Pattern p : List.of(a, b)) {
            Matcher m = p.matcher(t.n);
            while (m.find()) {
                if (!t.libre(m, "k")) continue;
                String op = m.group("le") != null ? "<=" : m.group("ge") != null ? ">=" : "=";
                double[] coef = new double[prods.size()]; Arrays.fill(coef, 1);
                extras.add(new Extra(m.start("k"), fila(coef, op, t.valor(m, "k")))); t.marcar(m, "k");
            }
        }
    }
    private void cotas() {
        Pattern item = Pattern.compile(num("k") + "\\s*(?:[a-z]+\\s+(?:de|del)\\s+)?" + ART + prod("p") + "");
        Matcher m = item.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0) continue;
            Cue c = cueAntes(m.start("k"), BCUE);
            if (c == null) continue;
            String gap = t.n.substring(c.fin(), m.start("k"));
            if (gap.length() > 70 || !gapLibre(c.fin(), m.start("k"))) continue;
            double[] coef = new double[prods.size()]; coef[p] = 1;
            extras.add(new Extra(m.start("k"), fila(coef, c.op(), t.valor(m, "k")))); t.marcar(m, "k");
        }
        // "la demanda máxima de B es de 30", "la producción de A debe ser al menos 10"
        Pattern dem = Pattern.compile("(?:demanda|produccion|cantidad|ventas?|pedidos?)\\s*(?<mm>maxima|minima)?\\s+(?:de|del|para)\\s+" + ART + "(?:producto\\s+)?" + prod("p") + "\\s*(?:es|sera|:|debe\\s+ser|no\\s+debe\\s+pasar\\s+de)?\\s*(?:de\\s+)?(?:(?:" + PAT_OPS.pattern().replace("(?<o", "(?<q") + ")\\s*(?:de\\s+)?)?" + num("k"));
        m = dem.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0) continue;
            String op = m.group("mm") != null ? (m.group("mm").equals("maxima") ? "<=" : ">=") : null;
            for (int i = 0; i < OPS.length && op == null; i++) if (m.start("q" + i) >= 0) op = OPS[i][1];
            if (op == null) continue;
            double[] coef = new double[prods.size()]; coef[p] = 1;
            extras.add(new Extra(m.start("k"), fila(coef, op, t.valor(m, "k")))); t.marcar(m, "k");
        }
    }
    private boolean gapLibre(int a, int b) { for (IoParserTexto.Tok k : t.nums) if (k.ini() >= a && k.ini() < b && !t.usado[k.ini()] && !k.pegado()) return false; return true; }

    // ------------------------------------------------------------------ objetivo
    private void fijarC(int p, double v, String lbl) {
        if (Double.isNaN(prods.get(p).c)) { prods.get(p).c = v; if (lbl != null) etiqueta(lbl); }
    }
    private void objetivo() {
        if (tabla || listasModo) return;
        // "$5 por unidad de A y 4 por unidad de B", "70 por escritorio"
        Pattern a = Pattern.compile(num("k") + "\\s*(?:" + MON + ")?\\s*por\\s+(?:cada\\s+)?(?:[a-z]+\\s+(?:de|del)\\s+)?" + ART + prod("p") + "");
        Matcher m = a.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0) continue;
            if (!monetario(m, "k") && !hayEtiqueta(m.start("k"))) continue;
            fijarC(p, t.valor(m, "k"), null); etiquetaDe(m.start("k")); t.marcar(m, "k");
        }
        // "$50 para el pan, $80 para los pasteles"
        Pattern g = Pattern.compile(num("k") + "\\s*(?:" + MON + ")?\\s+para\\s+" + ART + prod("p") + "");
        m = g.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0 || (!monetario(m, "k") && !hayEtiqueta(m.start("k")))) continue;
            fijarC(p, t.valor(m, "k"), null); etiquetaDe(m.start("k")); t.marcar(m, "k");
        }
        // "Cada mesa aporta una ganancia de 3", "cada Latte genera $30", con continuación "y cada silla de 5"
        String verbo = "\\b(?:aporta|deja|genera|reporta|produce|da|proporciona|obtiene|brinda|ofrece)\\w*";
        Pattern b = Pattern.compile(prod("p") + "[^.;?!0-9]{0,40}?" + verbo + "\\s*(?:una\\s+|un\\s+)?(?<l>" + LBL_ALT + ")?(?:\\s+unitari[oa])?(?:\\s+(?:de|es\\s+de))?\\s*\\$?\\s*" + num("k") + SIN_UN_NO_MON);
        m = b.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0) continue;
            if (m.group("l") == null && !monetario(m, "k")) continue;
            fijarC(p, t.valor(m, "k"), m.group("l")); if (m.group("l") == null) etiquetaDe(m.start("k")); t.marcar(m, "k");
            continuar(m.end());
        }
        // "Cada unidad de X cuesta $2": costo o uso del presupuesto
        Pattern c = Pattern.compile(prod("p") + "[^.;?!0-9]{0,40}?\\b(?:cuesta|cuestan|vale|valen|tiene\\s+un\\s+costo(?:\\s+unitario)?\\s+de|con\\s+un\\s+costo(?:\\s+unitario)?\\s+de|a\\s+un\\s+costo\\s+de)\\s*(?:de\\s+|es\\s+de\\s+)?\\$?\\s*" + num("k") + SIN_UN_NO_MON);
        m = c.matcher(t.n);
        boolean otroObjetivo = labelMax;
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = quien(m, "p"); if (p < 0) continue;
            double v = t.valor(m, "k");
            if (hayPres && (otroObjetivo || t.tiene("maximiz"))) { rec("presupuesto").uso.put(p, v); t.marcar(m, "k"); continuarCosto(m.end(), true); }
            else { fijarC(p, v, "costo"); t.marcar(m, "k"); continuarCosto(m.end(), false); }
        }
        // "utilidad $30" dentro del segmento de un producto
        Pattern d = Pattern.compile("(?<l>" + LBL_ALT + ")(?:\\s+unitari[oa])?\\s*(?:de|es\\s+de|es|:|=)?\\s*\\$?\\s*" + num("k") + SIN_UN_NO_MON);
        m = d.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int p = sujeto(m.start("k")); if (p < 0) continue;
            fijarC(p, t.valor(m, "k"), m.group("l")); t.marcar(m, "k");
        }
    }
    private void continuar(int desde) { continuacion(desde, false, false); }
    private void continuarCosto(int desde, boolean presupuesto) { continuacion(desde, true, presupuesto); }
    /** "... y cada silla de $5": otro producto con el mismo papel inmediatamente después. */
    private void continuacion(int desde, boolean costo, boolean presupuesto) {
        Pattern cont = Pattern.compile("(?:\\s*" + MON + ")?\\s*(?:,|y|e)\\s+(?:cada\\s+|un\\s+|una\\s+)?(?:[a-z]+\\s+(?:de|del)\\s+)?" + prod("p") + "\\s+(?:cuesta\\s+|vale\\s+)?(?:de\\s+|con\\s+|a\\s+|es\\s+de\\s+|:\\s*)?\\$?\\s*" + num("k") + SIN_UN_NO_MON);
        int pos = desde;
        while (true) {
            Matcher m = cont.matcher(t.n); m.region(pos, t.n.length());
            if (!m.lookingAt() || !t.libre(m, "k")) return;
            int p = quien(m, "p"); if (p < 0) return;
            double v = t.valor(m, "k");
            if (presupuesto) rec("presupuesto").uso.put(p, v); else fijarC(p, v, costo ? "costo" : null);
            t.marcar(m, "k"); pos = m.end();
        }
    }

    // ------------------------------------------------------------------ uso de recursos y disponibilidades
    private String leerRecurso(int pos, int[] fin) {
        String n = t.n;
        if (n.startsWith("mano de obra", pos)) { fin[0] = pos + 12; return "mano de obra"; }
        Matcher w = Pattern.compile("[a-z]{2,}").matcher(n);
        w.region(pos, n.length());
        if (!w.lookingAt() || STOP.contains(w.group())) return null;
        String clave = w.group(); fin[0] = w.end();
        Matcher s = Pattern.compile("\\s+([a-z]{3,}|\\d{1,2})").matcher(n); s.region(w.end(), n.length());
        if (s.lookingAt()) {
            String x = s.group(1);
            if ((clave.equals("materia") && x.startsWith("prima")) || (x.matches("\\d{1,2}") && Set.of("maquina", "planta", "turno", "departamento", "linea", "proceso", "centro", "taller", "estacion", "horno", "area", "seccion").contains(clave))) {
                clave = clave + " " + x; fin[0] = s.end(1); if (x.matches("\\d+")) t.marcar(s.start(1), s.end(1));
            }
        }
        return clave;
    }
    private boolean esProducto(String clave) { for (Prod p : prods) if (Pattern.compile(p.rx).matcher(clave).find()) return true; return false; }
    private void items() {
        Pattern item = Pattern.compile(num("k") + "\\s*(?:(?<u>" + UN + ")\\b\\s*)?(?:de|del|en)\\s+" + ART + "(?=[a-z])");
        Matcher m = item.matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int[] fin = new int[1]; String clave = leerRecurso(m.end(), fin);
            if (clave == null || esProducto(clave)) continue;
            if (clave.matches(UN)) continue;
            double v = t.valor(m, "k");
            int pos = m.start("k"), sj = sujeto(pos); Cue lim = limiteAntes(pos);
            String unidad = unidadNorm(m.group("u"));
            if (lim != null && (sj < 0 || lim.ini() > posSujeto(pos))) { Rec r = rec(clave); r.lim.add(new Lim(lim.op(), v)); if (unidad != null) r.unidades.add(unidad); t.marcar(m, "k"); }
            else if (sj >= 0) { Rec r = rec(clave); r.uso.put(sj, v); if (unidad != null) r.unidades.add(unidad); t.marcar(m, "k"); }
        }
    }
    private int posSujeto(int pos) {
        int ini = Math.max(t.inicioFrase(pos), pos - 400), mp = -1;
        for (int[] m : menciones) { if (m[0] >= pos) break; if (m[0] >= ini) mp = m[0]; }
        return mp;
    }
    /** "cada silla 2 horas": la unidad identifica al único recurso medido en ella. */
    private void sinRecurso() {
        Matcher m = Pattern.compile(num("k") + "\\s+(?<u>horas?|hrs?|minutos?|kg|kilos?|kilogramos?|gramos?|litros?|toneladas?|onzas?|libras?)\\b(?!\\s+(?:de|del|en)\\b)").matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            int sj = sujeto(m.start("k")); if (sj < 0) continue;
            String u = unidadNorm(m.group("u")); Rec unico = null; int cuenta = 0;
            for (Rec r : recs.values()) if (r.unidades.contains(u)) { unico = r; cuenta++; }
            if (cuenta != 1) continue;
            unico.uso.put(sj, t.valor(m, "k")); t.marcar(m, "k");
        }
    }
    /** "El presupuesto disponible es de $10000", "la carpintería dispone de 240 horas". */
    private void inversos() {
        for (String r : new ArrayList<>(recs.keySet())) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(r) + "\\b\\s*(?:disponible|disponibles|maximo|maxima|total|diario|diaria|semanal)?\\s*(?:(?:es|son|sera|de|:|=)\\s*(?:de\\s+)?|(?:dispone|disponen|cuenta|cuentan|tiene|tienen)\\s+(?:de\\s+|con\\s+)?)\\$?\\s*" + num("k") + "\\s*(?:(?<u>" + UN + ")\\b)?");
            Matcher m = p.matcher(t.n);
            while (m.find()) {
                if (!t.libre(m, "k")) continue;
                Cue c = limiteAntes(m.start("k")); String op = c != null ? c.op() : "<=";
                Rec rr = rec(r); rr.lim.add(new Lim(op, t.valor(m, "k"))); String u = unidadNorm(m.group("u")); if (u != null) rr.unidades.add(u);
                t.marcar(m, "k");
            }
        }
    }
    /** "Disponibilidad: 14 millones" sin nombre de recurso: se asigna solo si hay un único recurso sin disponibilidad. */
    private void genericos() {
        Matcher m = Pattern.compile("(?:presupuesto|capital|fondos|disponibilidad|capacidad|inversion)(?:\\s+(?:disponible|total|maximo|maxima))?\\s*(?:es|son|de|:|=)\\s*(?:de\\s+)?\\$?\\s*" + num("k") + "\\s*(?:(?<u>" + UN + ")\\b)?").matcher(t.n);
        while (m.find()) {
            if (!t.libre(m, "k")) continue;
            List<Rec> sinLim = new ArrayList<>(); for (Rec r : recs.values()) if (r.lim.isEmpty()) sinLim.add(r);
            Cue c = limiteAntes(m.start("k"));
            // En tabla un único recurso sin disponibilidad la recibe; en prosa solo se crea el presupuesto (los demás se preguntan).
            Rec r = (tabla || listasModo) && sinLim.size() == 1 ? sinLim.get(0) : !(tabla || listasModo) && m.group().matches("(?:presupuesto|capital|fondos).*") ? rec("presupuesto") : null;
            if (r == null) continue;
            r.lim.add(new Lim(c != null ? c.op() : "<=", t.valor(m, "k"))); String u = unidadNorm(m.group("u")); if (u != null) r.unidades.add(u);
            t.marcar(m, "k");
        }
    }

    // ------------------------------------------------------------------ listas
    private static final String LISTA_NOMBRES = "beneficios?|ganancias?|utilidades|utilidad|rendimientos?|ingresos?|vpn|valores|valor|retornos?|puntajes?|puntuaciones|contribuciones|margenes|costos?|inversiones|inversion|requerimientos|consumos|tiempos?|horas|gastos?|volumenes|pesos|capacidades|precios";
    /**
     * "Evalúa 3 proyectos… Los beneficios son 14, 10 y 15; los costos son 9, 6 y 2": N elementos y una lista de N valores
     * por magnitud. La lista del objetivo es la que nombra el verbo (maximizar el beneficio); las demás son recursos.
     */
    private boolean listasPL() {
        Matcher c = Pattern.compile(num("k") + "\\s+(?<w>proyectos|inversiones|opciones|alternativas|obras|iniciativas|candidatos|propuestas|programas|sitios|ubicaciones|objetos|articulos|elementos)\\b").matcher(t.n);
        if (!c.find() || !t.libre(c, "k")) return false;
        double dn = t.valor(c, "k"); if (dn != Math.rint(dn) || dn < 2 || dn > 10) return false;
        int n = (int) dn; String sustantivo = singular(c.group("w"));
        Matcher ls = Pattern.compile("\\b(?<w>" + LISTA_NOMBRES + ")\\b(?:\\s+de\\s+(?:los|las|cada)\\s+(?:\\d+\\s+)?[a-z]+)?[^.;?!0-9:\\n]{0,40}?(?:\\b(?:son|es|serian|fueron)\\b|:)\\s*(?=\\d)").matcher(t.n);
        Map<String, List<Double>> listas = new LinkedHashMap<>(); List<int[]> spans = new ArrayList<>(); List<String> dudas = new ArrayList<>();
        while (ls.find()) {
            IoParserTexto.Tok k = t.tok(ls.end()); if (k == null || t.usado[k.ini()]) continue;
            int[] fin = new int[1]; List<Double> v = t.lista(ls.end(), fin);
            if (v.size() != n) { if (v.size() > 1) dudas.add("La lista de " + ls.group("w") + " tiene " + v.size() + " valores pero hay " + n + " " + c.group("w") + ": indica un valor por elemento."); continue; }
            if (listas.putIfAbsent(ls.group("w"), v) != null) { dudas.add("«" + ls.group("w") + "» aparece con dos listas distintas."); continue; }
            spans.add(new int[]{ls.end(), fin[0]});
        }
        if (listas.size() < 2) return false;
        String objetivo = null; List<String> candidatas = new ArrayList<>();
        Matcher vb = Pattern.compile("\\b(?:maximiz|minimiz)\\w*\\s+(?:(?:el|la|los|las)\\s+)?(?<w>[a-z]+)").matcher(t.n);
        if (vb.find()) for (String nom : listas.keySet()) if (singular(nom).equals(singular(vb.group("w")))) candidatas.add(nom);
        if (candidatas.isEmpty()) for (String nom : listas.keySet()) if (nom.matches("beneficios?|ganancias?|utilidad(?:es)?|rendimientos?|ingresos?|vpn|retornos?|puntajes?|puntuaciones|contribuciones|margenes")) candidatas.add(nom);
        if (candidatas.size() == 1) objetivo = candidatas.get(0);
        else dudas.add("No se sabe cuál de las listas (" + String.join(", ", listas.keySet()) + ") es la que se optimiza: indica qué se maximiza o minimiza.");
        if (!IoParserLocal.exigeBinarias(t.crudo) && !IoParserLocal.exigeEnteros(t.crudo)) dudas.add("¿Cada " + sustantivo + " se elige completo (decisión 0/1) o puede elegirse una fracción?");
        // se compromete el modelo: sus cifras quedan consumidas
        t.marcar(c, "k"); spans.forEach(s -> t.marcar(s[0], s[1]));
        listasModo = true; preguntas.addAll(dudas);
        for (int i = 0; i < n; i++) { Prod p = new Prod(sustantivo + " " + (i + 1), "decisión 0/1", "(?!)", false); if (objetivo != null) p.c = listas.get(objetivo).get(i); prods.add(p); }
        if (objetivo != null) { if (objetivo.startsWith("cost") || objetivo.startsWith("gast")) labelMin = true; else labelMax = true; }
        for (var e : listas.entrySet()) if (!e.getKey().equals(objetivo)) { Rec r = rec(e.getKey()); for (int i = 0; i < n; i++) r.uso.put(i, e.getValue().get(i)); }
        return true;
    }

    // ------------------------------------------------------------------ tabla
    private boolean tablaPL() {
        List<List<Celda>> filas = t.filasTabla();
        if (filas.size() < 3) return false;
        int h = -1;
        for (int i = 0; i < filas.size() && h < 0; i++) {
            List<Celda> f = filas.get(i);
            boolean enc = f.size() >= 3; for (int j = 1; j < f.size() && enc; j++) enc = !f.get(j).vacia() && !t.esNumerica(f.get(j)) && f.get(j).texto().chars().anyMatch(Character::isLetter);
            if (enc) h = i;
        }
        if (h < 0) return false;
        List<Celda> enc = filas.get(h);
        int objCol = -1; List<Integer> recCols = new ArrayList<>();
        for (int j = 1; j < enc.size(); j++) {
            String x = t.n.substring(enc.get(j).ini(), enc.get(j).fin());
            if (x.matches(".*\\b(?:utilidad|ganancia|beneficio|contribucion|ingreso|rendimiento|vpn|retorno|margen|costo|precio|valor)\\w*.*") && objCol < 0) { objCol = j; objetivoTabla = x; }
            else recCols.add(j);
        }
        if (objCol < 0 || recCols.isEmpty()) return false;
        List<String> claves = new ArrayList<>();
        for (int j : recCols) {
            String nom = t.n.substring(enc.get(j).ini(), enc.get(j).fin()).replaceAll("\\(.*?\\)", "").strip();
            Matcher u = Pattern.compile("\\((.*?)\\)").matcher(t.n.substring(enc.get(j).ini(), enc.get(j).fin()));
            String clave = nom.replaceAll("\\s+", " "); claves.add(clave);
            Rec r = rec(clave);
            if (u.find()) { String un = unidadNorm(u.group(1).strip()); if (un != null) r.unidades.add(un); }
        }
        List<List<Celda>> datos = new ArrayList<>();
        for (int i = h + 1; i < filas.size(); i++) datos.add(filas.get(i));
        for (List<Celda> f : datos) {
            String etiqueta = t.n.substring(f.get(0).ini(), f.get(0).fin());
            boolean disp = etiqueta.matches(".*(?:disponib|capacidad|limite|maximo|existencia|recursos).*"), req = etiqueta.matches(".*(?:minimo|requerimiento|requisito|necesidad).*");
            if (disp || req) {
                for (int k = 0; k < recCols.size(); k++) {
                    int j = recCols.get(k); if (j >= f.size() || f.get(j).vacia()) continue;
                    double[] v = t.celdaNum(f.get(j)); if (v == null) return false;
                    rec(claves.get(k)).lim.add(new Lim(disp ? "<=" : ">=", v[0]));
                }
                t.rotulo(f.get(0)); continue;
            }
            boolean numerica = false; for (int j = 1; j < f.size(); j++) numerica |= t.esNumerica(f.get(j));
            if (!numerica) continue;
            String orig = t.original.substring(f.get(0).ini(), f.get(0).fin());
            String cod = t.n.substring(f.get(0).ini(), f.get(0).fin());
            Prod p = cod.matches(COD) ? new Prod(orig, "unidades", Pattern.quote(cod) + "(?![0-9])", true) : new Prod(orig, orig.toLowerCase(Locale.ROOT), rxNombre(singular(cod.strip())), false);
            prods.add(p); int idx = prods.size() - 1; t.rotulo(f.get(0));
            if (objCol < f.size() && !f.get(objCol).vacia()) { double[] v = t.celdaNum(f.get(objCol)); if (v != null) fijarC(idx, v[0], objetivoTabla.matches(".*(?:costo|gasto).*") ? "costo" : "utilidad"); }
            for (int k = 0; k < recCols.size(); k++) { int j = recCols.get(k); if (j < f.size() && !f.get(j).vacia()) { double[] v = t.celdaNum(f.get(j)); if (v != null) rec(claves.get(k)).uso.put(idx, v[0]); } }
        }
        for (List<Celda> f : filas.subList(0, h + 1)) for (Celda c : f) t.rotulo(c);
        tabla = true;
        return prods.size() >= 2;
    }

    // ------------------------------------------------------------------ construcción
    private static String fila(double[] coef, String op, double rhs) {
        StringBuilder sb = new StringBuilder(); int no0 = 0;
        for (double a : coef) if (a != 0) no0++;
        int escritos = 0;
        for (int j = 0; j < coef.length; j++) {
            double a = coef[j]; if (a == 0) continue;
            String term = (no0 == 1 && a == 1.0) ? "x" + (j + 1) : fmt(Math.abs(a)) + "x" + (j + 1);
            sb.append(escritos++ == 0 ? (a < 0 ? "-" : "") : (a < 0 ? "-" : "+")).append(term);
        }
        return sb.append(op).append(fmt(rhs)).toString();
    }
    private IoInterpretacion construir() {
        String explicitoMax = t.tiene("maximiz|(?:ganancia|utilidad|beneficio|ingreso)\\s+maxima|maxima\\s+(?:ganancia|utilidad|beneficio|ingreso)|mayor\\s+(?:ganancia|utilidad|beneficio)") ? "max" : null;
        String explicitoMin = t.tiene("minimiz|costo\\s+minimo|minimo\\s+costo|menor\\s+costo|menor\\s+gasto") ? "min" : null;
        if (tabla && objetivoTabla != null) { if (objetivoTabla.matches(".*(?:costo|gasto).*")) labelMin = true; else labelMax = true; }
        if (explicitoMax != null && explicitoMin != null) preguntas.add("El enunciado menciona maximizar y minimizar: ¿el objetivo es maximizar o minimizar?");
        String sentido = explicitoMax != null && explicitoMin == null ? "max" : explicitoMin != null && explicitoMax == null ? "min" : null;
        if (sentido == null && preguntas.isEmpty()) {
            if (labelMax != labelMin) { sentido = labelMax ? "max" : "min"; supuestos.add("El enunciado no dice si se maximiza o minimiza; por tratarse de " + (labelMax ? "una utilidad" : "un costo") + " se " + (labelMax ? "maximiza." : "minimiza.")); }
            else preguntas.add("¿El objetivo es maximizar (utilidad, ganancia) o minimizar (costo)?");
        }
        boolean costo = "min".equals(sentido);
        for (int i = 0; i < prods.size(); i++) if (Double.isNaN(prods.get(i).c)) preguntas.add("¿Cuál es " + (costo ? "el costo unitario" : "la utilidad unitaria") + " de " + prods.get(i).nombre + "? (indica 0 si no aporta)");
        for (Rec r : recs.values()) {
            String nombre = r.clave;
            if (r.unidades.size() > 1) preguntas.add("Las cantidades de " + nombre + " usan unidades distintas (" + String.join(" y ", r.unidades) + "): exprésalas en la misma unidad antes de modelar.");
            if (r.lim.isEmpty()) preguntas.add("¿Cuánto hay disponible (o se exige) de " + nombre + "?");
            if (r.uso.isEmpty()) preguntas.add("¿Cuánto " + nombre + " consume o aporta cada producto?");
            else for (int i = 0; i < prods.size(); i++) if (!r.uso.containsKey(i)) preguntas.add("Indica cuánto " + nombre + " requiere " + prods.get(i).nombre + " (incluye 0 si no lo usa).");
        }
        if (recs.isEmpty() && extras.isEmpty()) preguntas.add("¿Qué recursos o condiciones limitan la decisión y cuánta disponibilidad tiene cada uno?");
        if (!preguntas.isEmpty()) return t.incompleto("Modelo de programación lineal incompleto.", preguntas);
        List<String> restricciones = new ArrayList<>();
        for (Rec r : recs.values()) { double[] coef = new double[prods.size()]; r.uso.forEach((i, v) -> coef[i] = v); for (Lim l : r.lim) restricciones.add(fila(coef, l.op, l.rhs)); }
        extras.sort(Comparator.comparingInt(e -> e.pos)); for (Extra e : extras) restricciones.add(e.texto);
        StringBuilder obj = new StringBuilder(sentido + " z=");
        for (int i = 0; i < prods.size(); i++) obj.append(i > 0 && prods.get(i).c >= 0 ? "+" : "").append(fmt(prods.get(i).c)).append("x").append(i + 1);
        StringBuilder vars = new StringBuilder(); for (int i = 0; i < prods.size(); i++) vars.append(i > 0 ? "," : "").append("x").append(i + 1);
        restricciones.add(vars + ">=0");
        boolean bin = IoParserLocal.exigeBinarias(t.crudo), entero = bin || IoParserLocal.exigeEnteros(t.crudo);
        if (bin) { Matcher cero = Pattern.compile("\\b0\\s*(?:o|/|-)\\s*1\\b").matcher(t.n); while (cero.find()) t.marcar(cero.start(), cero.end()); } // "(0 o 1)" declara la binaria, no es un dato
        if (entero) restricciones.add(vars + (bin ? " binarias" : " enteras"));
        List<String> sup = new ArrayList<>(supuestos);
        sup.add(entero ? (bin ? "Cada decisión es binaria (0 o 1); se resuelve por ramificación y acotamiento." : "Las cantidades son enteras y no negativas; se resuelven por ramificación y acotamiento.")
                : "Las cantidades se tratan como continuas y no negativas. Si deben ser enteras, indícalo y se resolverá por branch & bound.");
        ObjectNode datos = JSON.createObjectNode().put("objetivo", obj.toString());
        datos.set("restricciones", textos(restricciones));
        List<Map<String, String>> variables = new ArrayList<>();
        for (int i = 0; i < prods.size(); i++) variables.add(variable("x" + (i + 1), (listasModo ? "Elegir " : "Cantidad de ") + prods.get(i).nombre, prods.get(i).unidad));
        return t.listo("pl", entero ? "branch_bound" : "simplex", datos, variables, sup, List.of());
    }
}
