package com.dagon.backend.service.io.solver;

import static com.dagon.backend.service.io.solver.ModeloPL.finito;
import static com.dagon.backend.service.io.solver.ModeloPL.limpio;
import static com.dagon.backend.service.io.solver.ModeloPL.num;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import java.util.stream.IntStream;

/**
 * Simplex de dos fases con regla de Bland (anticiclado). Maximiza internamente signo·c; las variables son >= 0.
 * Los duales y la sensibilidad se leen de la tabla final: las columnas identidad (holgura o artificial) guardan B^-1.
 */
public final class SimplexSolver {
    private SimplexSolver() {}
    static final double EPS = 1e-9;
    static final int MAX_ITERACIONES = 500, MAX_TABLAS = 40, MAX_BASES_MULTIPLES = 300;

    /** Resultado numérico interno; EnteroSolver y JuegosSolver lo reutilizan. z es NaN y los arreglos opcionales son null si no hay óptimo. */
    record Resultado(String estado, double[] x, double z, double[] holguras, double[] duales, double[][] sensB, double[][] sensC,
                     boolean multiple, boolean degenerado, boolean redundante, int pivotesDegenerados, int iteraciones,
                     List<Map<String, Object>> tablas, boolean tablasTruncadas) {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!"simplex".equals(metodo) && !"branch_bound".equals(metodo)) throw new IllegalArgumentException("Método de PL no soportado: " + metodo + ".");
        ModeloPL modelo = ModeloPL.parsear(datos);
        // Igual que el frontend: con variables enteras o binarias el modelo se resuelve por ramificación y acotamiento.
        if ("branch_bound".equals(metodo) || !modelo.enteras().isEmpty() || !modelo.binarias().isEmpty()) return EnteroSolver.resolver(modelo);
        return aSolucion(modelo, resolver(modelo, true));
    }

    /** detalle=false omite tablas, duales y sensibilidad (nodos de branch and bound, juegos). */
    static Resultado resolver(ModeloPL modelo, boolean detalle) { return new Nucleo(modelo, detalle).resolver(); }

    private static final class Nucleo {
        final ModeloPL m; final boolean detalle; final int n, mf, signo;
        final int[] sg, id;               // signo aplicado a cada restricción (b<0 se multiplica por -1) y columna identidad
        final double[] real;              // costos internos (se maximiza)
        final String[] nom; final boolean[] art;
        final boolean[] redundante;       // restricciones dependientes de otras (su fila salió de la tabla)
        final double tolFactible;
        double[][] T; double[] rhs; int[] base;
        final List<Map<String, Object>> tablas = new ArrayList<>();
        int iter, degenerados; boolean truncadas, hayArtificiales;

        Nucleo(ModeloPL m, boolean detalle) {
            this.m = m; this.detalle = detalle; n = m.n(); mf = m.A().length; signo = m.max() ? 1 : -1;
            sg = new int[mf]; id = new int[mf]; redundante = new boolean[mf];
            String[] op = new String[mf]; int cols = n; double maxB = 1;
            for (int i = 0; i < mf; i++) {
                sg[i] = m.b()[i] < 0 ? -1 : 1; maxB = Math.max(maxB, Math.abs(m.b()[i]));
                String o = m.ops()[i];
                op[i] = sg[i] == 1 ? o : o.equals("<=") ? ">=" : o.equals(">=") ? "<=" : "=";
                cols += op[i].equals(">=") ? 2 : 1;
            }
            tolFactible = 1e-8 * maxB;
            nom = new String[cols]; art = new boolean[cols]; real = new double[cols];
            T = new double[mf][cols]; rhs = new double[mf]; base = new int[mf];
            for (int j = 0; j < n; j++) { nom[j] = m.variables().get(j); real[j] = signo * m.c()[j]; }
            int col = n;
            for (int i = 0; i < mf; i++) {
                for (int j = 0; j < n; j++) T[i][j] = sg[i] * m.A()[i][j];
                rhs[i] = Math.abs(m.b()[i]);
                if (op[i].equals("<=")) nom[col] = "s_" + (i + 1);
                else {
                    if (op[i].equals(">=")) { nom[col] = "e_" + (i + 1); T[i][col++] = -1; }
                    nom[col] = "a_" + (i + 1); art[col] = true; hayArtificiales = true;
                }
                T[i][col] = 1; base[i] = id[i] = col++;
            }
        }

        Resultado resolver() {
            if (hayArtificiales) {
                double[] w = new double[nom.length];
                for (int j = 0; j < w.length; j++) if (art[j]) w[j] = -1;
                optimizar(w, true); // minimizar la suma de artificiales nunca es no acotado
                double suma = 0; for (int i = 0; i < base.length; i++) if (art[base[i]]) suma += rhs[i];
                if (suma > tolFactible) { instantanea("Modelo infactible", -1, -1, null, w, true); return sinOptimo("infactible", new double[n]); }
                expulsarArtificiales();
            }
            boolean acotado = optimizar(real, false);
            instantanea(acotado ? "Tabla óptima" : "Objetivo no acotado", -1, -1, null, real, false);
            return acotado ? optimo() : sinOptimo("no_acotado", valores());
        }

        double[] filaZ(double[] costo) { // z_j - c_j
            double[] z = new double[nom.length];
            for (int j = 0; j < z.length; j++) { double s = -costo[j]; for (int i = 0; i < base.length; i++) s += costo[base[i]] * T[i][j]; z[j] = s; }
            return z;
        }

        /** Bland: entra la primera columna con costo reducido negativo; sale la fila de menor razón (empate: menor índice básico). false = no acotado. */
        boolean optimizar(double[] costo, boolean fase1) {
            while (true) {
                double[] z = filaZ(costo); boolean[] basica = new boolean[nom.length]; for (int b : base) basica[b] = true;
                int j = -1;
                for (int k = 0; k < z.length && j < 0; k++) if (!basica[k] && (fase1 || !art[k]) && z[k] < -EPS) j = k;
                if (j < 0) return true;
                double[] razones = new double[T.length]; Arrays.fill(razones, Double.NaN); int i = -1;
                for (int r = 0; r < T.length; r++) if (T[r][j] > EPS) {
                    razones[r] = rhs[r] / T[r][j];
                    if (i < 0 || razones[r] < razones[i] - EPS || (Math.abs(razones[r] - razones[i]) <= EPS && base[r] < base[i])) i = r;
                }
                if (i < 0) return false;
                if (razones[i] <= EPS) degenerados++;
                if (++iter > MAX_ITERACIONES) throw new IllegalArgumentException("El simplex excedió el límite de " + MAX_ITERACIONES + " iteraciones. Revise la escala del modelo.");
                instantanea("Iteración " + iter + (hayArtificiales ? fase1 ? " (fase 1)" : " (fase 2)" : ""), j, i, razones, costo, fase1);
                pivotar(T, rhs, base, i, j);
            }
        }

        /** Saca de la base las artificiales de valor cero; si su fila no tiene otra columna usable, la restricción era redundante. */
        void expulsarArtificiales() {
            for (int i = base.length - 1; i >= 0; i--) {
                if (!art[base[i]]) continue;
                int j = -1; double mayor = EPS;
                for (int k = 0; k < nom.length; k++) if (!art[k] && Math.abs(T[i][k]) > mayor) { mayor = Math.abs(T[i][k]); j = k; }
                if (j >= 0) {
                    rhs[i] = 0;
                    instantanea("Retirar una artificial de valor cero", j, i, null, real, true);
                    pivotar(T, rhs, base, i, j);
                } else {
                    // Los coeficientes de la fila en las columnas identidad indican qué restricciones forman la dependencia.
                    for (int k = 0; k < mf; k++) if (Math.abs(T[i][id[k]]) > EPS) redundante[k] = true;
                    T = quitar(T, i); rhs = quitar(rhs, i); base = quitar(base, i);
                }
            }
        }

        double[] valores() { double[] x = new double[n]; for (int i = 0; i < base.length; i++) if (base[i] < n) x[base[i]] = limpio(rhs[i]); return x; }

        Resultado sinOptimo(String estado, double[] x) {
            return new Resultado(estado, x, Double.NaN, null, null, null, null, false, false, anyTrue(redundante), degenerados, iter, tablas, truncadas);
        }

        Resultado optimo() {
            double[] x = valores(), z = filaZ(real), holguras = new double[mf], duales = new double[mf];
            for (int i = 0; i < mf; i++) {
                double ax = 0, escala = 1 + Math.abs(m.b()[i]); for (int j = 0; j < n; j++) { ax += m.A()[i][j] * x[j]; escala += Math.abs(m.A()[i][j] * x[j]); }
                boolean ok = switch (m.ops()[i]) { case "<=" -> ax <= m.b()[i] + 1e-6 * escala; case ">=" -> ax >= m.b()[i] - 1e-6 * escala; default -> Math.abs(ax - m.b()[i]) <= 1e-6 * escala; };
                if (!ok) throw new IllegalArgumentException("El modelo es numéricamente inestable (coeficientes de escalas muy distintas). Reescale los datos.");
                holguras[i] = limpio(m.ops()[i].equals(">=") ? ax - m.b()[i] : m.b()[i] - ax);
                duales[i] = limpio(signo * sg[i] * z[id[i]]); // dz/db_i en las unidades originales
            }
            double zv = 0; for (int j = 0; j < n; j++) zv += m.c()[j] * x[j];
            boolean[] basica = new boolean[nom.length]; for (int b : base) basica[b] = true;
            boolean degenerado = false; for (int i = 0; i < base.length; i++) if (!art[base[i]] && limpio(rhs[i]) == 0) degenerado = true;
            double[][] sb = new double[mf][], sc = new double[n][];
            if (detalle) {
                final double inf = Double.POSITIVE_INFINITY;
                for (int i = 0; i < mf; i++) { // cuánto puede cambiar b_i sin que la base deje de ser factible
                    double actual = m.b()[i], lo = -inf, hi = inf;
                    if (redundante[i]) lo = hi = 0;
                    else for (int t = 0; t < base.length; t++) {
                        double d = sg[i] * T[t][id[i]];
                        if (d > EPS) lo = Math.max(lo, -rhs[t] / d); else if (d < -EPS) hi = Math.min(hi, -rhs[t] / d);
                    }
                    sb[i] = new double[]{actual + Math.min(0, lo), actual + Math.max(0, hi)};
                }
                for (int j = 0; j < n; j++) { // cuánto puede cambiar c_j (en unidades internas δ) sin que la base deje de ser óptima
                    int t = -1; for (int i = 0; i < base.length; i++) if (base[i] == j) t = i;
                    double lo = -inf, hi = inf;
                    if (t < 0) hi = Math.max(0, z[j]);
                    else for (int k = 0; k < nom.length; k++) if (!basica[k] && !art[k]) {
                        double d = T[t][k], zk = Math.max(0, z[k]);
                        if (d > EPS) lo = Math.max(lo, -zk / d); else if (d < -EPS) hi = Math.min(hi, -zk / d);
                    }
                    double c = m.c()[j];
                    sc[j] = signo == 1 ? new double[]{c + Math.min(0, lo), c + Math.max(0, hi)} : new double[]{c - Math.max(0, hi), c - Math.min(0, lo)};
                }
            }
            return new Resultado("optimo", x, zv, holguras, duales, detalle ? sb : null, detalle ? sc : null,
                    detalle && hayOptimosMultiples(z), degenerado, anyTrue(redundante), degenerados, iter, tablas, truncadas);
        }

        /** Recorre las bases óptimas vecinas por pivotes degenerados de costo cero: si alguna columna puede avanzar con paso > 0 cambiando las variables de decisión, hay óptimos múltiples. */
        boolean hayOptimosMultiples(double[] z) {
            record Estado(double[][] T, double[] rhs, int[] base) {}
            List<Estado> pendientes = new ArrayList<>(List.of(new Estado(T, rhs, base))); Set<String> vistas = new HashSet<>();
            // ponytail: se examinan a lo sumo MAX_BASES_MULTIPLES bases degeneradas; con más, se asume solución única.
            for (int p = 0; p < pendientes.size() && p < MAX_BASES_MULTIPLES; p++) {
                Estado s = pendientes.get(p); int[] orden = s.base().clone(); Arrays.sort(orden);
                if (!vistas.add(Arrays.toString(orden))) continue;
                boolean[] basica = new boolean[nom.length]; for (int b : s.base()) basica[b] = true;
                for (int j = 0; j < nom.length; j++) {
                    if (basica[j] || art[j] || Math.abs(z[j]) > EPS) continue;
                    double paso = Double.POSITIVE_INFINITY;
                    for (int i = 0; i < s.T().length; i++) if (s.T()[i][j] > EPS) paso = Math.min(paso, s.rhs()[i] / s.T()[i][j]);
                    if (paso > EPS) {
                        double[] dir = new double[n]; if (j < n) dir[j] += 1;
                        for (int i = 0; i < s.base().length; i++) if (s.base()[i] < n) dir[s.base()[i]] -= s.T()[i][j];
                        for (double v : dir) if (Math.abs(v) > EPS) return true;
                    // La cola también se acota: sin tope crecía (columnas × filas degeneradas) por estado y agotaba la memoria.
                    } else for (int i = 0; i < s.T().length && pendientes.size() < MAX_BASES_MULTIPLES; i++) if (s.T()[i][j] > EPS && Math.abs(s.rhs()[i] / s.T()[i][j] - paso) <= EPS) {
                        double[][] T2 = Arrays.stream(s.T()).map(double[]::clone).toArray(double[][]::new); double[] r2 = s.rhs().clone(); int[] b2 = s.base().clone();
                        pivotar(T2, r2, b2, i, j); pendientes.add(new Estado(T2, r2, b2));
                    }
                }
            }
            return false;
        }

        /** Instantánea de la tabla. Con pivote (entra>=0) se guardan como mucho MAX_TABLAS-1 para dejar sitio a la final. */
        void instantanea(String titulo, int entra, int sale, double[] razones, double[] costo, boolean fase1) {
            if (!detalle) return;
            if (entra >= 0 && tablas.size() >= MAX_TABLAS - 1) { truncadas = true; return; }
            int[] vis = IntStream.range(0, nom.length).filter(j -> fase1 || !art[j]).toArray();
            double[] z = filaZ(costo);
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("titulo", titulo);
            t.put("encabezados", Arrays.stream(vis).mapToObj(j -> nom[j]).toList());
            List<Map<String, Object>> filas = new ArrayList<>();
            double valorZ = 0;
            for (int i = 0; i < base.length; i++) {
                Map<String, Object> f = new LinkedHashMap<>();
                f.put("base", nom[base[i]]); f.put("valores", fila(T[i], vis)); f.put("rhs", limpio(rhs[i])); filas.add(f);
                valorZ += fase1 ? (art[base[i]] ? rhs[i] : 0) : costo[base[i]] * rhs[i]; // fase 1: suma de artificiales; fase 2: Z
            }
            t.put("filas", filas); t.put("filaZ", fila(z, vis)); t.put("zValor", limpio(fase1 ? valorZ : signo * valorZ));
            Map<String, Object> pivote = null;
            if (entra >= 0) { pivote = new LinkedHashMap<>(); pivote.put("fila", sale); pivote.put("col", Arrays.binarySearch(vis, entra)); }
            t.put("pivote", pivote);
            t.put("entra", entra < 0 ? null : nom[entra]); t.put("sale", entra < 0 ? null : nom[base[sale]]);
            List<Double> rz = new ArrayList<>(); // razón rhs/columna por fila; null donde el coeficiente no es positivo
            if (razones != null) for (double r : razones) rz.add(Double.isNaN(r) ? null : limpio(r));
            t.put("razones", rz);
            tablas.add(t);
        }
    }

    // ---- Álgebra de la tabla ----
    static void pivotar(double[][] T, double[] rhs, int[] base, int i, int j) {
        double p = T[i][j];
        for (int k = 0; k < T[i].length; k++) T[i][k] /= p;
        rhs[i] /= p; T[i][j] = 1;
        for (int r = 0; r < T.length; r++) {
            double f = T[r][j]; if (r == i || f == 0) continue;
            for (int k = 0; k < T[r].length; k++) { double t = f * T[i][k]; T[r][k] = cancela(T[r][k] - t, T[r][k], t); }
            double t = f * rhs[i]; rhs[r] = cancela(rhs[r] - t, rhs[r], t); T[r][j] = 0;
        }
        base[i] = j;
    }
    /** Si la resta cancela casi todo, el resto es ruido de redondeo. */
    private static double cancela(double v, double a, double b) { return Math.abs(v) <= 1e-12 * (Math.abs(a) + Math.abs(b)) ? 0 : v; }
    private static double[][] quitar(double[][] a, int i) { double[][] r = new double[a.length - 1][]; for (int k = 0, p = 0; k < a.length; k++) if (k != i) r[p++] = a[k]; return r; }
    private static double[] quitar(double[] a, int i) { double[] r = new double[a.length - 1]; for (int k = 0, p = 0; k < a.length; k++) if (k != i) r[p++] = a[k]; return r; }
    private static int[] quitar(int[] a, int i) { int[] r = new int[a.length - 1]; for (int k = 0, p = 0; k < a.length; k++) if (k != i) r[p++] = a[k]; return r; }
    private static boolean anyTrue(boolean[] v) { for (boolean b : v) if (b) return true; return false; }
    private static List<Double> fila(double[] v, int[] vis) { return Arrays.stream(vis).mapToObj(j -> limpio(v[j])).toList(); }

    // ---- Presentación ----
    private static IoSolucion aSolucion(ModeloPL m, Resultado r) {
        boolean optimo = r.estado().equals("optimo");
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("estado", r.estado()); res.put("sentido", m.max() ? "max" : "min"); res.put("z", optimo ? (Object) limpio(r.z()) : null);
        res.put("x", mapaVariables(m.variables(), r.x()));
        Map<String, Object> holguras = new LinkedHashMap<>();
        if (optimo) for (int i = 0; i < r.holguras().length; i++) holguras.put((m.ops()[i].equals(">=") ? "e_" : "s_") + (i + 1), r.holguras()[i]);
        res.put("holguras", holguras);
        res.put("duales", optimo ? Arrays.stream(r.duales()).boxed().toList() : List.of());
        List<Object> sb = new ArrayList<>(), sc = new ArrayList<>();
        for (int i = 0; i < m.A().length; i++) sb.add(rango(m.b()[i], r.sensB() == null ? null : r.sensB()[i]));
        for (int j = 0; j < m.n(); j++) sc.add(rango(m.c()[j], r.sensC() == null ? null : r.sensC()[j]));
        res.put("sensibilidad", new LinkedHashMap<>(Map.of("b", sb, "c", sc)));
        res.put("multiple", r.multiple()); res.put("degenerado", r.degenerado()); res.put("pivotesDegenerados", r.pivotesDegenerados());
        res.put("iteraciones", r.iteraciones()); res.put("tablas", r.tablas());

        List<IoSolucion.Metrica> metricas = new ArrayList<>();
        StringBuilder valores = new StringBuilder();
        if (optimo) {
            for (int j = 0; j < m.n(); j++) { metricas.add(new IoSolucion.Metrica(m.variables().get(j), limpio(r.x()[j]), null)); valores.append(j > 0 ? ", " : "").append(m.variables().get(j)).append(" = ").append(num(r.x()[j])); }
            metricas.add(new IoSolucion.Metrica("Valor objetivo Z", limpio(r.z()), null));
        }
        List<String> advertencias = new ArrayList<>();
        if (r.multiple()) advertencias.add("Existen soluciones óptimas múltiples: otras combinaciones de las variables alcanzan el mismo valor de Z.");
        if (r.degenerado()) advertencias.add("La solución óptima es degenerada (una variable básica vale 0): los precios sombra y los rangos de sensibilidad pueden no ser únicos.");
        if (r.redundante()) advertencias.add("Alguna restricción es redundante (combinación de otras): se retiró durante la fase 1 y su rango de sensibilidad se fija en su valor actual.");
        if (r.tablasTruncadas()) advertencias.add("Solo se muestran las primeras " + (MAX_TABLAS - 1) + " tablas y la final; el método realizó " + r.iteraciones() + " iteraciones.");
        String resumen = switch (r.estado()) {
            case "optimo" -> "Solución óptima: Z = " + num(r.z()) + " con " + valores + ".";
            case "infactible" -> "Las restricciones no admiten una solución factible.";
            default -> "El objetivo no está acotado con estas restricciones.";
        };
        List<IoSolucion.Paso> pasos = r.tablas().stream().map(t -> new IoSolucion.Paso((String) t.get("titulo"), t)).toList();
        return new IoSolucion("pl", "simplex", r.estado(), resumen, metricas, pasos, res, advertencias);
    }

    static Map<String, Object> mapaVariables(List<String> variables, double[] x) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        for (int j = 0; j < variables.size(); j++) mapa.put(variables.get(j), limpio(x[j]));
        return mapa;
    }
    private static Map<String, Object> rango(double actual, double[] mm) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("actual", limpio(actual)); r.put("min", mm == null ? null : finito(mm[0])); r.put("max", mm == null ? null : finito(mm[1]));
        return r;
    }
}
