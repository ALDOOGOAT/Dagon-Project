package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

/**
 * Programación no lineal determinista: sección dorada, Newton 1D, multiplicadores de Lagrange (f(x,y) con g(x,y)=c)
 * y Newton multivariable sin restricciones (hasta 4 variables). Las derivadas son numéricas (ver IoExpresion);
 * los resultados son estacionarios/locales y se advierte de ello. Claves de resultado iguales a las del solver JS.
 */
public final class NoLinealSolver {
    private NoLinealSolver() {}
    private static final double TOL_DORADA = 1e-6, PHI = (Math.sqrt(5) - 1) / 2;
    private static final int MAX_ITER = 100, MAX_ITER_DORADA = 300, MAX_PUNTOS = 8;
    private static final String ESTACIONARIO = "El punto es estacionario; no certifica óptimo global. Revisa dominio, fronteras y curvatura.";

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (datos == null || !datos.isObject()) throw error("Faltan los datos del modelo.");
        return switch (metodo == null ? "" : metodo) {
            case "dorada" -> dorada(datos);
            case "newton" -> newton(datos);
            case "lagrange" -> lagrange(datos);
            case "multivariable" -> multivariable(datos);
            default -> throw error("Método no soportado en programación no lineal: " + metodo + ".");
        };
    }

    // ------------------------------------------------------------------ sección dorada
    private static IoSolucion dorada(JsonNode d) {
        var fn = IoExpresion.compilar(formula(d, "f"), List.of("x"));
        double a = numero(d, "a", "El límite inferior"), b = numero(d, "b", "El límite superior");
        if (a >= b) throw error("El límite inferior debe ser menor que el superior.");
        String objetivo = d.path("objetivo").asText("");
        if (!objetivo.equals("min") && !objetivo.equals("max")) throw error("El objetivo debe ser min o max.");
        double a0 = a, b0 = b, signo = objetivo.equals("min") ? 1 : -1;
        double x1 = b - PHI * (b - a), x2 = a + PHI * (b - a), f1 = fn.valor(x1), f2 = fn.valor(x2);
        List<Object> filas = new ArrayList<>();
        // La tolerancia crece con la magnitud de los extremos para no exigir menos de unos ulps.
        while (b - a > Math.max(TOL_DORADA, 8 * Math.ulp(Math.max(Math.abs(a), Math.abs(b))))) {
            if (filas.size() >= MAX_ITER_DORADA) throw error("La sección dorada no convergió con la tolerancia indicada.");
            filas.add(mapa("a", n(a), "b", n(b), "x1", n(x1), "x2", n(x2), "f1", n(f1), "f2", n(f2)));
            if (signo * f1 <= signo * f2) { b = x2; x2 = x1; f2 = f1; x1 = b - PHI * (b - a); f1 = fn.valor(x1); }
            else { a = x1; x1 = x2; f1 = f2; x2 = a + PHI * (b - a); f2 = fn.valor(x2); }
        }
        if (filas.isEmpty()) filas.add(mapa("a", n(a), "b", n(b), "x1", n(x1), "x2", n(x2), "f1", n(f1), "f2", n(f2)));
        double x = (a + b) / 2, fx = fn.valor(x), ancho = b - a;
        List<String> adv = new ArrayList<>(List.of("Se requiere unimodalidad en el intervalo; revisa los límites a y b."));
        if (!unimodal(fn, a0, b0, signo)) adv.add("La función no parece unimodal en [" + fmt(a0) + ", " + fmt(b0) + "] para ese objetivo: la sección dorada puede converger a un óptimo local o a un límite del intervalo.");
        if (java.util.stream.IntStream.rangeClosed(0, 200).anyMatch(i -> Double.isNaN(fn.evaluar(a0 + (b0 - a0) * i / 200))))
            adv.add("La función no está definida (o no es finita) en algunos puntos del intervalo; el resultado puede no ser fiable.");
        if (x - a0 <= 2 * ancho || b0 - x <= 2 * ancho) adv.add("El óptimo encontrado está en un extremo del intervalo; puede ser solo el mejor valor sobre la frontera.");
        String resumen = "Sección dorada: " + (signo > 0 ? "mínimo" : "máximo") + " aproximado en x ≈ " + fmt(x) + ", f(x) ≈ " + fmt(fx) + ".";
        return sol("dorada", "aproximado", resumen, List.of(metrica("x", x), metrica("f(x)", fx)), pasos(filas),
                mapa("x", n(x), "fx", n(fx), "iteraciones", filas, "objetivo", objetivo), adv);
    }

    /** Muestrea 201 puntos y comprueba que la función solo cambie de monotonía una vez, en el sentido que pide el objetivo. */
    private static boolean unimodal(IoExpresion fn, double a, double b, double signo) {
        int cambios = 0, previo = 0, primero = 0;
        double anterior = Double.NaN;
        for (int i = 0; i <= 200; i++) {
            double y = fn.evaluar(a + (b - a) * i / 200);
            if (Double.isNaN(y)) continue;
            if (!Double.isNaN(anterior)) {
                double dy = y - anterior;
                int s = Math.abs(dy) <= 1e-12 * (1 + Math.abs(y)) ? 0 : dy > 0 ? 1 : -1;
                if (s != 0) { if (previo == 0) primero = s; else if (s != previo) cambios++; previo = s; }
            }
            anterior = y;
        }
        return cambios == 0 || (cambios == 1 && primero == -signo);
    }

    // ------------------------------------------------------------------ Newton 1D
    private static IoSolucion newton(JsonNode d) {
        var fn = IoExpresion.compilar(formula(d, "f"), List.of("x"));
        double x0 = numero(d, "x0", "El punto inicial"), a = Double.NaN, b = Double.NaN;
        if (presente(d, "a") || presente(d, "b")) {
            a = numero(d, "a", "El límite inferior"); b = numero(d, "b", "El límite superior");
            if (a >= b) throw error("Indique un intervalo completo con a < b.");
        }
        double x = x0, previo = Double.NaN;
        List<Object> filas = new ArrayList<>();
        boolean convergio = false;
        for (int k = 0; k < MAX_ITER; k++) {
            double fx = fn.valor(x);
            var d1 = fn.parcial(1, 0, x); var d2 = fn.parcial(2, 0, x);
            if (!Double.isFinite(d1.valor()) || !Double.isFinite(d2.valor())) throw error("No se pudo derivar la fórmula en x = " + fmt(x) + ": revise el dominio.");
            filas.add(mapa("x", n(x), "fx", n(fx), "d1", n(d1.valor()), "d2", n(d2.valor())));
            // Con curvatura indistinguible del ruido se exige que la iteración ya haya frenado, para no aceptar x→-∞ de exp(x).
            double paso = Double.isNaN(previo) ? 0 : Math.abs(x - previo), escala = Math.max(1, Math.abs(x));
            if (Math.abs(d1.valor()) <= Math.max(1e-8, 10 * d1.ruido()) && paso <= (d2.nula() ? 1e-2 : 1e-6) * escala) { convergio = true; break; }
            if (d2.nula()) throw error("Newton no puede continuar: la segunda derivada es nula (función plana o sin punto estacionario).");
            previo = x; x -= d1.valor() / d2.valor();
            if (!Double.isFinite(x) || Math.abs(x) > 1e12) throw error("Newton diverge; pruebe otro punto inicial.");
        }
        if (!convergio) throw error("Newton no convergió; pruebe otro punto inicial.");
        double fx = fn.valor(x);
        String tipo = clasificar(fn, x);
        List<String> adv = new ArrayList<>(List.of(ESTACIONARIO));
        if (!Double.isNaN(a) && (x < a || x > b)) adv.add("El punto estacionario queda fuera del intervalo [" + fmt(a) + ", " + fmt(b) + "]; no es válido en ese dominio.");
        if (tipo.equals("no_concluyente")) adv.add("La clasificación no es concluyente: la función es plana alrededor del punto dentro de la precisión numérica.");
        String resumen = "Newton: " + nombreTipo(tipo) + " en x = " + fmt(x) + ", f(x) = " + fmt(fx) + ".";
        return sol("newton", "estacionario", resumen, List.of(metrica("x", x), metrica("f(x)", fx)), pasos(filas),
                mapa("x", n(x), "fx", n(fx), "iteraciones", filas, "tipo", tipo), adv);
    }

    /** Segunda derivada; si es nula (punto plano) compara f(x±δ) con f(x) para el δ más pequeño que supera el ruido. */
    private static String clasificar(IoExpresion fn, double x) {
        var s = fn.parcial(2, 0, x);
        if (Double.isFinite(s.valor()) && !s.nula()) return s.valor() > 0 ? "minimo" : "maximo";
        double f0 = fn.evaluar(x), escala = Math.max(1, Math.abs(x)), umbral = 1e3 * Math.ulp(1.0) * Math.max(1, Math.abs(f0));
        for (double delta : new double[]{1e-3, 1e-2, 3e-2, 1e-1}) {
            double mas = fn.evaluar(x + delta * escala) - f0, menos = fn.evaluar(x - delta * escala) - f0;
            if (Math.abs(mas) > umbral && Math.abs(menos) > umbral) return (mas > 0) == (menos > 0) ? (mas > 0 ? "minimo" : "maximo") : "inflexion";
        }
        return "no_concluyente";
    }

    // ------------------------------------------------------------------ Lagrange
    private static IoSolucion lagrange(JsonNode d) {
        var vars = List.of("x", "y");
        var f = IoExpresion.compilar(formula(d, "f"), vars);
        var g = IoExpresion.compilar(formula(d, "g"), vars);
        double c = numero(d, "c", "El valor de la restricción"), s = Math.max(1, Math.abs(c));
        double[][] semillas = {{c / 2, c / 2, 0}, {1, 1, 0}, {0, 0, 0}, {1, 0, 0}, {0, 1, 0}, {-1, -1, 0}, {c, 1, 1}, {1, c, 1}, {5, 5, 1},
                {-c / 2, -c / 2, 0}, {1, -1, 0}, {-1, 1, 0}, {2, -2, 0}, {-2, 2, 0}, {s, s, -1}, {-s, -s, -1}, {1, 1, .5}, {-1, -1, -.5},
                {s, 0, 0}, {0, s, 0}, {-s, 0, 0}, {0, -s, 0}, {3, 1, -1}, {1, 3, -1}};
        List<double[]> puntos = new ArrayList<>();
        boolean irregular = false;
        for (double[] semilla : semillas) {
            double[] v = newtonLagrange(f, g, c, semilla);
            if (v == null) continue;
            double[] gg = g.gradiente(v[0], v[1]);
            if (Math.hypot(gg[0], gg[1]) <= 1e-10) { irregular = true; continue; }
            if (puntos.stream().noneMatch(q -> Math.abs(q[0] - v[0]) <= 1e-6 * Math.max(1, Math.abs(v[0])) && Math.abs(q[1] - v[1]) <= 1e-6 * Math.max(1, Math.abs(v[1])))) puntos.add(v);
            if (puntos.size() == MAX_PUNTOS) break;
        }
        if (puntos.isEmpty()) throw error(irregular ? "La restricción no es regular en el punto encontrado." : "El sistema de Lagrange no convergió a un punto estacionario regular. Revise las funciones y la restricción.");
        List<Object> lista = new ArrayList<>();
        for (double[] v : puntos) {
            // Segundo orden sobre el espacio tangente (-gy, gx) de la lagrangiana f - λ(g - c): q>0 mínimo, q<0 máximo.
            double[] gg = g.gradiente(v[0], v[1]);
            double[][] hf = f.hessiana(v[0], v[1]), hg = g.hessiana(v[0], v[1]);
            double lxx = hf[0][0] - v[2] * hg[0][0], lxy = hf[0][1] - v[2] * hg[0][1], lyy = hf[1][1] - v[2] * hg[1][1];
            double q = gg[1] * gg[1] * lxx - 2 * gg[0] * gg[1] * lxy + gg[0] * gg[0] * lyy;
            double escala = (Math.abs(lxx) + 2 * Math.abs(lxy) + Math.abs(lyy)) * (gg[0] * gg[0] + gg[1] * gg[1]);
            String tipo = !(Math.abs(q) > 1e-7 * escala) ? "no_concluyente" : q > 0 ? "minimo" : "maximo";
            lista.add(mapa("x", n(v[0]), "y", n(v[1]), "lambda", n(v[2]), "fxy", n(f.valor(v[0], v[1])), "tipo", tipo));
        }
        var p = comoMapa(lista.get(0));
        List<String> adv = new ArrayList<>(List.of(ESTACIONARIO));
        if (puntos.size() > 1) adv.add("Se encontraron " + puntos.size() + " puntos estacionarios regulares (ver resultado.puntos); se muestra el primero. Compara su f(x, y) para elegir el máximo o el mínimo.");
        Map<String, Object> resultado = new LinkedHashMap<>(p);
        resultado.put("puntos", lista);
        String resumen = "Lagrange: punto estacionario (" + fmt(num(p, "x")) + ", " + fmt(num(p, "y")) + ") con λ = " + fmt(num(p, "lambda")) + ", f = " + fmt(num(p, "fxy")) + " (" + nombreTipo((String) p.get("tipo")) + ").";
        return sol("lagrange", "estacionario", resumen, List.of(metrica("x", num(p, "x")), metrica("y", num(p, "y")), metrica("f(x, y)", num(p, "fxy")), metrica("Multiplicador lambda", num(p, "lambda"))),
                List.of(new IoSolucion.Paso("Resolver ∇f = λ∇g y g(x,y) = c por Newton desde varios puntos iniciales; cada punto es estacionario regular.", null)), resultado, adv);
    }

    /** Newton amortiguado sobre F(x,y,λ) = (fx-λgx, fy-λgy, g-c); null si no converge o sale del dominio. */
    private static double[] newtonLagrange(IoExpresion f, IoExpresion g, double c, double[] semilla) {
        double[] v = semilla.clone();
        for (int k = 0; k < MAX_ITER; k++) {
            double[] F = residuo(f, g, c, v);
            if (F == null) return null;
            double norma = Math.max(Math.abs(F[0]), Math.max(Math.abs(F[1]), Math.abs(F[2])));
            if (norma < 1e-9 * F[3]) return v;
            double[] gg = g.gradiente(v[0], v[1]);
            double[][] hf = f.hessiana(v[0], v[1]), hg = g.hessiana(v[0], v[1]);
            double[][] J = {{hf[0][0] - v[2] * hg[0][0], hf[0][1] - v[2] * hg[0][1], -gg[0]}, {hf[1][0] - v[2] * hg[1][0], hf[1][1] - v[2] * hg[1][1], -gg[1]}, {gg[0], gg[1], 0}};
            double[] delta = finito(J) ? resolverSistema(J, new double[]{-F[0], -F[1], -F[2]}) : null;
            if (delta == null) return null;
            double escala = 1; double[] siguiente = v;
            for (int t = 0; t < 20; t++, escala /= 2) {
                siguiente = new double[]{v[0] + escala * delta[0], v[1] + escala * delta[1], v[2] + escala * delta[2]};
                double[] Fs = residuo(f, g, c, siguiente);
                if (Fs != null && Math.max(Math.abs(Fs[0]), Math.max(Math.abs(Fs[1]), Math.abs(Fs[2]))) < norma) break;
            }
            v = siguiente;
        }
        return null;
    }
    private static double[] residuo(IoExpresion f, IoExpresion g, double c, double[] v) {
        double[] gf = f.gradiente(v[0], v[1]), gg = g.gradiente(v[0], v[1]);
        double[] F = {gf[0] - v[2] * gg[0], gf[1] - v[2] * gg[1], g.evaluar(v[0], v[1]) - c,
                1 + Math.abs(c) + Math.hypot(gf[0], gf[1]) + Math.abs(v[2]) * Math.hypot(gg[0], gg[1])};
        for (double q : F) if (!Double.isFinite(q)) return null;
        return F;
    }

    // ------------------------------------------------------------------ Newton multivariable
    private static IoSolucion multivariable(JsonNode d) {
        JsonNode sj = d.path("simbolos");
        if (!sj.isArray() || sj.size() < 1 || sj.size() > 4) throw error("Indique de 1 a 4 variables.");
        List<String> simbolos = new ArrayList<>();
        for (JsonNode s : sj) {
            if (!s.isTextual() || !s.asText().matches("[A-Za-z][A-Za-z0-9_]{0,9}")) throw error("Símbolo de variable no permitido.");
            simbolos.add(s.asText());
        }
        JsonNode ij = d.path("inicio");
        if (!ij.isArray() || ij.size() != simbolos.size()) throw error("El punto inicial debe tener un valor por variable.");
        double[] x = new double[simbolos.size()];
        for (int i = 0; i < x.length; i++) x[i] = numero(ij, i, "El punto inicial");
        String objetivo = presente(d, "objetivo") ? d.get("objetivo").asText("") : null;
        if (objetivo != null && !objetivo.equals("min") && !objetivo.equals("max")) throw error("El objetivo debe ser min o max.");
        var fn = IoExpresion.compilar(formula(d, "f"), simbolos);

        List<Object> filas = new ArrayList<>();
        boolean convergio = false;
        for (int k = 0; k < MAX_ITER && !convergio; k++) {
            double fx = fn.valor(x);
            double[] g = fn.gradiente(x);
            if (!finito(g)) throw error("No se pudo derivar la fórmula en el punto actual: revise el dominio.");
            double ng = norma(g);
            filas.add(fila(k, simbolos, x, fx, ng));
            if (ng <= 1e-8 * Math.max(1, Math.abs(fx))) { convergio = true; break; }
            double[][] H = fn.hessiana(x);
            double[] paso = finito(H) ? resolverSistema(H, Arrays.stream(g).map(v -> -v).toArray()) : null;
            if (paso == null) throw error("El Hessiano es singular en una iteración; pruebe otro punto inicial.");
            // Se amortigua el paso hasta que reduzca la norma del gradiente.
            double escala = 1; double[] siguiente = x;
            for (int t = 0; t < 30; t++, escala /= 2) {
                siguiente = new double[x.length];
                for (int i = 0; i < x.length; i++) siguiente[i] = x[i] + escala * paso[i];
                double[] gs = fn.gradiente(siguiente);
                if (finito(gs) && norma(gs) < ng) break;
            }
            x = siguiente;
        }
        if (!convergio) throw error("Newton no convergió; pruebe otro punto inicial.");
        double[][] H = fn.hessiana(x);
        if (!finito(H)) throw error("No se pudo calcular el Hessiano en el punto encontrado.");
        double[] lambdas = autovalores(H);
        double tol = 1e-7 * Math.max(1, Math.max(Math.abs(lambdas[0]), Math.abs(lambdas[lambdas.length - 1])));
        boolean todosPos = Arrays.stream(lambdas).allMatch(l -> l > tol), todosNeg = Arrays.stream(lambdas).allMatch(l -> l < -tol);
        boolean algunPos = Arrays.stream(lambdas).anyMatch(l -> l > tol), algunNeg = Arrays.stream(lambdas).anyMatch(l -> l < -tol);
        String tipo = todosPos ? "minimo" : todosNeg ? "maximo" : algunPos && algunNeg ? "silla" : "no_concluyente";
        double fx = fn.valor(x);
        Map<String, Object> punto = new LinkedHashMap<>();
        List<IoSolucion.Metrica> metricas = new ArrayList<>();
        for (int i = 0; i < x.length; i++) { punto.put(simbolos.get(i), n(x[i])); metricas.add(metrica(simbolos.get(i), x[i])); }
        metricas.add(metrica("f en el punto", fx));
        String nombre = tipo.equals("silla") ? "punto silla" : nombreTipo(tipo);
        List<IoSolucion.Paso> pasos = List.of(new IoSolucion.Paso("Iteraciones de Newton: x ← x − H⁻¹∇f (con paso amortiguado).", filas),
                new IoSolucion.Paso("Hessiano en el punto; autovalores " + Arrays.stream(lambdas).mapToObj(NoLinealSolver::fmt).toList() + " → " + nombre + ".", matriz(H)));
        List<String> adv = new ArrayList<>();
        if ("max".equals(objetivo) && !tipo.equals("maximo")) adv.add("Se pidió un máximo, pero el punto estacionario encontrado no es un máximo local.");
        if ("min".equals(objetivo) && !tipo.equals("minimo")) adv.add("Se pidió un mínimo, pero el punto estacionario encontrado no es un mínimo local.");
        adv.add("Newton encuentra un punto estacionario cercano al inicio; la clasificación es local, no certifica el óptimo global.");
        Map<String, Object> resultado = mapa("punto", punto, "fx", n(fx), "iteraciones", filas, "hessiano", matriz(H), "autovalores", lista(lambdas), "tipo", tipo);
        return sol("multivariable", "estacionario", "Newton multivariable: " + nombre + " con f = " + fmt(fx) + ".", metricas, pasos, resultado, adv);
    }
    private static Map<String, Object> fila(int k, List<String> simbolos, double[] x, double fx, double ng) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("k", k);
        for (int i = 0; i < x.length; i++) m.put(simbolos.get(i), n(x[i]));
        m.put("f", n(fx)); m.put("normaGradiente", n(ng));
        return m;
    }

    // ------------------------------------------------------------------ álgebra lineal y utilidades compartidas (también las usa CuadraticaSolver)
    /** Eliminación de Gauss-Jordan con pivoteo parcial; null si el sistema es singular. */
    static double[] resolverSistema(double[][] A, double[] b) {
        int n = b.length;
        double[][] T = new double[n][n + 1];
        double maxAbs = 0;
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, T[i], 0, n); T[i][n] = b[i];
            for (int j = 0; j < n; j++) maxAbs = Math.max(maxAbs, Math.abs(A[i][j]));
        }
        double umbral = Math.max(1e-12, 1e-11 * maxAbs);
        for (int j = 0; j < n; j++) {
            int p = j;
            for (int i = j + 1; i < n; i++) if (Math.abs(T[i][j]) > Math.abs(T[p][j])) p = i;
            if (!(Math.abs(T[p][j]) > umbral)) return null;
            double[] t = T[p]; T[p] = T[j]; T[j] = t;
            for (int i = 0; i < n; i++) {
                if (i == j) continue;
                double m = T[i][j] / T[j][j];
                if (m != 0) for (int k = j; k <= n; k++) T[i][k] -= m * T[j][k];
            }
        }
        double[] x = new double[n];
        for (int i = 0; i < n; i++) x[i] = T[i][n] / T[i][i];
        return x;
    }
    /** Autovalores (ascendentes) de una matriz simétrica pequeña por Jacobi cíclico. */
    static double[] autovalores(double[][] M) {
        int n = M.length;
        double[][] A = new double[n][];
        for (int i = 0; i < n; i++) A[i] = M[i].clone();
        for (int barrido = 0; barrido < 100; barrido++) {
            double fuera = 0, total = 0;
            for (int p = 0; p < n; p++) for (int q = 0; q < n; q++) { total += A[p][q] * A[p][q]; if (q > p) fuera += A[p][q] * A[p][q]; }
            if (fuera <= 1e-26 * total) break;
            for (int p = 0; p < n; p++) for (int q = p + 1; q < n; q++) {
                if (Math.abs(A[p][q]) < 1e-300) continue;
                double theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
                double t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
                for (int k = 0; k < n; k++) { double akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
                for (int k = 0; k < n; k++) { double apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
            }
        }
        double[] l = new double[n];
        for (int i = 0; i < n; i++) l[i] = A[i][i];
        Arrays.sort(l);
        return l;
    }
    private static double norma(double[] v) { double s = 0; for (double x : v) s += x * x; return Math.sqrt(s); }
    private static boolean finito(double... v) { for (double x : v) if (!Double.isFinite(x)) return false; return true; }
    private static boolean finito(double[][] m) { for (double[] f : m) if (!finito(f)) return false; return true; }

    /** Valor apto para JSON: null si no es finito, 0.0 si |x| < 1e-9 y 10 cifras significativas (oculta el ruido de las derivadas numéricas). */
    static Double n(double x) {
        if (!Double.isFinite(x)) return null;
        return Math.abs(x) < 1e-9 ? 0.0 : new BigDecimal(x).round(new MathContext(10)).doubleValue();
    }
    static List<Object> lista(double[] v) { List<Object> r = new ArrayList<>(); for (double x : v) r.add(n(x)); return r; }
    static List<Object> matriz(double[][] m) { List<Object> r = new ArrayList<>(); for (double[] f : m) r.add(lista(f)); return r; }
    static Map<String, Object> mapa(Object... clavesYValores) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < clavesYValores.length; i += 2) m.put((String) clavesYValores[i], clavesYValores[i + 1]);
        return m;
    }
    @SuppressWarnings("unchecked") private static Map<String, Object> comoMapa(Object o) { return (Map<String, Object>) o; }
    private static double num(Map<String, Object> m, String clave) { Object v = m.get(clave); return v == null ? Double.NaN : ((Number) v).doubleValue(); }
    static String fmt(double x) {
        Double v = n(x);
        return v == null ? "—" : new BigDecimal(v).round(new MathContext(6)).stripTrailingZeros().toPlainString();
    }
    static IoSolucion.Metrica metrica(String etiqueta, double valor) { return new IoSolucion.Metrica(etiqueta, n(valor), null); }
    private static List<IoSolucion.Paso> pasos(List<Object> filas) {
        List<IoSolucion.Paso> r = new ArrayList<>();
        for (int i = 0; i < filas.size(); i++) r.add(new IoSolucion.Paso("Iteración " + (i + 1), filas.get(i)));
        return r;
    }
    private static String nombreTipo(String tipo) {
        return switch (tipo) { case "minimo" -> "mínimo local"; case "maximo" -> "máximo local"; case "inflexion" -> "punto de inflexión"; default -> "clasificación no concluyente"; };
    }
    private static IoSolucion sol(String metodo, String estado, String resumen, List<IoSolucion.Metrica> metricas, List<IoSolucion.Paso> pasos, Map<String, Object> resultado, List<String> adv) {
        return new IoSolucion("noLineal", metodo, estado, resumen, metricas, pasos, resultado, adv);
    }
    static IllegalArgumentException error(String mensaje) { return new IllegalArgumentException(mensaje); }

    private static boolean presente(JsonNode d, String clave) { return d.has(clave) && !d.get(clave).isNull(); }
    private static String formula(JsonNode d, String clave) {
        JsonNode v = d.get(clave);
        if (v == null || !v.isTextual() || v.asText().isBlank()) throw error("Falta la fórmula «" + clave + "».");
        return v.asText();
    }
    private static double numero(JsonNode d, String clave, String nombre) { return numero(d.get(clave), nombre); }
    private static double numero(JsonNode d, int i, String nombre) { return numero(d.get(i), nombre); }
    private static double numero(JsonNode v, String nombre) {
        if (v == null || !v.isNumber() || !Double.isFinite(v.asDouble()) || Math.abs(v.asDouble()) > 1e12) throw error(nombre + " debe ser un número finito (|x| ≤ 1e12).");
        return v.asDouble();
    }
}
