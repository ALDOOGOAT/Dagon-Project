package com.dagon.backend.service.io.solver;

import java.util.*;
import java.util.function.DoubleUnaryOperator;
import java.util.regex.*;

/**
 * Fórmula compilada a un árbol evaluable. Parser de descenso recursivo que nunca usa eval, scripting ni reflexión:
 * solo números, variables declaradas, + - * / ^, funciones de una lista cerrada y las constantes pi y e.
 * Multiplicación implícita (2x, 3(x+1), x y); tras una división se exige paréntesis (x/(2y)) por ser ambiguo.
 */
public final class IoExpresion {
    /** Derivada numérica y su ruido de redondeo estimado. */
    public record Derivada(double valor, double ruido) {
        /** Nula si no se distingue del ruido de redondeo (con margen 100x y un piso absoluto de 1e-9). */
        public boolean nula() { return Math.abs(valor) <= 100 * ruido + 1e-9; }
    }
    private interface Nodo { double ev(double[] x); }

    public static final int MAX_LONGITUD = 500, MAX_PROFUNDIDAD = 40, MAX_ORDEN = 10;
    private static final double EPS = Math.ulp(1.0), MAX_LITERAL = 1e12;
    private static final Pattern TOKEN = Pattern.compile("\\s*(?:(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?|[A-Za-z][A-Za-z0-9_]*|[-+*/^()])");
    private static final Pattern NOMBRE = Pattern.compile("[A-Za-z][A-Za-z0-9_]{0,29}");
    private static final Map<String, DoubleUnaryOperator> FUNCIONES = Map.of("sin", Math::sin, "cos", Math::cos, "tan", Math::tan,
            "exp", Math::exp, "log", Math::log, "ln", Math::log, "sqrt", Math::sqrt, "abs", Math::abs);
    private static final Map<String, Double> CONSTANTES = Map.of("pi", Math.PI, "e", Math.E);

    private final List<String> variables;
    private final Nodo raiz;
    private IoExpresion(List<String> variables, Nodo raiz) { this.variables = variables; this.raiz = raiz; }

    /** Compila la fórmula; solo admite como símbolos libres las variables dadas. */
    public static IoExpresion compilar(String texto, List<String> variables) {
        Set<String> vistas = new HashSet<>();
        for (String v : variables)
            if (v == null || !NOMBRE.matcher(v).matches() || reservado(v) || !vistas.add(v)) throw error("Variable inválida, repetida o reservada: " + v + ".");
        var parser = new Parser(tokens(texto), variables);
        Nodo arbol = parser.suma();
        if (parser.p < parser.tk.size()) throw error("Sintaxis inválida cerca de «" + parser.tk.get(parser.p) + "».");
        return new IoExpresion(List.copyOf(variables), arbol);
    }

    /** Símbolos libres de la fórmula (sin funciones ni constantes), en orden de aparición. No valida la sintaxis completa. */
    public static List<String> simbolos(String texto) {
        Set<String> r = new LinkedHashSet<>();
        for (String t : tokens(texto)) if (Character.isLetter(t.charAt(0)) && !reservado(t)) r.add(t);
        return new ArrayList<>(r);
    }

    public List<String> variables() { return variables; }

    /** Valor de la fórmula; NaN si no es un real finito (dominio, división por cero, desbordamiento). */
    public double evaluar(double... x) {
        if (x.length != variables.size()) throw error("Se esperaban " + variables.size() + " valores de variables.");
        double v = raiz.ev(x);
        return Double.isFinite(v) ? v : Double.NaN;
    }
    public double evaluar(Map<String, Double> valores) {
        double[] x = new double[variables.size()];
        for (int i = 0; i < x.length; i++) {
            Double v = valores.get(variables.get(i));
            if (v == null) throw error("Falta el valor de " + variables.get(i) + ".");
            x[i] = v;
        }
        return evaluar(x);
    }
    /** Como evaluar, pero un resultado no finito es un error. */
    public double valor(double... x) {
        double v = evaluar(x);
        if (Double.isNaN(v)) throw error("La fórmula no produce un número real finito en " + Arrays.toString(x) + ": compruebe el dominio.");
        return v;
    }

    /**
     * Derivada parcial de orden dado (1..10) respecto de la variable i: diferencias centrales con paso
     * adaptativo eps^(1/(orden+4))·max(1,|x|) y extrapolación de Richardson (pasos h y 2h, error O(h^4)).
     * Si el paso nominal sale del dominio se reduce hasta 3 veces; si no hay forma, NaN.
     */
    public Derivada parcial(int orden, int i, double... x) {
        if (orden < 1 || orden > MAX_ORDEN) throw error("El orden de derivación debe estar entre 1 y " + MAX_ORDEN + ".");
        revisar(i, x);
        double h = Math.pow(EPS, 1.0 / (orden + 4)) * Math.max(1, Math.abs(x[i]));
        for (int intento = 0; intento < 4; intento++, h /= 10) {
            double[] a = esquema(orden, i, x, h), b = esquema(orden, i, x, 2 * h);
            if (Double.isFinite(a[0]) && Double.isFinite(b[0])) return new Derivada((4 * a[0] - b[0]) / 3, (4 * a[1] + b[1]) / 3);
        }
        return new Derivada(Double.NaN, Double.NaN);
    }
    public double[] gradiente(double... x) {
        double[] g = new double[variables.size()];
        for (int i = 0; i < g.length; i++) g[i] = parcial(1, i, x).valor();
        return g;
    }
    public double[][] hessiana(double... x) {
        int n = variables.size();
        double[][] h = new double[n][n];
        for (int i = 0; i < n; i++) {
            Derivada d = parcial(2, i, x);
            h[i][i] = d.nula() ? 0 : d.valor();             // lo indistinguible del ruido es cero (evita Hessianas casi singulares)
            for (int j = i + 1; j < n; j++) { Derivada m = mixta(i, j, x); h[i][j] = h[j][i] = m.nula() ? 0 : m.valor(); }
        }
        return h;
    }

    private void revisar(int i, double[] x) {
        if (i < 0 || i >= variables.size() || x.length != variables.size()) throw error("Variable o punto fuera de rango.");
    }
    /** Diferencia central de orden n con paso h: Σ (-1)^k C(n,k) f(x + (n/2 - k)h) / h^n, y su ruido ε·Σ|términos|/h^n. */
    private double[] esquema(int n, int i, double[] x, double h) {
        double[] p = x.clone();
        double suma = 0, absoluta = 0, c = 1;
        for (int k = 0; k <= n; k++) {
            p[i] = x[i] + (n / 2.0 - k) * h;
            double t = (k % 2 == 0 ? c : -c) * raiz.ev(p);
            suma += t; absoluta += Math.abs(t);
            c = c * (n - k) / (k + 1);
        }
        double hn = Math.pow(h, n);
        return new double[]{suma / hn, EPS * absoluta / hn};
    }
    /** ∂²f/∂xi∂xj con la fórmula de cuatro puntos y Richardson. */
    private Derivada mixta(int i, int j, double[] x) {
        double base = Math.pow(EPS, 1.0 / 6);
        double hi = base * Math.max(1, Math.abs(x[i])), hj = base * Math.max(1, Math.abs(x[j]));
        for (int intento = 0; intento < 4; intento++, hi /= 10, hj /= 10) {
            double[] a = cruzada(i, j, x, hi, hj), b = cruzada(i, j, x, 2 * hi, 2 * hj);
            if (Double.isFinite(a[0]) && Double.isFinite(b[0])) return new Derivada((4 * a[0] - b[0]) / 3, (4 * a[1] + b[1]) / 3);
        }
        return new Derivada(Double.NaN, Double.NaN);
    }
    private double[] cruzada(int i, int j, double[] x, double hi, double hj) {
        double[] p = x.clone();
        p[i] = x[i] + hi; p[j] = x[j] + hj; double mm = raiz.ev(p);
        p[j] = x[j] - hj; double mn = raiz.ev(p);
        p[i] = x[i] - hi; double nn = raiz.ev(p);
        p[j] = x[j] + hj; double nm = raiz.ev(p);
        double d = 4 * hi * hj;
        return new double[]{(mm - mn - nm + nn) / d, EPS * (Math.abs(mm) + Math.abs(mn) + Math.abs(nm) + Math.abs(nn)) / d};
    }

    private static boolean reservado(String s) { return FUNCIONES.containsKey(s) || CONSTANTES.containsKey(s); }
    private static IllegalArgumentException error(String mensaje) { return new IllegalArgumentException(mensaje); }

    private static List<String> tokens(String texto) {
        if (texto == null || texto.isBlank()) throw error("Escriba una fórmula válida.");
        if (texto.length() > MAX_LONGITUD) throw error("La fórmula excede " + MAX_LONGITUD + " caracteres.");
        List<String> r = new ArrayList<>();
        Matcher m = TOKEN.matcher(texto);
        for (int pos = 0; pos < texto.length(); pos = m.end()) {
            if (!m.region(pos, texto.length()).lookingAt()) {
                String resto = texto.substring(pos).strip();
                if (resto.isEmpty()) break;
                throw error("Carácter no permitido en la fórmula: «" + resto.charAt(0) + "».");
            }
            r.add(m.group().strip());
        }
        return r;
    }

    /** Gramática: suma → producto (±producto)*; producto → implícita (* implícita | / unario)*; implícita → unario (potencia)*;
     *  unario → ±unario | potencia; potencia → átomo (^ unario)?. La profundidad se cuenta en unario, que cierra todo ciclo. */
    private static final class Parser {
        final List<String> tk, vars;
        int p, prof;
        Parser(List<String> tk, List<String> vars) { this.tk = tk; this.vars = vars; }

        boolean hay(String s) { return p < tk.size() && tk.get(p).equals(s); }
        boolean empiezaOperando() { return p < tk.size() && (tk.get(p).equals("(") || Character.isLetterOrDigit(tk.get(p).charAt(0)) || tk.get(p).charAt(0) == '.'); }
        boolean empiezaFactor() { return p < tk.size() && (tk.get(p).equals("(") || Character.isLetter(tk.get(p).charAt(0))); }
        void cerrar() { if (!hay(")")) throw error("Falta cerrar un paréntesis."); p++; }

        Nodo suma() {
            Nodo r = producto();
            while (hay("+") || hay("-")) {
                boolean mas = tk.get(p++).equals("+"); Nodo a = r, b = producto();
                r = mas ? x -> a.ev(x) + b.ev(x) : x -> a.ev(x) - b.ev(x);
            }
            return r;
        }
        Nodo producto() {
            Nodo r = implicita();
            while (hay("*") || hay("/")) {
                boolean por = tk.get(p++).equals("*"); Nodo a = r;
                if (por) { Nodo b = implicita(); r = x -> a.ev(x) * b.ev(x); }
                else {
                    Nodo b = unario();
                    if (empiezaOperando()) throw error("Fórmula ambigua tras una división: use paréntesis, por ejemplo x/(2*y).");
                    r = x -> a.ev(x) / b.ev(x);
                }
            }
            return r;
        }
        Nodo implicita() {
            Nodo r = unario();
            while (empiezaFactor()) { Nodo a = r, b = potencia(); r = x -> a.ev(x) * b.ev(x); }
            return r;
        }
        Nodo unario() {
            if (++prof > MAX_PROFUNDIDAD) throw error("La fórmula está demasiado anidada.");
            try {
                if (hay("-")) { p++; Nodo a = unario(); return x -> -a.ev(x); }
                if (hay("+")) { p++; return unario(); }
                return potencia();
            } finally { prof--; }
        }
        Nodo potencia() {
            Nodo base = atomo();
            if (!hay("^")) return base;
            p++; Nodo exponente = unario();
            return x -> Math.pow(base.ev(x), exponente.ev(x));
        }
        Nodo atomo() {
            if (p >= tk.size()) throw error("La fórmula está incompleta.");
            String t = tk.get(p++);
            char c = t.charAt(0);
            if (Character.isDigit(c) || c == '.') {
                double v = Double.parseDouble(t);
                if (!Double.isFinite(v) || Math.abs(v) > MAX_LITERAL) throw error("Un número excede el límite permitido (1e12).");
                return x -> v;
            }
            if (t.equals("(")) { Nodo r = suma(); cerrar(); return r; }
            if (Character.isLetter(c)) {
                DoubleUnaryOperator fn = FUNCIONES.get(t);
                if (fn != null) {
                    if (!hay("(")) throw error("La función " + t + " requiere paréntesis: " + t + "(…).");
                    p++; Nodo a = suma(); cerrar();
                    return x -> fn.applyAsDouble(a.ev(x));
                }
                Double k = CONSTANTES.get(t);
                if (k != null) { double v = k; return x -> v; }
                int i = vars.indexOf(t);
                if (i < 0) throw error("Símbolo desconocido: " + t + ".");
                return x -> x[i];
            }
            throw error("Sintaxis inválida cerca de «" + t + "».");
        }
    }
}
