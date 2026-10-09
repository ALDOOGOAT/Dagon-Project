package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.*;

/**
 * Enunciado preparado para el reconocimiento por reglas. {@code n} es el texto en minúsculas, sin acentos y con las
 * mismas posiciones que {@code original}: las letras mayúsculas sueltas (A, B, P1) pasan a un rango privado para no
 * confundirlas con preposiciones y los números en palabras se sustituyen por cifras con relleno de espacios.
 * Toda cifra debe quedar "consumida" por algún dato; las sobrantes se devuelven como preguntas.
 */
final class IoParserTexto {
    static final ObjectMapper JSON = new ObjectMapper();
    static final String NUM = "(?<![\\d.,\\p{L}_-])(\\d+(?:[.,]\\d+){0,8})";
    static final String COD = "[-][0-9]{0,2}";
    private static final char COD0 = '';
    private static final Pattern CODIGO = Pattern.compile("(?<![\\p{L}\\p{N}_/])[A-Z](?![\\p{L}_/])");
    private static final Pattern TOKEN = Pattern.compile("(?<!\\d)\\d+(?:[.,]\\d+){0,8}");
    private static final String UNIDADES = "(?:hora|horas|kg|kilo|kilos|kilogramo|kilogramos|gramo|gramos|litro|litros|tonelada|toneladas|pieza|piezas|metro|metros|dia|dias|semana|semanas|mes|meses|ano|anos|minuto|minutos|peso|pesos|dolar|dolares|euro|euros|onza|onzas|libra|libras)";
    private static final String[] BASE = {"cero", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte",
            "veintiun", "veintiuno", "veintiuna", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa", "cien", "ciento"};
    private static final int[] VALOR = {0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 21, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40, 50, 60, 70, 80, 90, 100, 100};
    private static final Map<String, Integer> PALABRAS = new HashMap<>();
    static { for (int i = 0; i < BASE.length; i++) PALABRAS.put(BASE[i], VALOR[i]); }
    private static final Pattern P_COMPUESTO = Pattern.compile("\\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\\s+y\\s+(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\\b");
    private static final Pattern P_PALABRA = Pattern.compile("\\b(" + String.join("|", BASE) + ")\\b");
    private static final Pattern P_UNO = Pattern.compile("\\b(?:un|uno|una)(?=\\s+" + UNIDADES + "\\b)");
    private static final Pattern P_MEDIO = Pattern.compile("\\b(?:media|medio)(?=\\s+(?:hora|dia|kilo|litro|kg|semana|mes|ano)\\b)");
    private static final Pattern P_MIL = Pattern.compile("(?:(?<![\\d.,])(\\d+(?:[.,]\\d+)?)\\s+)?\\bmil\\b");

    record Tok(int ini, int fin, double valor, boolean ambiguo, boolean palabra, boolean pegado) {}

    final String crudo, original, n;
    final boolean[] usado;
    final List<Tok> nums = new ArrayList<>();
    private final Map<Integer, Tok> porIni = new HashMap<>();
    private final int[] inicioFrase;

    IoParserTexto(String enunciado) {
        crudo = enunciado;
        original = Normalizer.normalize(enunciado, Normalizer.Form.NFC);
        BitSet palabra = new BitSet();
        n = palabras(alinear(original), palabra);
        usado = new boolean[n.length()];
        Matcher m = TOKEN.matcher(n);
        while (m.find()) {
            double[] c = clasificar(m.group());
            int i = m.start();
            char antes = i > 0 ? n.charAt(i - 1) : ' ';
            boolean pegado = Character.isLetter(antes) || antes == '_' || (antes >= '' && antes <= '');
            Tok k = new Tok(i, m.end(), c[0], c[1] == 1, palabra.get(i), pegado);
            nums.add(k); porIni.put(i, k);
        }
        inicioFrase = segmentar();
    }

    // ------------------------------------------------------------------ normalización
    private static char[] alinear(String o) {
        char[] c = new char[o.length()];
        for (int i = 0; i < c.length; i++) {
            char ch = o.charAt(i);
            if (ch < 128) c[i] = Character.toLowerCase(ch);
            else if (ch == ' ' || ch == ' ' || ch == ' ') c[i] = ' ';
            else if (ch == '–' || ch == '—' || ch == '−' || ch == '‐') c[i] = '-';
            else c[i] = Character.toLowerCase(Normalizer.normalize(String.valueOf(ch), Normalizer.Form.NFD).charAt(0));
        }
        Matcher m = CODIGO.matcher(o);
        while (m.find()) c[m.start()] = (char) (COD0 + 1 + (o.charAt(m.start()) - 'A'));
        return c;
    }
    /** Sustituye números escritos con palabras por cifras (mismo largo). Las cifras que ya venían en dígitos no se marcan como palabra. */
    private static String palabras(char[] c, BitSet palabra) {
        String s = new String(c);
        s = sustituir(s, P_COMPUESTO, m -> String.valueOf(PALABRAS.get(m.group(1)) + (m.group(2).startsWith("un") ? 1 : PALABRAS.get(m.group(2)))), palabra, true);
        s = sustituir(s, P_PALABRA, m -> String.valueOf(PALABRAS.get(m.group(1))), palabra, true);
        s = sustituir(s, P_UNO, m -> "1", palabra, true);
        s = sustituir(s, P_MEDIO, m -> "0.5", palabra, true);
        return sustituir(s, P_MIL, m -> m.group(1) == null ? "1000" : String.valueOf(Math.round(Double.parseDouble(m.group(1).replace(',', '.')) * 1000)), palabra, false);
    }
    private static String sustituir(String s, Pattern p, java.util.function.Function<Matcher, String> f, BitSet palabra, boolean marcarPalabra) {
        Matcher m = p.matcher(s); StringBuilder sb = null; int ultimo = 0;
        while (m.find()) {
            String r = f.apply(m); int largo = m.end() - m.start();
            if (r.length() > largo) continue;
            if (sb == null) sb = new StringBuilder(s.length());
            sb.append(s, ultimo, m.start()).append(r).append(" ".repeat(largo - r.length())); ultimo = m.end();
            boolean sinDigitos = marcarPalabra || m.group(1) == null;
            if (sinDigitos) palabra.set(m.start());
        }
        if (sb == null) return s;
        return sb.append(s, ultimo, s.length()).toString();
    }
    /** {valor, ambiguo}: miles con coma o punto solo cuando es inequívoco; "1,200" o "12.345" se declaran ambiguos. */
    static double[] clasificar(String t) {
        boolean punto = t.indexOf('.') >= 0, coma = t.indexOf(',') >= 0;
        if (!punto && !coma) return new double[]{Double.parseDouble(t), 0};
        if (punto && coma) {
            int ls = Math.max(t.lastIndexOf('.'), t.lastIndexOf(','));
            char dec = t.charAt(ls), mil = dec == '.' ? ',' : '.';
            String ent = t.substring(0, ls);
            if (!ent.matches("[1-9]\\d{0,2}(?:" + Pattern.quote(String.valueOf(mil)) + "\\d{3})+") || t.substring(ls + 1).isEmpty()) return new double[]{Double.NaN, 1};
            return new double[]{Double.parseDouble(ent.replace(String.valueOf(mil), "") + "." + t.substring(ls + 1)), 0};
        }
        char s = punto ? '.' : ',';
        long cuenta = t.chars().filter(ch -> ch == s).count();
        if (cuenta == 1) {
            int i = t.indexOf(s); String ent = t.substring(0, i), dec = t.substring(i + 1);
            if (dec.length() == 3 && ent.length() <= 3 && !ent.startsWith("0")) return new double[]{Double.NaN, 1};
            return new double[]{Double.parseDouble(ent + "." + dec), 0};
        }
        if (t.matches("[1-9]\\d{0,2}(?:" + Pattern.quote(String.valueOf(s)) + "\\d{3}){2,}")) return new double[]{Double.parseDouble(t.replace(String.valueOf(s), "")), 0};
        return new double[]{Double.NaN, 1};
    }

    // ------------------------------------------------------------------ cifras
    Tok tok(int ini) { return porIni.get(ini); }
    double valor(Matcher m, int g) { Tok k = porIni.get(m.start(g)); return k != null ? k.valor : Double.NaN; }
    boolean libre(Matcher m, int g) { return !usado[m.start(g)]; }
    void marcar(int ini, int fin) { Arrays.fill(usado, Math.max(0, ini), Math.min(usado.length, fin), true); }
    void marcar(Matcher m, int g) { marcar(m.start(g), m.end(g)); }
    void marcarTodo(Matcher m) { marcar(m.start(), m.end()); }
    Tok ambiguo() { for (Tok k : nums) if (k.ambiguo) return k; return null; }
    boolean hayCifras() { for (Tok k : nums) if (!k.palabra) return true; return false; }
    boolean tiene(String regex) { return Pattern.compile(regex).matcher(n).find(); }
    /** Valor con signo si el guion está pegado a la cifra y no sigue a una letra o un número (celdas de tablas). */
    double conSigno(Tok k) { int i = k.ini; return i > 0 && n.charAt(i - 1) == '-' && (i < 2 || !Character.isLetterOrDigit(n.charAt(i - 2))) ? -k.valor : k.valor; }
    String contexto(int ini, int fin) { return original.substring(Math.max(0, ini - 28), Math.min(original.length(), fin + 28)).replaceAll("\\s+", " ").strip(); }
    List<String> pendientes() {
        List<String> r = new ArrayList<>();
        for (Tok k : nums) {
            if (usado[k.ini] || k.pegado || k.palabra) continue;
            r.add("Hay una cifra sin interpretar: «" + original.substring(k.ini, k.fin) + "» (…" + contexto(k.ini, k.fin) + "…). Indica a qué dato corresponde.");
            if (r.size() == 6) break;
        }
        return r;
    }

    /** Cifra con grupo nombrado para usar en expresiones regulares (valor/libre/marcar por nombre). */
    static String num(String g) { return "(?<![\\d.,\\p{L}_-])(?<" + g + ">\\d+(?:[.,]\\d+){0,8})"; }
    double valor(Matcher m, String g) { Tok k = porIni.get(m.start(g)); return k != null ? k.valor : Double.NaN; }
    boolean libre(Matcher m, String g) { return !usado[m.start(g)]; }
    void marcar(Matcher m, String g) { marcar(m.start(g), m.end(g)); }

    // ------------------------------------------------------------------ tablas de texto
    record Celda(String texto, int ini, int fin) { boolean vacia() { return texto.isEmpty(); } }
    /** Líneas con barras o tabuladores como lista de celdas (las vacías se conservan, salvo la de cada borde con barra). */
    List<List<Celda>> filasTabla() {
        List<List<Celda>> filas = new ArrayList<>();
        int pos = 0;
        for (String linea : original.split("\n", -1)) {
            int base = pos; pos += linea.length() + 1;
            char sep = linea.indexOf('|') >= 0 ? '|' : linea.indexOf('\t') >= 0 ? '\t' : 0;
            if (sep == 0) continue;
            List<Celda> celdas = new ArrayList<>(); int ini = 0;
            for (int i = 0; i <= linea.length(); i++) if (i == linea.length() || linea.charAt(i) == sep) {
                int a = ini, b = i;
                while (a < b && Character.isWhitespace(linea.charAt(a))) a++;
                while (b > a && Character.isWhitespace(linea.charAt(b - 1))) b--;
                celdas.add(new Celda(linea.substring(a, b), base + a, base + b)); ini = i + 1;
            }
            if (!celdas.isEmpty() && celdas.get(0).vacia() && linea.strip().startsWith(String.valueOf(sep))) celdas.remove(0);
            if (!celdas.isEmpty() && celdas.get(celdas.size() - 1).vacia() && linea.strip().endsWith(String.valueOf(sep))) celdas.remove(celdas.size() - 1);
            if (celdas.size() >= 2) filas.add(celdas);
        }
        return filas;
    }
    private static final Pattern CELDA_NUM = Pattern.compile("^(-)?\\$?\\s*+(\\d+(?:[.,]\\d+){0,8})\\s*+(%)?$");
    /** {valor con signo, es porcentaje} de una celda numérica o null (no consume la cifra). */
    double[] celdaValor(Celda c) {
        Matcher m = CELDA_NUM.matcher(n.substring(c.ini(), c.fin()));
        if (!m.matches()) return null;
        double v = clasificar(m.group(2))[0];
        if (Double.isNaN(v)) return null;
        return new double[]{m.group(1) != null ? -v : v, m.group(3) != null ? 1 : 0};
    }
    /** Como celdaValor, pero marca la celda como consumida. */
    double[] celdaNum(Celda c) { double[] v = celdaValor(c); if (v != null) marcar(c.ini(), c.fin()); return v; }
    boolean esNumerica(Celda c) { return CELDA_NUM.matcher(n.substring(c.ini(), c.fin())).matches(); }
    /** Marca como consumidas las cifras de una celda de rótulo (Tarea 1, D2…). */
    void rotulo(Celda c) { marcar(c.ini(), c.fin()); }

    // ------------------------------------------------------------------ filas "etiqueta: n, n, n"
    record Fila(String etiqueta, int etiquetaIni, List<Double> valores, int ini, int fin) {}
    /** Cifras consecutivas desde pos separadas por comas, punto y coma, barras, espacios o "y"; devuelve los valores y la posición final. */
    List<Double> lista(int pos, int[] fin) {
        List<Double> v = new ArrayList<>(); int i = pos, ultimo = pos;
        while (i < n.length()) {
            char ch = n.charAt(i);
            if (ch == ' ' || ch == ',' || ch == ';' || ch == '|' || ch == '\t' || ch == '$') { i++; continue; }
            if (n.startsWith("y ", i) && !v.isEmpty()) { i += 2; continue; }
            boolean neg = ch == '-' && i + 1 < n.length() && Character.isDigit(n.charAt(i + 1));
            int j = neg ? i + 1 : i;
            Tok k = porIni.get(j);
            if (k == null || k.ambiguo) break;
            double x = neg ? -k.valor : k.valor;
            if (j < n.length() && k.fin < n.length() && n.charAt(k.fin) == '%') { x /= 100; i = k.fin + 1; } else i = k.fin;
            v.add(x); ultimo = i;
        }
        fin[0] = ultimo;
        return v;
    }
    /** Filas de la forma "Almacén 1: 8, 6, 10, 9" (la etiqueta llega hasta el delimitador anterior). */
    List<Fila> filasConDosPuntos() {
        List<Fila> filas = new ArrayList<>();
        for (int i = 0; i < n.length(); i++) {
            if (n.charAt(i) != ':') continue;
            int s = i; while (s > 0 && ".;:?!\n|".indexOf(n.charAt(s - 1)) < 0) s--;
            while (s < i && n.charAt(s) == ' ') s++;
            int[] fin = new int[1];
            List<Double> v = lista(i + 1, fin);
            if (v.isEmpty() || i - s > 45 || i == s) continue;
            filas.add(new Fila(original.substring(s, i).strip(), s, v, i + 1, fin[0]));
        }
        return filas;
    }
    /** Marca las cifras de [ini, fin) y de la etiqueta. */
    void consumir(Fila f) { marcar(f.etiquetaIni(), f.fin()); }

    // ------------------------------------------------------------------ frases y evidencias
    private int[] segmentar() {
        List<Integer> in = new ArrayList<>(); in.add(0); int L = original.length();
        for (int i = 0; i < L; i++) {
            char ch = original.charAt(i);
            if (ch == '\n' || ch == '?' || ch == '!' || (ch == '.' && (i + 1 >= L || Character.isWhitespace(original.charAt(i + 1))))) if (i + 1 < L) in.add(i + 1);
        }
        return in.stream().mapToInt(Integer::intValue).toArray();
    }
    /** Todas las frases como intervalos [ini, fin) del texto. */
    List<int[]> frases() {
        List<int[]> r = new ArrayList<>();
        for (int i = 0; i < inicioFrase.length; i++) r.add(new int[]{inicioFrase[i], i + 1 < inicioFrase.length ? inicioFrase[i + 1] : original.length()});
        return r;
    }
    int[] frase(int pos) {
        int i = Arrays.binarySearch(inicioFrase, pos); if (i < 0) i = -i - 2;
        return new int[]{inicioFrase[i], i + 1 < inicioFrase.length ? inicioFrase[i + 1] : original.length()};
    }
    /** Fin de la frase que contiene pos (para limitar búsquedas al mismo enunciado). */
    int finFrase(int pos) { return frase(pos)[1]; }
    int inicioFrase(int pos) { return frase(pos)[0]; }
    /** Citas literales: la frase de cada cifra consumida; si son demasiadas o no son literales, el enunciado completo. */
    List<String> evidencias() {
        Set<String> citas = new LinkedHashSet<>();
        for (Tok k : nums) if (usado[k.ini]) {
            int[] f = frase(k.ini);
            String s = original.substring(f[0], f[1]).strip();
            if (!s.isBlank()) citas.add(s);
            if (citas.size() > 16) break;
        }
        String ref = IoModeloValidator.normalizarCita(crudo);
        if (citas.isEmpty() || citas.size() > 16 || citas.stream().anyMatch(c -> !ref.contains(IoModeloValidator.normalizarCita(c)))) return List.of(crudo.strip());
        return new ArrayList<>(citas);
    }

    // ------------------------------------------------------------------ resultados
    IoInterpretacion incompleto(String resumen, String... preguntas) { return IoInterpretacion.incompleto(resumen, List.of(preguntas)); }
    IoInterpretacion incompleto(String resumen, List<String> preguntas) { return IoInterpretacion.incompleto(resumen, preguntas.isEmpty() ? List.of("Aclara los datos que faltan.") : preguntas); }
    IoInterpretacion listo(String tipo, String metodo, ObjectNode datos, List<Map<String, String>> variables, List<String> supuestos, List<String> advertencias) {
        List<String> pend = pendientes();
        if (!pend.isEmpty()) return incompleto("Hay cifras del enunciado que el reconocimiento local no pudo interpretar.", pend);
        ObjectNode modelo = JSON.createObjectNode().put("tipo", tipo).put("metodo", metodo);
        modelo.set("variables", JSON.valueToTree(variables)); modelo.set("datos", datos);
        ArrayNode citas = JSON.createArrayNode();
        for (String c : evidencias()) citas.add(JSON.createObjectNode().put("campo", "datos").put("texto", c));
        modelo.set("evidencias", citas);
        return new IoInterpretacion("listo", "local", "Se identificó un modelo de " + tipo + ". Revisa sus datos y supuestos antes de resolver.", modelo, List.of(), advertencias, supuestos);
    }

    // ------------------------------------------------------------------ utilidades estáticas
    static ArrayNode arr(double... v) { ArrayNode a = JSON.createArrayNode(); for (double x : v) a.add(x); return a; }
    static ArrayNode arr(List<Double> v) { ArrayNode a = JSON.createArrayNode(); for (double x : v) a.add(x); return a; }
    static ArrayNode mat(List<List<Double>> m) { ArrayNode a = JSON.createArrayNode(); for (List<Double> f : m) a.add(arr(f)); return a; }
    static ArrayNode textos(List<String> v) { ArrayNode a = JSON.createArrayNode(); v.forEach(a::add); return a; }
    /** 3.0, 0.5, 10000000: nunca notación científica (el parser de PL del cliente no la admite junto a una variable). */
    static String fmt(double v) { return BigDecimal.valueOf(v).toPlainString(); }
    static Map<String, String> variable(String simbolo, String nombre, String unidad) {
        Map<String, String> m = new LinkedHashMap<>(); m.put("simbolo", simbolo); m.put("nombre", nombre); if (unidad != null) m.put("unidad", unidad); return m;
    }
    static String mayuscula(String s) { return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1); }
    /** Cuantil de la normal estándar (Acklam); error relativo < 1.2e-9. */
    static double zNormal(double p) {
        double[] a = {-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00};
        double[] b = {-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01};
        double[] c = {-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00};
        double[] d = {7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00};
        if (p < 0.02425 || p > 1 - 0.02425) {
            double q = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
            double x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
            return p < 0.5 ? x : -x;
        }
        double q = p - 0.5, r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
}
