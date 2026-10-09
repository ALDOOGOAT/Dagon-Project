package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigInteger;
import java.util.*;
import java.util.regex.*;
import static com.dagon.backend.service.io.solver.NoLinealSolver.*;

/**
 * Programación cuadrática (objetivo de grado ≤ 2, restricciones lineales, hasta 6 variables no negativas) por condiciones KKT.
 * Se enumeran los subconjuntos de desigualdades activas y se resuelve el sistema lineal KKT de cada uno; se conservan los puntos
 * factibles con multiplicadores μ ≥ 0. Con objetivo convexo cualquier punto KKT es óptimo global; con región acotada el óptimo global
 * está entre todos los puntos KKT enumerados; en otro caso se devuelve el mejor punto KKT como "estacionario".
 */
public final class CuadraticaSolver {
    private CuadraticaSolver() {}
    private static final int MAX_VARIABLES = 6, MAX_DESIGUALDADES = 16, MAX_RESTRICCIONES = 30, MAX_CANDIDATOS = 100;
    private static final Pattern CABECERA = Pattern.compile("(?is)^\\s*(max|min)\\s+(?:z\\s*=\\s*)?(.+)$");
    private static final Pattern NO_NEGATIVA = Pattern.compile("[A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*\\s*>=\\s*0");
    private static final Pattern ENTERA = Pattern.compile("(?i)^\\s*[A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*\\s+(?:son\\s+)?(?:enter[oa]s?|int|integer|binari[oa]s?|bin|∈\\s*\\{\\s*0\\s*,\\s*1\\s*\\})\\s*$");
    private static final Pattern RELACION = Pattern.compile("(?s)^(.+?)\\s*(<=|>=|=)\\s*(.+)$");
    private static final Pattern TROZO = Pattern.compile("\\d+|\\D+");

    private record Fila(double[] a, double b, String etiqueta) {}
    private record Candidato(List<String> activas, double[] x, Map<String, Object> multiplicadores, double z) {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!"kkt".equals(metodo)) throw error("Método no soportado en programación cuadrática: " + metodo + ".");
        if (datos == null || !datos.isObject()) throw error("Faltan los datos del modelo.");
        JsonNode objetivoNodo = datos.get("objetivo"), restriccionesNodo = datos.get("restricciones");
        if (objetivoNodo == null || !objetivoNodo.isTextual() || objetivoNodo.asText().length() > 500) throw error("El objetivo debe ser un texto de hasta 500 caracteres.");
        Matcher cabecera = CABECERA.matcher(objetivoNodo.asText().trim());
        if (!cabecera.matches()) throw error("El objetivo debe comenzar con max o min, por ejemplo max z = 10x1 - x1^2.");
        boolean max = cabecera.group(1).equalsIgnoreCase("max");
        String expresion = cabecera.group(2);
        if (restriccionesNodo == null || !restriccionesNodo.isArray() || restriccionesNodo.size() > MAX_RESTRICCIONES) throw error("Las restricciones deben ser una lista de hasta " + MAX_RESTRICCIONES + " textos.");

        // 1) Lectura: las no negatividades solo declaran nombres (todas las variables son ≥ 0, como en PL); las enteras no se admiten.
        Set<String> nombres = new HashSet<>(IoExpresion.simbolos(expresion));
        if (nombres.isEmpty()) throw error("El objetivo debe contener variables.");
        List<String[]> relaciones = new ArrayList<>();
        for (JsonNode nodo : restriccionesNodo) {
            if (!nodo.isTextual() || nodo.asText().length() > 500) throw error("Cada restricción debe ser un texto de hasta 500 caracteres.");
            String t = nodo.asText().replace("≤", "<=").replace("≥", ">=").trim();
            if (NO_NEGATIVA.matcher(t).matches()) { for (String v : t.split(">=")[0].split(",")) nombres.add(v.trim()); continue; }
            if (ENTERA.matcher(t).matches()) throw error("La programación cuadrática no admite variables enteras o binarias.");
            Matcher m = RELACION.matcher(t);
            if (!m.matches()) throw error("Restricción inválida: " + t + ".");
            relaciones.add(new String[]{m.group(1), m.group(2), m.group(3)});
            nombres.addAll(IoExpresion.simbolos(m.group(1))); nombres.addAll(IoExpresion.simbolos(m.group(3)));
            if (nombres.size() > MAX_VARIABLES) break;
        }
        if (nombres.size() > MAX_VARIABLES) throw error("La programación cuadrática admite hasta " + MAX_VARIABLES + " variables.");
        List<String> vars = new ArrayList<>(nombres);
        vars.sort(CuadraticaSolver::natural);
        for (String v : vars) for (String a : vars)
            if (!a.equals(v) && v.startsWith(a) && vars.contains(v.substring(a.length())))
                throw error("«" + v + "» parece un producto de variables: escríbalo con * (por ejemplo " + a + "*" + v.substring(a.length()) + ").");
        int nv = vars.size();

        // 2) Objetivo: f(x) = k + c·x + ½ xᵀQx. Q y c salen de diferencias exactas en un polinomio de grado 2; se verifica en 4 puntos.
        var fo = IoExpresion.compilar(expresion, vars);
        double k = fo.valor(new double[nv]);
        double[] c = new double[nv], fMas = new double[nv];
        double[][] Q = new double[nv][nv];
        for (int i = 0; i < nv; i++) {
            fMas[i] = fo.valor(unitario(nv, i, 1, -1, 0)); double menos = fo.valor(unitario(nv, i, -1, -1, 0));
            c[i] = (fMas[i] - menos) / 2; Q[i][i] = fMas[i] + menos - 2 * k;
        }
        for (int i = 0; i < nv; i++) for (int j = i + 1; j < nv; j++) Q[i][j] = Q[j][i] = fo.valor(unitario(nv, i, 1, j, 1)) - fMas[i] - fMas[j] + k;
        if (!acotado(k, c, Q)) throw error("Los coeficientes del objetivo exceden el límite numérico.");
        for (int p = 1; p <= 4; p++) {
            double[] s = new double[nv];
            for (int i = 0; i < nv; i++) s[i] = Math.sin((i + 2) * (p + 1)) * 4;
            double real = fo.valor(s), previsto = valor(k, c, Q, s);
            if (!(Math.abs(real - previsto) <= 1e-7 * Math.max(1, Math.abs(real)))) throw error("El objetivo debe ser un polinomio de grado 2 como máximo.");
        }

        // 3) Restricciones lineales: a·x (<=|>=|=) b, con etiquetas R1..Rm; las ≥ se invierten y la no negatividad se agrega como desigualdad.
        List<Fila> iguales = new ArrayList<>(), desiguales = new ArrayList<>();
        for (int i = 0; i < relaciones.size(); i++) {
            String[] rel = relaciones.get(i);
            double[] izq = lineal(IoExpresion.compilar(rel[0], vars), nv, rel[0]), der = lineal(IoExpresion.compilar(rel[2], vars), nv, rel[2]);
            double[] a = new double[nv];
            for (int j = 0; j < nv; j++) a[j] = izq[j] - der[j];
            double b = der[nv] - izq[nv];
            String etiqueta = "R" + (i + 1);
            switch (rel[1]) {
                case "=" -> iguales.add(new Fila(a, b, etiqueta));
                case "<=" -> desiguales.add(new Fila(a, b, etiqueta));
                default -> desiguales.add(new Fila(Arrays.stream(a).map(v -> -v).toArray(), -b, etiqueta));
            }
        }
        for (int j = 0; j < nv; j++) desiguales.add(new Fila(unitario(nv, j, -1, -1, 0), 0, vars.get(j) + " ≥ 0"));
        if (desiguales.size() > MAX_DESIGUALDADES) throw error("Se admiten hasta " + MAX_DESIGUALDADES + " desigualdades contando la no negatividad de las variables.");
        List<Fila> independientes = independientes(iguales, nv);       // null: igualdades incompatibles
        boolean incompatibles = independientes == null;
        if (!incompatibles) iguales = independientes;

        // 4) Enumeración KKT. Se minimiza F = signo·f.
        double signo = max ? -1 : 1;
        var qp = new Qp(nv, k, c, Q, signo, iguales, desiguales);
        if (!incompatibles) qp.elegir(0, new ArrayList<>());
        double[] autovalores = autovalores(qp.QF);
        boolean convexa = autovalores[0] >= -1e-9 * Math.max(1, Math.max(Math.abs(autovalores[0]), Math.abs(autovalores[nv - 1])));
        List<Candidato> candidatos = qp.candidatos;
        boolean factible = !incompatibles && (!candidatos.isEmpty() || qp.hayVertice(iguales, desiguales));
        // Región acotada si no tiene direcciones de recesión: no existe d ≥ 0, d ≠ 0 con A_igual d = 0 y A_desig d ≤ 0 (se normaliza Σd = 1).
        boolean acotada = !factible || !qp.hayVertice(conBSuma(iguales, nv), homogeneas(desiguales));
        Candidato mejor = null;
        for (Candidato cand : candidatos) if (mejor == null || signo * cand.z() < signo * mejor.z() - 1e-9) mejor = cand;
        String estado = mejor == null ? (factible ? "no_acotado" : "infactible") : (convexa || acotada) ? "optimo" : "estacionario";

        // 5) Salida.
        List<Candidato> orden = new ArrayList<>();
        if (mejor != null) orden.add(mejor);
        for (Candidato cand : candidatos) if (cand != mejor) orden.add(cand);
        boolean truncado = orden.size() > MAX_CANDIDATOS;
        if (truncado) orden = orden.subList(0, MAX_CANDIDATOS);
        List<Object> listaCandidatos = new ArrayList<>(), tabla = new ArrayList<>();
        for (int i = 0; i < orden.size(); i++) {
            Candidato cand = orden.get(i);
            listaCandidatos.add(mapa("activas", cand.activas(), "x", lista(cand.x()), "multiplicadores", cand.multiplicadores(), "z", n(cand.z()), "optimo", cand == mejor));
            tabla.add(mapa("candidato", i + 1, "activas", cand.activas().isEmpty() ? "ninguna (interior)" : String.join(", ", cand.activas()),
                    "punto", puntoTexto(cand.x()), "Z", n(cand.z()), "multiplicadores", multiplicadoresTexto(cand.multiplicadores()), "optimo", cand == mejor ? "Sí" : ""));
        }
        Map<String, Object> x = new LinkedHashMap<>();
        for (int i = 0; i < nv; i++) x.put(vars.get(i), n(mejor == null ? 0 : mejor.x()[i]));
        Map<String, Object> resultado = mapa("variables", vars, "convexa", convexa, "acotada", acotada, "autovalores", lista(autovalores), "hessiano", matriz(Q),
                "candidatos", listaCandidatos, "estado", estado, "z", mejor == null ? null : n(mejor.z()), "x", x);
        if (mejor != null) { resultado.put("multiplicadores", mejor.multiplicadores()); resultado.put("activas", mejor.activas()); }

        List<IoSolucion.Metrica> metricas = new ArrayList<>();
        if (mejor != null) {
            for (int i = 0; i < nv; i++) metricas.add(metrica(vars.get(i), mejor.x()[i]));
            metricas.add(metrica("Valor objetivo Z", mejor.z()));
        }
        String lambdas = Arrays.stream(autovalores).mapToObj(NoLinealSolver::fmt).toList().toString();
        List<IoSolucion.Paso> pasos = List.of(
                new IoSolucion.Paso("Hessiano del objetivo (matriz de segundas derivadas, constante en una cuadrática).", matriz(Q)),
                new IoSolucion.Paso(convexa ? "Autovalores " + lambdas + ": el problema es convexo para " + (max ? "maximizar (cóncavo)" : "minimizar") + "; un punto KKT es óptimo global."
                        : "Autovalores " + lambdas + ": el problema no es convexo; se comparan todos los puntos KKT.", null),
                new IoSolucion.Paso("Condiciones KKT por conjunto activo: ∇f = Σ μᵢ ∇gᵢ con μᵢ ≥ 0 en las desigualdades activas.", tabla));
        List<String> advertencias = new ArrayList<>(List.of("Variables continuas y no negativas (x ≥ 0)."));
        if (estado.equals("estacionario")) advertencias.add("La región no está acotada y el objetivo no es convexo: se muestra el mejor punto KKT, que puede no ser el óptimo global.");
        if (estado.equals("no_acotado")) advertencias.add("No hay punto KKT: el objetivo mejora sin límite dentro de la región factible.");
        if (incompatibles) advertencias.add("Las igualdades son incompatibles entre sí.");
        if (truncado) advertencias.add("Se muestran los " + MAX_CANDIDATOS + " primeros puntos KKT de " + candidatos.size() + "; el óptimo va primero.");
        String resumen = switch (estado) {
            case "infactible" -> "Las restricciones no admiten una solución factible.";
            case "no_acotado" -> "El objetivo no está acotado con estas restricciones.";
            default -> (estado.equals("optimo") ? "Óptimo global (" + (convexa ? "problema convexo" : "región acotada") + ")" : "Mejor punto KKT")
                    + ": Z = " + fmt(mejor.z()) + " en " + puntoTexto(vars, mejor.x()) + ".";
        };
        return new IoSolucion("cuadratica", "kkt", estado, resumen, metricas, pasos, resultado, advertencias);
    }

    /** Estado del enumerador: sistema KKT de cada conjunto activo y búsqueda de vértices. */
    private static final class Qp {
        final int n; final double k, signo, escala; final double[] c, cF; final double[][] Q, QF;
        final List<Fila> iguales, desiguales; final int maxActivas;
        final List<Candidato> candidatos = new ArrayList<>();
        Qp(int n, double k, double[] c, double[][] Q, double signo, List<Fila> iguales, List<Fila> desiguales) {
            this.n = n; this.k = k; this.c = c; this.Q = Q; this.signo = signo; this.iguales = iguales; this.desiguales = desiguales;
            maxActivas = n - iguales.size();
            QF = new double[n][n]; cF = new double[n];
            double m = 1;
            for (int i = 0; i < n; i++) { cF[i] = signo * c[i]; m = Math.max(m, Math.abs(cF[i])); for (int j = 0; j < n; j++) { QF[i][j] = signo * Q[i][j]; m = Math.max(m, Math.abs(QF[i][j])); } }
            escala = m;
        }
        void elegir(int inicio, List<Integer> actual) {
            probar(actual);
            if (actual.size() == maxActivas) return;
            for (int i = inicio; i < desiguales.size(); i++) { actual.add(i); elegir(i + 1, actual); actual.remove(actual.size() - 1); }
        }
        /** QF·x + Σ μ·a = -cF, a·x = b en las filas activas; se acepta si x es factible y μ ≥ 0 en las desigualdades. */
        void probar(List<Integer> activas) {
            List<Fila> filas = new ArrayList<>(iguales);
            for (int i : activas) filas.add(desiguales.get(i));
            int N = n + filas.size();
            double[][] M = new double[N][N]; double[] rhs = new double[N];
            for (int i = 0; i < n; i++) { System.arraycopy(QF[i], 0, M[i], 0, n); rhs[i] = -cF[i]; }
            for (int r = 0; r < filas.size(); r++) {
                for (int i = 0; i < n; i++) M[i][n + r] = M[n + r][i] = filas.get(r).a()[i];
                rhs[n + r] = filas.get(r).b();
            }
            double[] sol = resolverSistema(M, rhs);
            if (sol == null) return;
            double[] x = Arrays.copyOf(sol, n);
            if (!cumple(x, iguales, desiguales)) return;
            for (int r = iguales.size(); r < filas.size(); r++) if (sol[n + r] < -1e-9 * escala) return;
            for (Candidato previo : candidatos) {
                boolean igual = true;
                for (int i = 0; i < n && igual; i++) igual = Math.abs(previo.x()[i] - x[i]) <= 1e-7 * Math.max(1, Math.abs(x[i]));
                if (igual) return;
            }
            Map<String, Object> mu = new LinkedHashMap<>();
            List<String> etiquetas = new ArrayList<>();
            for (int r = 0; r < filas.size(); r++) {
                mu.put(filas.get(r).etiqueta(), n(sol[n + r]));
                if (r >= iguales.size()) etiquetas.add(filas.get(r).etiqueta());
            }
            candidatos.add(new Candidato(etiquetas, x, mu, valor(k, c, Q, x)));
        }
        boolean cumple(double[] x, List<Fila> eq, List<Fila> des) {
            for (Fila f : des) if (dot(f.a(), x) > f.b() + 1e-7 * Math.max(1, Math.abs(f.b()))) return false;
            for (Fila f : eq) if (Math.abs(dot(f.a(), x) - f.b()) > 1e-7 * Math.max(1, Math.abs(f.b()))) return false;
            return true;
        }
        /** ¿Tiene {a·x = b (eq), a·x ≤ b (des)} algún vértice? Con x ≥ 0 incluida, hay vértice si y solo si el poliedro es no vacío. */
        boolean hayVertice(List<Fila> eq, List<Fila> des) {
            int libres = n - eq.size();
            return libres >= 0 && subconjunto(eq, des, 0, new ArrayList<>(), libres);
        }
        private boolean subconjunto(List<Fila> eq, List<Fila> des, int inicio, List<Fila> elegidas, int libres) {
            if (elegidas.size() == libres) {
                double[][] A = new double[n][]; double[] b = new double[n]; int r = 0;
                for (Fila f : eq) { A[r] = f.a(); b[r++] = f.b(); }
                for (Fila f : elegidas) { A[r] = f.a(); b[r++] = f.b(); }
                double[] x = resolverSistema(A, b);
                return x != null && cumple(x, eq, des);
            }
            for (int i = inicio; i < des.size(); i++) {
                elegidas.add(des.get(i));
                if (subconjunto(eq, des, i + 1, elegidas, libres)) return true;
                elegidas.remove(elegidas.size() - 1);
            }
            return false;
        }
    }

    /** Igualdades linealmente independientes (descarta las redundantes); null si alguna es incompatible con las anteriores. */
    private static List<Fila> independientes(List<Fila> igualdades, int nv) {
        List<double[]> base = new ArrayList<>(); List<Integer> pivotes = new ArrayList<>(); List<Fila> libres = new ArrayList<>();
        for (Fila f : igualdades) {
            double[] v = Arrays.copyOf(f.a(), nv + 1); v[nv] = f.b();
            double tam = Math.max(1, Arrays.stream(v).map(Math::abs).max().orElse(0));
            for (int j = 0; j < base.size(); j++) { double m = v[pivotes.get(j)]; if (m != 0) for (int t = 0; t <= nv; t++) v[t] -= m * base.get(j)[t]; }
            int p = -1;
            for (int t = 0; t < nv; t++) if (Math.abs(v[t]) > 1e-9 * tam && (p < 0 || Math.abs(v[t]) > Math.abs(v[p]))) p = t;
            if (p < 0) { if (Math.abs(v[nv]) > 1e-9 * tam) return null; continue; }
            double d = v[p];
            for (int t = 0; t <= nv; t++) v[t] /= d;
            base.add(v); pivotes.add(p); libres.add(f);
        }
        return libres;
    }
    private static List<Fila> conBSuma(List<Fila> iguales, int nv) {
        List<Fila> r = new ArrayList<>(homogeneas(iguales));
        double[] unos = new double[nv]; Arrays.fill(unos, 1);
        r.add(new Fila(unos, 1, "Σd = 1"));
        return r;
    }
    private static List<Fila> homogeneas(List<Fila> filas) { return filas.stream().map(f -> new Fila(f.a(), 0, f.etiqueta())).toList(); }

    /** Coeficientes [c1..cn, k] de una expresión que debe ser lineal (se comprueba en los ejes duplicados y en tres puntos). */
    private static double[] lineal(IoExpresion f, int nv, String texto) {
        double k = f.valor(new double[nv]);
        double[] r = new double[nv + 1]; r[nv] = k;
        for (int i = 0; i < nv; i++) r[i] = f.valor(unitario(nv, i, 1, -1, 0)) - k;
        List<double[]> pruebas = new ArrayList<>();
        for (int i = 0; i < nv; i++) pruebas.add(unitario(nv, i, 2, -1, 0));
        for (int p = 1; p <= 3; p++) { double[] s = new double[nv]; for (int i = 0; i < nv; i++) s[i] = Math.sin((i + 1) * (p + 2)) * 3; pruebas.add(s); }
        for (double[] s : pruebas) {
            double real = f.valor(s), previsto = k + dot(Arrays.copyOf(r, nv), s);
            if (!(Math.abs(real - previsto) <= 1e-8 * Math.max(1, Math.max(Math.abs(real), Math.abs(previsto))))) throw error("La restricción «" + texto.strip() + "» no es lineal.");
        }
        for (double v : r) if (!(Math.abs(v) <= 1e12)) throw error("Un coeficiente de la restricción excede el límite numérico.");
        return r;
    }

    private static double[] unitario(int n, int i, double vi, int j, double vj) {
        double[] e = new double[n]; e[i] = vi; if (j >= 0) e[j] = vj;
        return e;
    }
    private static double valor(double k, double[] c, double[][] Q, double[] x) {
        double v = k + dot(c, x);
        for (int i = 0; i < x.length; i++) v += 0.5 * x[i] * dot(Q[i], x);
        return v;
    }
    private static boolean acotado(double k, double[] c, double[][] Q) {
        boolean ok = Math.abs(k) <= 1e12;
        for (double v : c) ok &= Math.abs(v) <= 1e12;
        for (double[] fila : Q) for (double v : fila) ok &= Math.abs(v) <= 1e12;
        return ok;
    }
    private static double dot(double[] a, double[] b) { double s = 0; for (int i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
    private static String puntoTexto(double[] x) { return String.join(", ", Arrays.stream(x).mapToObj(NoLinealSolver::fmt).toList()); }
    private static String puntoTexto(List<String> vars, double[] x) {
        List<String> r = new ArrayList<>();
        for (int i = 0; i < x.length; i++) r.add(vars.get(i) + " = " + fmt(x[i]));
        return String.join(", ", r);
    }
    private static String multiplicadoresTexto(Map<String, Object> mu) {
        if (mu.isEmpty()) return "—";
        List<String> r = new ArrayList<>();
        mu.forEach((e, v) -> r.add(e + ": " + (v == null ? "—" : fmt(((Number) v).doubleValue()))));
        return String.join("; ", r);
    }
    /** Orden natural: x2 antes que x10, sin distinguir mayúsculas. */
    private static int natural(String a, String b) {
        Matcher ma = TROZO.matcher(a), mb = TROZO.matcher(b);
        while (ma.find() && mb.find()) {
            String p = ma.group(), q = mb.group();
            int cmp = Character.isDigit(p.charAt(0)) && Character.isDigit(q.charAt(0)) ? new BigInteger(p).compareTo(new BigInteger(q)) : p.compareToIgnoreCase(q);
            if (cmp != 0) return cmp;
        }
        return a.compareTo(b);
    }
}
