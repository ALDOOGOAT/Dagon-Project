package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.IoParserTexto.*;

/**
 * Enunciados con la función escrita: "maximizar f(x)=x(5-x) en [0,5]", "minimizar x^2+y^2 sujeto a x+y=10",
 * "maximizar z=3x1+5x2 sujeto a ...". Clasifica por grado (lineal, cuadrática, no lineal) y reescribe la fórmula
 * con multiplicaciones explícitas; nunca evalúa código.
 */
final class IoParserFormulas {
    private static final Set<String> FUNCIONES = Set.of("sin", "cos", "tan", "exp", "log", "ln", "sqrt", "abs");
    private static final String CORTE = "(?=\\s+(?:sujet[oa]\\s+a|s\\.a\\.|s\\.t\\.|con\\s+las\\s+restricciones|tal\\s+que|en\\s+el\\s+intervalo|en\\s+\\[|en\\s+el\\s+dominio|para\\s|donde|con\\s+x0|partiendo|iniciando|usando|empezando|con\\s+punto|con\\s+valor|con\\s+aproximacion|con\\s+inicio)|\\s*$|[;?!]|\\.(?:\\s|$))";
    private static final String CUERPO = "[^;?!]{0,300}?";
    private static final Pattern O1 = Pattern.compile("\\b(?<s>maximiz\\w*|minimiz\\w*|optimiz\\w*)\\s+(?:la\\s+funcion\\s+)?(?:[a-z-]\\s*(?:\\([^)]*\\))?)?\\s*=\\s*(?<f>" + CUERPO + ")" + CORTE);
    private static final Pattern O3 = Pattern.compile("\\b(?<s>minimo|maximo|extremo|punto\\s+estacionario|optimo)\\s+(?:local\\s+|global\\s+)?de\\s+(?:la\\s+funcion\\s+)?(?:[a-z-]\\s*\\([^)]*\\)\\s*=\\s*)?(?<f>" + CUERPO + ")" + CORTE);
    private static final Pattern O2 = Pattern.compile("\\b(?<s>maximiz\\w*|minimiz\\w*)\\s+(?<f>[^.;?!=<>]{0,300}?)" + CORTE);
    private static final Pattern SUJETO = Pattern.compile("(?:sujet[oa]\\s+a|s\\.a\\.|s\\.t\\.|con\\s+las\\s+restricciones|tal\\s+que|restricciones\\s*:)\\s*:?");
    private static final Pattern REL = Pattern.compile("^(?<l>[^<>=≤≥]{1,300}?)\\s*+(?<op><=|>=|≤|≥|=<|=>|<|>|=)\\s*+(?<r>.{1,300})$");

    private record Obj(String sentido, int ini, int fin) {}
    private record Rel(String l, String op, String r, int ini, int fin) {}

    static IoInterpretacion interpretar(IoParserTexto t) {
        Obj obj = objetivo(t);
        if (obj == null) return null;
        String f = t.original.substring(obj.ini(), obj.fin());
        List<Rel> rels = new ArrayList<>(); List<String> listas = new ArrayList<>(); List<String> preguntas = new ArrayList<>();
        int regionIni = -1, regionFin = -1;
        Matcher sj = SUJETO.matcher(t.n); sj.region(obj.fin(), t.n.length());
        if (sj.find()) {
            regionIni = sj.end(); regionFin = fin(t, regionIni);
            restricciones(t, regionIni, regionFin, rels, listas, preguntas);
        }
        if (!preguntas.isEmpty()) return t.incompleto("Las restricciones escritas no se pudieron interpretar.", preguntas);
        // variables en orden de aparición
        LinkedHashSet<String> vars = new LinkedHashSet<>();
        normalizar(f, true, vars, Map.of());
        for (Rel r : rels) { normalizar(r.l(), true, vars, Map.of()); normalizar(r.r(), true, vars, Map.of()); }
        for (String l : listas) for (String v : l.split(",")) normalizar(v, true, vars, Map.of());
        if (vars.isEmpty() || vars.size() > 10) return null;
        int grado = grado(normalizar(f, true, new LinkedHashSet<>(), Map.of()));
        boolean lineales = true; int gradoRel = 0;
        for (Rel r : rels) { int g = Math.max(grado(normalizar(r.l(), true, new LinkedHashSet<>(), Map.of())), grado(normalizar(r.r(), true, new LinkedHashSet<>(), Map.of()))); gradoRel = Math.max(gradoRel, g); if (g < 0 || g > 1) lineales = false; }
        // intervalo y punto inicial
        double[] ab = intervalo(t, obj); Double x0 = valorInicial(t, obj); double[] punto = puntoInicial(t, vars.size());
        String sentido = obj.sentido();
        boolean enteras = IoParserLocal.exigeEnteros(t.crudo), binarias = IoParserLocal.exigeBinarias(t.crudo);
        if (t.tiene("variables?\\s+libres|sin\\s+restriccion\\s+de\\s+signo|irrestrict")) return t.incompleto("Variables sin restricción de signo.", "Los solvers de PL y cuadrática suponen variables no negativas: ¿se puede añadir x ≥ 0?");
        // ---- clasificación
        if (rels.isEmpty() && listas.isEmpty()) {
            if (grado < 0 && !t.tiene("\\bnewton\\b|dorada") && vars.size() > 1) return null;
            if (vars.size() == 1) {
                String v = vars.iterator().next(); Map<String, String> ren = v.equals("x") ? Map.of() : Map.of(v, "x");
                String fx = normalizar(f, true, new LinkedHashSet<>(), ren);
                List<String> sup = new ArrayList<>(); if (!ren.isEmpty()) sup.add("La variable «" + v + "» se renombró a x para el solver.");
                boolean newton = t.tiene("\\bnewton\\b|punto\\s+estacionario|derivada") && !t.tiene("seccion\\s+dorada|golden");
                if (ab != null && !newton) {
                    if (sentido == null) return t.incompleto("Falta si se maximiza o minimiza.", "¿Se busca el máximo o el mínimo de f en el intervalo?");
                    if (ab[0] >= ab[1]) return t.incompleto("Intervalo inválido.", "El intervalo debe cumplir a < b.");
                    t.marcar(obj.ini(), obj.fin()); marcarIntervalo(t, ab);
                    ObjectNode d = JSON.createObjectNode().put("f", fx).put("a", ab[0]).put("b", ab[1]).put("objetivo", sentido);
                    sup.add("Sección dorada: supone f unimodal en el intervalo; revisa los extremos.");
                    return t.listo("noLineal", "dorada", d, List.of(variable("x", "Variable de decisión", null)), sup, List.of());
                }
                if (x0 == null && ab == null) return t.incompleto("Falta el punto inicial o el intervalo.", "Indica un intervalo [a, b] (para sección dorada) o un punto inicial x0 (para Newton).");
                if (x0 == null) return t.incompleto("Falta el punto inicial de Newton.", "¿Cuál es el punto inicial x0?");
                t.marcar(obj.ini(), obj.fin()); marcarX0(t, obj);
                ObjectNode d = JSON.createObjectNode().put("f", fx).put("x0", x0);
                if (ab != null) { d.put("a", ab[0]).put("b", ab[1]); marcarIntervalo(t, ab); }
                sup.add("Newton busca un punto estacionario cercano a x0; no certifica un óptimo global.");
                return t.listo("noLineal", "newton", d, List.of(variable("x", "Variable de decisión", null)), sup, List.of());
            }
            if (vars.size() <= 4) {
                if (punto == null) return t.incompleto("Falta el punto inicial.", "Indica el punto inicial del método de Newton multivariable, por ejemplo (0, 0).");
                if (punto.length != vars.size()) return t.incompleto("El punto inicial no coincide con las variables.", "El punto inicial debe tener " + vars.size() + " valores, uno por variable (" + String.join(", ", vars) + ").");
                t.marcar(obj.ini(), obj.fin()); marcarPunto(t);
                ObjectNode d = JSON.createObjectNode().put("f", normalizar(f, true, new LinkedHashSet<>(), Map.of())); d.set("simbolos", textos(new ArrayList<>(vars))); d.set("inicio", arr(punto));
                if (sentido != null) d.put("objetivo", sentido);
                List<Map<String, String>> vs = new ArrayList<>(); for (String v : vars) vs.add(variable(v, "Variable " + v, null));
                return t.listo("noLineal", "multivariable", d, vs, List.of("Newton multivariable encuentra un punto estacionario cercano al inicial; se clasifica con el Hessiano."), List.of());
            }
            return IoInterpretacion.noSoportado("La función tiene más de 4 variables sin restricciones.");
        }
        // ---- con restricciones
        List<Rel> iguales = rels.stream().filter(r -> r.op().equals("=")).toList();
        if (vars.size() == 2 && rels.size() == 1 && iguales.size() == 1 && listas.isEmpty() && grado >= 0) {
            List<String> v = new ArrayList<>(vars); Map<String, String> ren = new HashMap<>();
            if (!vars.equals(Set.of("x", "y"))) { ren.put(v.get(0), "x"); ren.put(v.get(1), "y"); }
            Rel r = iguales.get(0);
            Set<String> chk = new LinkedHashSet<>();
            String g = normalizar(r.l(), true, chk, ren), rhs = normalizar(r.r(), true, new LinkedHashSet<>(), ren);
            Double c = numero(rhs);
            if (c == null) { g = g + "-(" + rhs + ")"; c = 0.0; }
            else if (numero(g) != null) return t.incompleto("La restricción no contiene variables.", "Revisa la restricción de igualdad.");
            t.marcar(obj.ini(), obj.fin()); t.marcar(regionIni, regionFin);
            ObjectNode d = JSON.createObjectNode().put("f", normalizar(f, true, new LinkedHashSet<>(), ren)).put("g", g).put("c", c);
            List<String> sup = new ArrayList<>(List.of("Lagrange halla un punto estacionario de f sobre g = c; no distingue si es mínimo o máximo (" + (sentido == null ? "el enunciado no lo indica" : "el enunciado pide " + sentido) + ")."));
            if (!ren.isEmpty()) sup.add("Variables renombradas para el solver: " + v.get(0) + " → x, " + v.get(1) + " → y.");
            return t.listo("noLineal", "lagrange", d, List.of(variable("x", "Variable x", null), variable("y", "Variable y", null)), sup, List.of());
        }
        if (grado < 0 || grado > 2 || !lineales) return IoInterpretacion.noSoportado("La función o las restricciones no son lineales ni cuadráticas con restricciones lineales: queda fuera de los solvers disponibles.");
        if (sentido == null) return t.incompleto("Falta si se maximiza o minimiza.", "¿Se maximiza o se minimiza la función?");
        boolean pl = grado <= 1;
        if (vars.size() > (pl ? 10 : 6)) return t.incompleto("Demasiadas variables.", pl ? "La programación lineal admite hasta 10 variables." : "La programación cuadrática admite hasta 6 variables.");
        if (!pl && (enteras || binarias)) return IoInterpretacion.noSoportado("Programación cuadrática entera: queda fuera de los solvers disponibles.");
        List<String> restr = new ArrayList<>();
        for (Rel r : rels) restr.add(normalizar(r.l(), false, new LinkedHashSet<>(), Map.of()) + opCanonico(r.op()) + normalizar(r.r(), false, new LinkedHashSet<>(), Map.of()));
        restr.addAll(listas);
        List<String> sup = new ArrayList<>();
        boolean tieneNoNeg = listas.stream().anyMatch(l -> l.endsWith(">=0"));
        if (!tieneNoNeg) { restr.add(String.join(",", vars) + ">=0"); sup.add("No se declararon las restricciones de signo: se supone x ≥ 0 para todas las variables."); }
        if (pl && (enteras || binarias)) restr.add(String.join(",", vars) + (binarias ? " binarias" : " enteras"));
        t.marcar(obj.ini(), obj.fin()); t.marcar(regionIni, regionFin);
        ObjectNode d = JSON.createObjectNode().put("objetivo", sentido + " z=" + normalizar(f, false, new LinkedHashSet<>(), Map.of()));
        d.set("restricciones", textos(restr));
        List<Map<String, String>> vs = new ArrayList<>(); for (String v : vars) vs.add(variable(v, "Variable " + v, null));
        sup.add(pl ? "Programación lineal con variables no negativas." : "Programación cuadrática con restricciones lineales: se resuelve por condiciones KKT.");
        return t.listo(pl ? "pl" : "cuadratica", pl ? (enteras || binarias ? "branch_bound" : "simplex") : "kkt", d, vs, sup, List.of());
    }

    // ------------------------------------------------------------------ extracción
    private static Obj objetivo(IoParserTexto t) {
        for (Pattern p : List.of(O1, O3, O2)) {
            Matcher m = p.matcher(t.n);
            while (m.find()) {
                String f = t.original.substring(m.start("f"), m.end("f")).strip();
                if (!esFormula(f)) continue;
                int ini = m.start("f"); while (ini < m.end("f") && Character.isWhitespace(t.original.charAt(ini))) ini++;
                String s = m.group("s");
                String sentido = s.startsWith("maxim") ? "max" : s.startsWith("minim") ? "min" : null;
                if (sentido == null && s.startsWith("optim")) sentido = null;
                return new Obj(sentido, ini, ini + f.length());
            }
        }
        return null;
    }
    static boolean esFormula(String f) {
        if (f.isBlank() || f.length() > 300 || !f.matches("[A-Za-z0-9_+\\-*/^().,\\s²³·×−÷]+")) return false;
        Matcher w = Pattern.compile("[A-Za-z]{4,}").matcher(f);
        while (w.find()) if (!FUNCIONES.contains(w.group().toLowerCase(Locale.ROOT)) && !w.group().equals("sqrt")) return false;
        return f.matches("(?s).*[+\\-*/^()²³·×−÷].*") && f.matches("(?s).*[A-Za-z].*");
    }
    private static int fin(IoParserTexto t, int ini) {
        for (int i = ini; i < t.n.length(); i++) {
            char ch = t.n.charAt(i);
            if (ch == '?' || ch == '!') return i;
            if (ch == '.' && !(i > 0 && Character.isDigit(t.n.charAt(i - 1)) && i + 1 < t.n.length() && Character.isDigit(t.n.charAt(i + 1)))) return i;
        }
        return t.n.length();
    }
    private static void restricciones(IoParserTexto t, int a, int b, List<Rel> rels, List<String> listas, List<String> preguntas) {
        String texto = t.original.substring(a, b);
        List<int[]> piezas = new ArrayList<>(); int ini = 0;
        Matcher sep = Pattern.compile(";|\\n|\\s+y\\s+|\\s+e\\s+").matcher(texto);
        // " y " une restricciones solo si la anterior ya tiene su relación ("x + y = 10" conserva la variable y)
        while (sep.find()) { if (sep.group().matches("\\s+[ye]\\s+") && !texto.substring(ini, sep.start()).matches("(?s).*[<>=≤≥].*")) continue; piezas.add(new int[]{ini, sep.start()}); ini = sep.end(); }
        piezas.add(new int[]{ini, texto.length()});
        for (int[] p : piezas) {
            String pieza = texto.substring(p[0], p[1]).strip();
            if (pieza.isEmpty()) continue;
            if (pieza.matches("(?i)[A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*\\s+(?:son\\s+)?(?:enter[oa]s?|binari[oa]s?)")) continue; // la integralidad se lee del texto completo
            if (pieza.length() > 300) { preguntas.add("Una restricción es demasiado larga para interpretarla; divídela en restricciones más cortas."); continue; }
            List<String> partes = new ArrayList<>(List.of(pieza.split(",")));
            List<String> pendientes = new ArrayList<>();
            for (String parte : partes) {
                String q = parte.strip(); if (q.isEmpty()) continue;
                if (q.matches("(?i)[A-Za-z]\\w*\\s+(?:son\\s+)?(?:enter[oa]s?|binari[oa]s?)")) { pendientes.clear(); continue; } // "x1, x2 enteras"
                Matcher m = REL.matcher(q);
                if (!m.matches()) { if (q.matches("[A-Za-z][A-Za-z0-9_]*")) { pendientes.add(q); continue; } preguntas.add("No se pudo interpretar «" + q + "» como restricción: escribe cada una con ≤, ≥ o =."); continue; }
                String op = m.group("op"), l = m.group("l").strip(), r = m.group("r").strip();
                if (op.equals("<") || op.equals(">")) { preguntas.add("La restricción «" + q + "» usa una desigualdad estricta: indica ≤ o ≥ (los solvers trabajan con desigualdades no estrictas)."); continue; }
                if (!pendientes.isEmpty() || l.matches("[A-Za-z][A-Za-z0-9_]*")) {
                    if (l.matches("[A-Za-z][A-Za-z0-9_]*") && r.matches("0+(?:\\.0+)?") && opCanonico(op).equals(">=")) { pendientes.add(l); listas.add(String.join(",", pendientes) + ">=0"); pendientes.clear(); continue; }
                    if (!pendientes.isEmpty()) { preguntas.add("No se pudo interpretar «" + String.join(", ", pendientes) + "» como parte de una restricción."); pendientes.clear(); }
                }
                int off = a + p[0] + texto.substring(p[0], p[1]).indexOf(q);
                rels.add(new Rel(l, opCanonico(op), r, off, off + q.length()));
            }
            if (!pendientes.isEmpty()) preguntas.add("Las variables «" + String.join(", ", pendientes) + "» aparecen sin relación (por ejemplo x ≥ 0).");
        }
    }
    private static String opCanonico(String op) { return switch (op) { case "≤", "=<", "<=" -> "<="; case "≥", "=>", ">=" -> ">="; default -> op; }; }
    private static double[] intervalo(IoParserTexto t, Obj obj) {
        String num = "(-?\\s*\\d+(?:[.,]\\d+)?)";
        Matcher m = Pattern.compile("\\[\\s*" + num + "\\s*[,;]\\s*" + num + "\\s*\\]|entre\\s+" + num + "\\s+y\\s+" + num + "|" + num + "\\s*(?:<=|≤)\\s*[a-z]\\s*(?:<=|≤)\\s*" + num).matcher(t.n);
        if (!m.find()) return null;
        List<Double> v = new ArrayList<>();
        for (int g = 1; g <= m.groupCount(); g++) if (m.group(g) != null) v.add(Double.parseDouble(m.group(g).replace(" ", "").replace(',', '.')));
        return v.size() == 2 ? new double[]{v.get(0), v.get(1)} : null;
    }
    private static void marcarIntervalo(IoParserTexto t, double[] ab) {
        Matcher m = Pattern.compile("\\[\\s*-?\\s*\\d+(?:[.,]\\d+)?\\s*[,;]\\s*-?\\s*\\d+(?:[.,]\\d+)?\\s*\\]|entre\\s+-?\\s*\\d+(?:[.,]\\d+)?\\s+y\\s+-?\\s*\\d+(?:[.,]\\d+)?|-?\\s*\\d+(?:[.,]\\d+)?\\s*(?:<=|≤)\\s*[a-z]\\s*(?:<=|≤)\\s*-?\\s*\\d+(?:[.,]\\d+)?").matcher(t.n);
        if (m.find()) t.marcar(m.start(), m.end());
    }
    private static final String X0 = "(?:partiendo\\s+de(?:l)?|punto\\s+inicial|valor\\s+inicial|inicio|empezando\\s+(?:en|de)|iniciando\\s+(?:en|de)|aproximacion\\s+inicial|con)\\s*(?:x0|x_0|x)?\\s*(?:=|de|en|:)?\\s*(-?\\s*\\d+(?:[.,]\\d+)?)";
    private static Double valorInicial(IoParserTexto t, Obj obj) {
        Matcher m = Pattern.compile("\\b" + X0 + "(?![\\d,.]*\\s*,)").matcher(t.n);
        while (m.find()) if (m.start() >= obj.fin()) return Double.parseDouble(m.group(1).replace(" ", "").replace(',', '.'));
        return null;
    }
    private static void marcarX0(IoParserTexto t, Obj obj) {
        Matcher m = Pattern.compile("\\b" + X0 + "(?![\\d,.]*\\s*,)").matcher(t.n);
        while (m.find()) if (m.start() >= obj.fin()) { t.marcar(m.start(1), m.end(1)); return; }
    }
    private static final Pattern PUNTO = Pattern.compile("\\(\\s*(-?\\s*\\d+(?:[.,]\\d+)?(?:\\s*[,;]\\s*-?\\s*\\d+(?:[.,]\\d+)?){0,3})\\s*\\)");
    private static double[] puntoInicial(IoParserTexto t, int n) {
        Matcher m = Pattern.compile("(?:punto|partiendo\\s+de(?:l)?|inicio|inicial|desde)[^.;?!0-9(]{0,25}" + PUNTO.pattern()).matcher(t.n);
        if (!m.find()) return null;
        String[] partes = m.group(1).split("\\s*[,;]\\s*"); double[] v = new double[partes.length];
        for (int i = 0; i < v.length; i++) v[i] = Double.parseDouble(partes[i].replace(" ", "").replace(',', '.'));
        return v;
    }
    private static void marcarPunto(IoParserTexto t) {
        Matcher m = Pattern.compile("(?:punto|partiendo\\s+de(?:l)?|inicio|inicial|desde)[^.;?!0-9(]{0,25}" + PUNTO.pattern()).matcher(t.n);
        if (m.find()) t.marcar(m.start(1), m.end(1));
    }

    // ------------------------------------------------------------------ fórmulas
    private static Double numero(String s) { try { return s.matches("-?\\d+(?:\\.\\d+)?") ? Double.parseDouble(s) : null; } catch (RuntimeException e) { return null; } }
    private static String limpiar(String f) {
        return f.replace('−', '-').replace('×', '*').replace('·', '*').replace('÷', '/').replace("**", "^").replace("²", "^2").replace("³", "^3").replaceAll("(?<=\\d),(?=\\d)", ".").replaceAll("\\s+", "");
    }
    /**
     * Reescribe la fórmula: ln→log, separa productos de variables (xy, x1x2) y agrega "*" donde hacía falta.
     * completo=true escribe también 6*x (para mathjs); false conserva 6x como en las fórmulas de PL.
     */
    static String normalizar(String fuente, boolean completo, Set<String> vars, Map<String, String> renombre) {
        String f = limpiar(fuente);
        Matcher m = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|.").matcher(f);
        List<String[]> tokens = new ArrayList<>(); // {tipo, texto}: N número, V variable, F función, ( ) O operador
        while (m.find()) {
            String x = m.group();
            if (Character.isLetter(x.charAt(0)) || x.charAt(0) == '_') {
                String low = x.toLowerCase(Locale.ROOT);
                if (FUNCIONES.contains(low) && f.startsWith("(", m.end())) { tokens.add(new String[]{"F", low.equals("ln") ? "log" : low}); continue; }
                if (x.equals("pi") || x.equals("e")) { tokens.add(new String[]{"N", x}); continue; }
                for (String v : partir(x)) { String nombre = renombre.getOrDefault(v, v); vars.add(v); tokens.add(new String[]{"V", nombre}); }
            } else if (Character.isDigit(x.charAt(0))) tokens.add(new String[]{"N", x});
            else tokens.add(new String[]{x.equals("(") ? "(" : x.equals(")") ? ")" : "O", x});
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tokens.size(); i++) {
            String[] cur = tokens.get(i); sb.append(cur[1]);
            if (i + 1 >= tokens.size()) break;
            String a = cur[0], b = tokens.get(i + 1)[0];
            boolean izq = a.equals("N") || a.equals("V") || a.equals(")"), der = b.equals("N") || b.equals("V") || b.equals("(") || b.equals("F");
            if (!izq || !der) continue;
            boolean numVar = a.equals("N") && !b.equals("N") ;
            if (a.equals("N") && b.equals("N")) continue;
            if (numVar && !completo && !b.equals("(")) continue; // 15x1 se conserva
            sb.append('*');
        }
        return sb.toString();
    }
    /** "xy" → x,y; "x1x2" → x1,x2; las palabras de 4 letras o más son una sola variable. */
    private static List<String> partir(String x) {
        if (x.matches("[A-Za-z][A-Za-z0-9_]*") && (x.length() >= 4 && x.matches("[A-Za-z]+") || x.matches("[A-Za-z][0-9]*") || x.contains("_"))) return List.of(x);
        Matcher m = Pattern.compile("[A-Za-z][0-9]*").matcher(x); List<String> r = new ArrayList<>(); int fin = 0;
        while (m.find() && m.start() == fin) { r.add(m.group()); fin = m.end(); }
        return fin == x.length() && !r.isEmpty() ? r : List.of(x);
    }

    // ------------------------------------------------------------------ grado polinómico (-1 si no es polinomio)
    static int grado(String e) {
        try { int[] pos = {0}; int g = suma(e, pos); return pos[0] == e.length() ? g : -1; } catch (IllegalArgumentException | StackOverflowError ex) { return -1; }
    }
    private static int suma(String e, int[] p) {
        int g = termino(e, p);
        while (p[0] < e.length() && (e.charAt(p[0]) == '+' || e.charAt(p[0]) == '-')) { p[0]++; g = Math.max(g, termino(e, p)); }
        return g;
    }
    private static int termino(String e, int[] p) {
        int g = factor(e, p);
        while (p[0] < e.length()) {
            char c = e.charAt(p[0]);
            if (c == '*') { p[0]++; g += factor(e, p); }
            else if (c == '/') { p[0]++; if (factor(e, p) != 0) throw new IllegalArgumentException("divide por variable"); }
            else if (Character.isLetterOrDigit(c) || c == '(' || c == '_') g += factor(e, p);
            else break;
        }
        return g;
    }
    private static int factor(String e, int[] p) {
        if (p[0] >= e.length()) throw new IllegalArgumentException("fin inesperado");
        char c = e.charAt(p[0]);
        if (c == '+' || c == '-') { p[0]++; return factor(e, p); }
        int base;
        if (c == '(') { p[0]++; base = suma(e, p); if (p[0] >= e.length() || e.charAt(p[0]++) != ')') throw new IllegalArgumentException("paréntesis"); }
        else if (Character.isDigit(c) || c == '.') { while (p[0] < e.length() && (Character.isDigit(e.charAt(p[0])) || e.charAt(p[0]) == '.')) p[0]++; base = 0; }
        else if (Character.isLetter(c) || c == '_') {
            int ini = p[0]; while (p[0] < e.length() && (Character.isLetterOrDigit(e.charAt(p[0])) || e.charAt(p[0]) == '_')) p[0]++;
            String id = e.substring(ini, p[0]);
            if (FUNCIONES.contains(id) && p[0] < e.length() && e.charAt(p[0]) == '(') throw new IllegalArgumentException("función");
            base = id.equals("pi") || id.equals("e") ? 0 : 1;
        } else throw new IllegalArgumentException("símbolo");
        if (p[0] < e.length() && e.charAt(p[0]) == '^') {
            p[0]++; boolean par = p[0] < e.length() && e.charAt(p[0]) == '('; if (par) p[0]++;
            int ini = p[0]; while (p[0] < e.length() && Character.isDigit(e.charAt(p[0]))) p[0]++;
            if (ini == p[0]) throw new IllegalArgumentException("exponente");
            int n = Integer.parseInt(e.substring(ini, p[0]));
            if (par && (p[0] >= e.length() || e.charAt(p[0]++) != ')')) throw new IllegalArgumentException("exponente");
            return base * n;
        }
        return base;
    }
}
