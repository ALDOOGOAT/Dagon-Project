package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

/**
 * Transporte: solución inicial (noroeste, costo mínimo o Vogel) y optimización por MODI.
 * Replica transporte.js: balanceo con fila/columna ficticia de costo 0 y básica degenerada como epsilon simbólico
 * (celda básica con asignación 0; nunca se altera la oferta ni la demanda). Índices de celdas base 0, como el JS.
 */
public final class TransporteSolver {
    private static final double EPS = 1e-9, MAX = 1e12;
    private static final int MAX_DIM = 12, MAX_ITER = 10000;
    private static final Map<String, String> NOMBRES = Map.of("noroeste", "esquina noroeste", "costo_minimo", "costo mínimo", "vogel", "aproximación de Vogel");
    private TransporteSolver() {}

    private record Linea(double penalizacion, double minimo, List<int[]> celdas) {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (metodo == null || !NOMBRES.containsKey(metodo)) throw new IllegalArgumentException("Método inicial desconocido.");
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indique costos, oferta, demanda y método.");
        double[][] costos = matriz(datos.path("costos"));
        double[] oferta = vector(datos.path("oferta"), "La oferta"), demanda = vector(datos.path("demanda"), "La demanda");
        if (oferta.length != costos.length || demanda.length != costos[0].length) throw new IllegalArgumentException("La oferta y la demanda no coinciden con la matriz de costos.");

        // Balanceo: la diferencia la absorbe una columna (sobra oferta) o una fila (sobra demanda) ficticia de costo 0.
        double dif = Arrays.stream(oferta).sum() - Arrays.stream(demanda).sum();
        String ficticio = dif > EPS ? "columna" : dif < -EPS ? "fila" : null;
        int m = oferta.length + ("fila".equals(ficticio) ? 1 : 0), n = demanda.length + ("columna".equals(ficticio) ? 1 : 0);
        double[][] C = new double[m][n];
        for (int i = 0; i < costos.length; i++) System.arraycopy(costos[i], 0, C[i], 0, costos[i].length);
        double[] O = Arrays.copyOf(oferta, m), D = Arrays.copyOf(demanda, n);
        if ("columna".equals(ficticio)) D[n - 1] = dif; else if ("fila".equals(ficticio)) O[m - 1] = -dif;

        // Solución inicial.
        double[][] X = new double[m][n];
        double[] o = O.clone(), d = D.clone();
        List<String> textosIniciales = new ArrayList<>();
        if (ficticio != null) textosIniciales.add("Se agregó una " + ficticio + " ficticia de costo cero para balancear el problema.");
        for (int[] c; (c = elegir(metodo, C, o, d, textosIniciales)) != null; ) {
            double q = Math.min(o[c[0]], d[c[1]]);
            X[c[0]][c[1]] += q; o[c[0]] = cero(o[c[0]] - q); d[c[1]] = cero(d[c[1]] - q);
            textosIniciales.add("Asignar " + fmt(q) + " unidades a la celda (" + (c[0] + 1) + ", " + (c[1] + 1) + "), con costo unitario " + fmt(C[c[0]][c[1]]) + ".");
        }
        double[][] inicial = copia(X);
        double costoInicial = costo(X, C);

        // Base: celdas con asignación positiva (un bosque) completadas con epsilon hasta m+n-1 sin cerrar ciclos.
        boolean[][] basica = new boolean[m][n];
        int[] padre = new int[m + n];
        for (int k = 0; k < padre.length; k++) padre[k] = k;
        int basicas = 0;
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (X[i][j] > EPS) {
            if (!unir(padre, i, m + j)) throw new IllegalArgumentException("La solución inicial contiene un ciclo básico inválido.");
            basica[i][j] = true; basicas++;
        }
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (basicas < m + n - 1 && unir(padre, i, m + j)) {
            basica[i][j] = true; basicas++;
            textosIniciales.add("Degeneración: la celda (" + (i + 1) + ", " + (j + 1) + ") es básica con epsilon simbólico (valor mostrado 0).");
        }

        // MODI: potenciales u_i + v_j = c_ij en las básicas; entra la primera celda (por filas) con costo reducido negativo.
        List<Object> iteraciones = new ArrayList<>();
        for (int iter = 0; ; iter++) {
            if (iter >= MAX_ITER) throw new IllegalArgumentException("MODI excedió el límite de iteraciones.");
            double[] u = new double[m], v = new double[n];
            Arrays.fill(u, Double.NaN); Arrays.fill(v, Double.NaN); u[0] = 0;
            for (int k = 0; k < m + n; k++) for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (basica[i][j]) {
                if (!Double.isNaN(u[i]) && Double.isNaN(v[j])) v[j] = C[i][j] - u[i];
                if (!Double.isNaN(v[j]) && Double.isNaN(u[i])) u[i] = C[i][j] - v[j];
            }
            if (Arrays.stream(u).anyMatch(Double::isNaN) || Arrays.stream(v).anyMatch(Double::isNaN)) throw new IllegalArgumentException("No se pudieron calcular los potenciales MODI.");
            List<List<Double>> reducidos = new ArrayList<>();
            int[] entra = null;
            for (int i = 0; i < m; i++) {
                List<Double> fila = new ArrayList<>();
                for (int j = 0; j < n; j++) {
                    Double r = basica[i][j] ? null : limpio(C[i][j] - u[i] - v[j]);
                    fila.add(r);
                    if (entra == null && r != null && r < -EPS) entra = new int[]{i, j};
                }
                reducidos.add(fila);
            }
            List<int[]> ciclo = new ArrayList<>();
            if (entra != null) {
                List<List<int[]>> ady = new ArrayList<>();
                for (int k = 0; k < m + n; k++) ady.add(new ArrayList<>());
                for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (basica[i][j]) { ady.get(i).add(new int[]{m + j, i, j}); ady.get(m + j).add(new int[]{i, i, j}); }
                List<int[]> camino = camino(ady, m + entra[1], entra[0], -1);
                if (camino == null) throw new IllegalArgumentException("No se pudo construir el ciclo de transporte.");
                ciclo.add(entra); ciclo.addAll(camino);
            }
            iteraciones.add(mapa("asignacion", tabla(X), "u", lista(u), "v", lista(v), "costosReducidos", reducidos,
                    "entra", entra == null ? null : celda(entra), "ciclo", ciclo.stream().map(TransporteSolver::celda).toList(), "costo", costo(X, C)));
            if (entra == null) break;
            // Las celdas en posición impar del ciclo restan; theta es la menor de ellas y sale la primera (por fila, columna) que la alcanza.
            double theta = Double.POSITIVE_INFINITY;
            for (int k = 1; k < ciclo.size(); k += 2) theta = Math.min(theta, X[ciclo.get(k)[0]][ciclo.get(k)[1]]);
            int[] sale = null;
            for (int k = 1; k < ciclo.size(); k += 2) {
                int[] c = ciclo.get(k);
                if (Math.abs(X[c[0]][c[1]] - theta) < EPS && (sale == null || c[0] < sale[0] || (c[0] == sale[0] && c[1] < sale[1]))) sale = c;
            }
            for (int k = 0; k < ciclo.size(); k++) { int[] c = ciclo.get(k); X[c[0]][c[1]] = cero(X[c[0]][c[1]] + (k % 2 == 1 ? -theta : theta)); }
            basica[entra[0]][entra[1]] = true; basica[sale[0]][sale[1]] = false;
        }
        double costoOptimo = costo(X, C);

        Map<String, Object> resultado = mapa(
                "balanceado", mapa("costos", tabla(C), "oferta", lista(O), "demanda", lista(D), "ficticio", ficticio),
                "inicial", mapa("asignacion", tabla(inicial), "costo", costoInicial, "pasos", textosIniciales.stream().map(TransporteSolver::texto).toList()),
                "iteraciones", iteraciones,
                "optimo", mapa("asignacion", tabla(X), "costo", costoOptimo));
        List<IoSolucion.Paso> pasos = new ArrayList<>();
        textosIniciales.forEach(t -> pasos.add(new IoSolucion.Paso(t, null)));
        pasos.add(new IoSolucion.Paso("Solución inicial por " + NOMBRES.get(metodo) + ": costo " + fmt(costoInicial) + ".", mapa("asignacion", tabla(inicial), "costo", costoInicial)));
        for (int k = 0; k < iteraciones.size(); k++) pasos.add(new IoSolucion.Paso("MODI: iteración " + (k + 1), iteraciones.get(k)));
        List<String> advertencias = new ArrayList<>();
        if (ficticio != null) advertencias.add("Se balanceó con un " + ("fila".equals(ficticio) ? "origen" : "destino") + " ficticio de costo cero: la "
                + ("fila".equals(ficticio) ? "demanda supera a la oferta" : "oferta supera a la demanda") + " total, y lo asignado a él no se envía realmente.");
        return new IoSolucion("transporte", metodo, "optimo",
                "Costo óptimo " + fmt(costoOptimo) + " tras " + (iteraciones.size() - 1) + " iteración(es) MODI desde la solución inicial por " + NOMBRES.get(metodo) + " (costo " + fmt(costoInicial) + ").",
                List.of(new IoSolucion.Metrica("Costo inicial", costoInicial, null), new IoSolucion.Metrica("Costo óptimo", costoOptimo, null)),
                pasos, resultado, advertencias);
    }

    /** Siguiente celda según el método, o null cuando no queda oferta o demanda. */
    private static int[] elegir(String metodo, double[][] C, double[] o, double[] d, List<String> textos) {
        List<Integer> is = disponibles(o), js = disponibles(d);
        if (is.isEmpty() || js.isEmpty()) return null;
        if (metodo.equals("noroeste")) return new int[]{is.get(0), js.get(0)};
        List<int[]> candidatas = new ArrayList<>();
        for (int i : is) for (int j : js) candidatas.add(new int[]{i, j});
        if (metodo.equals("vogel")) {
            List<Linea> lineas = new ArrayList<>();
            for (int i : is) lineas.add(linea(C, js.stream().map(j -> new int[]{i, j}).toList()));
            for (int j : js) lineas.add(linea(C, is.stream().map(i -> new int[]{i, j}).toList()));
            // Mayor penalización; a igualdad (incluidas dos infinitas) la línea con la celda más barata. El orden es estable: filas antes que columnas.
            lineas.sort(Comparator.comparingDouble((Linea l) -> -l.penalizacion()).thenComparingDouble(Linea::minimo));
            Linea mayor = lineas.get(0);
            textos.add("Vogel: la mayor penalización es " + (Double.isFinite(mayor.penalizacion()) ? fmt(mayor.penalizacion()) : "prioritaria (una sola celda disponible)") + ".");
            candidatas = mayor.celdas();
        }
        return Collections.min(candidatas, Comparator.<int[]>comparingDouble(c -> C[c[0]][c[1]]).thenComparingInt(c -> c[0]).thenComparingInt(c -> c[1]));
    }

    private static Linea linea(double[][] C, List<int[]> celdas) {
        double[] costos = celdas.stream().mapToDouble(c -> C[c[0]][c[1]]).sorted().toArray();
        return new Linea(costos.length > 1 ? costos[1] - costos[0] : Double.POSITIVE_INFINITY, costos[0], celdas);
    }

    private static List<Integer> disponibles(double[] v) {
        List<Integer> r = new ArrayList<>();
        for (int k = 0; k < v.length; k++) if (v[k] > EPS) r.add(k);
        return r;
    }

    /** Camino (aristas {i,j}) entre dos nodos del árbol de celdas básicas; nodos 0..m-1 filas, m.. columnas. */
    private static List<int[]> camino(List<List<int[]>> ady, int actual, int destino, int anterior) {
        if (actual == destino) return new ArrayList<>();
        for (int[] e : ady.get(actual)) if (e[0] != anterior) {
            List<int[]> r = camino(ady, e[0], destino, actual);
            if (r != null) { r.add(0, new int[]{e[1], e[2]}); return r; }
        }
        return null;
    }

    private static boolean unir(int[] padre, int a, int b) {
        int ra = raiz(padre, a), rb = raiz(padre, b);
        if (ra == rb) return false;
        padre[ra] = rb;
        return true;
    }
    private static int raiz(int[] padre, int k) { return padre[k] == k ? k : (padre[k] = raiz(padre, padre[k])); }

    private static double costo(double[][] X, double[][] C) {
        double s = 0;
        for (int i = 0; i < X.length; i++) for (int j = 0; j < X[i].length; j++) s += X[i][j] * C[i][j];
        return limpio(s);
    }

    // ---- lectura y salida (helpers pequeños duplicados por clase para no acoplar los solvers) ----
    private static double[][] matriz(JsonNode nodo) {
        if (!nodo.isArray() || nodo.isEmpty() || !nodo.get(0).isArray() || nodo.get(0).isEmpty()) throw new IllegalArgumentException("Los costos deben tener filas y columnas.");
        if (nodo.size() > MAX_DIM || nodo.get(0).size() > MAX_DIM) throw new IllegalArgumentException("Transporte admite hasta " + MAX_DIM + " orígenes y destinos.");
        double[][] M = new double[nodo.size()][];
        for (int i = 0; i < M.length; i++) {
            JsonNode fila = nodo.get(i);
            if (!fila.isArray() || fila.size() != nodo.get(0).size()) throw new IllegalArgumentException("La matriz de costos debe ser rectangular.");
            M[i] = new double[fila.size()];
            for (int j = 0; j < M[i].length; j++) M[i][j] = numero(fila.get(j), "Los costos", -MAX);
        }
        return M;
    }
    private static double[] vector(JsonNode nodo, String nombre) {
        if (!nodo.isArray() || nodo.isEmpty() || nodo.size() > MAX_DIM) throw new IllegalArgumentException(nombre + " debe contener entre 1 y " + MAX_DIM + " valores.");
        double[] v = new double[nodo.size()];
        for (int k = 0; k < v.length; k++) v[k] = numero(nodo.get(k), nombre, 0);
        return v;
    }
    private static double numero(JsonNode n, String nombre, double minimo) {
        if (n == null || !n.isNumber() || !Double.isFinite(n.asDouble()) || Math.abs(n.asDouble()) > MAX || n.asDouble() < minimo)
            throw new IllegalArgumentException(nombre + " debe ser un número finito" + (minimo == 0 ? " mayor o igual que 0" : "") + ", de hasta 10¹² en valor absoluto.");
        return n.asDouble();
    }
    private static double cero(double x) { return Math.abs(x) < EPS ? 0.0 : x; }
    /** Valor de salida: sin ruido numérico (|x| < 1e-9 es 0.0) y siempre finito. */
    private static double limpio(double x) {
        if (!Double.isFinite(x)) throw new IllegalArgumentException("El resultado excede la precisión numérica disponible. Reduce la escala de los datos.");
        return cero(x);
    }
    private static String fmt(double x) { return BigDecimal.valueOf(limpio(x)).round(new MathContext(12)).stripTrailingZeros().toPlainString(); }
    private static double[][] copia(double[][] M) { return Arrays.stream(M).map(double[]::clone).toArray(double[][]::new); }
    private static List<Double> lista(double[] v) { List<Double> l = new ArrayList<>(); for (double x : v) l.add(limpio(x)); return l; }
    private static List<List<Double>> tabla(double[][] M) { List<List<Double>> t = new ArrayList<>(); for (double[] f : M) t.add(lista(f)); return t; }
    private static Map<String, Object> celda(int[] c) { return mapa("i", c[0], "j", c[1]); }
    private static Map<String, Object> texto(String t) { return mapa("texto", t); }
    private static Map<String, Object> mapa(Object... kv) {
        Map<String, Object> r = new LinkedHashMap<>();
        for (int k = 0; k < kv.length; k += 2) r.put((String) kv[k], kv[k + 1]);
        return r;
    }
}
