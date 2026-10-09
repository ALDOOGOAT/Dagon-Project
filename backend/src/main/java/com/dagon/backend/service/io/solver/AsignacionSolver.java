package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

/**
 * Asignación por el método húngaro (ceros marcados con estrella y prima, O(n³)). Replica asignacion.js:
 * las matrices rectangulares se completan con filas/columnas ficticias de valor 0, que se excluyen del resultado,
 * y la maximización se convierte con (mayor − valor). Índices de fila/columna base 0, como el JS.
 */
public final class AsignacionSolver {
    private static final double EPS = 1e-9, MAX = 1e12;
    private static final int MAX_DIM = 20, MAX_ITER = 10000;
    private AsignacionSolver() {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!"hungaro".equals(metodo)) throw new IllegalArgumentException("Método de asignación desconocido.");
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indique una matriz y el objetivo.");
        double[][] entrada = matriz(datos.path("matriz"));
        String objetivo = datos.path("objetivo").asText();
        if (!objetivo.equals("min") && !objetivo.equals("max")) throw new IllegalArgumentException("El objetivo debe ser min o max.");
        boolean max = objetivo.equals("max");
        int f = entrada.length, c = entrada[0].length, n = Math.max(f, c);
        double[][] original = new double[n][n];
        for (int i = 0; i < f; i++) System.arraycopy(entrada[i], 0, original[i], 0, c);
        double mayor = Double.NEGATIVE_INFINITY;
        for (double[] fila : original) for (double x : fila) mayor = Math.max(mayor, x);
        double[][] M = new double[n][n];
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) M[i][j] = max ? mayor - original[i][j] : original[i][j];

        List<Map<String, Object>> pasos = new ArrayList<>();
        guardar(pasos, n != f || n != c ? "Matriz cuadrada con tareas ficticias de costo cero" : "Matriz inicial", max ? original : M, null, null);
        if (max) guardar(pasos, "Conversión de maximización a minimización", M, null, null);
        for (double[] fila : M) { double min = Arrays.stream(fila).min().getAsDouble(); for (int j = 0; j < n; j++) fila[j] = limpio(fila[j] - min); }
        guardar(pasos, "Restar el mínimo de cada fila", M, null, null);
        for (int j = 0; j < n; j++) { double min = Double.POSITIVE_INFINITY; for (double[] fila : M) min = Math.min(min, fila[j]); for (double[] fila : M) fila[j] = limpio(fila[j] - min); }
        guardar(pasos, "Restar el mínimo de cada columna", M, null, null);

        // Ceros independientes iniciales (estrellas); luego se cubre y se ajusta hasta tener n estrellas.
        int[] estrellas = new int[n], primas = new int[n];
        Arrays.fill(estrellas, -1); Arrays.fill(primas, -1);
        boolean[] usadas = new boolean[n];
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (Math.abs(M[i][j]) < EPS && estrellas[i] < 0 && !usadas[j]) { estrellas[i] = j; usadas[j] = true; }
        boolean[] filasCub = new boolean[n], colsCub = new boolean[n];
        for (int j : estrellas) if (j >= 0) colsCub[j] = true;
        for (int iter = 0; cuenta(colsCub) < n; iter++) {
            if (iter >= MAX_ITER) throw new IllegalArgumentException("El método húngaro excedió el límite de iteraciones.");
            guardar(pasos, "Cubrir las columnas con ceros asignados", M, filasCub, colsCub);
            int ci = -1, cj = -1;
            for (int i = 0; i < n && ci < 0; i++) for (int j = 0; j < n && ci < 0; j++) if (!filasCub[i] && !colsCub[j] && Math.abs(M[i][j]) < EPS) { ci = i; cj = j; }
            if (ci < 0) {
                double min = Double.POSITIVE_INFINITY;
                for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (!filasCub[i] && !colsCub[j]) min = Math.min(min, M[i][j]);
                if (!Double.isFinite(min) || min <= 0) throw new IllegalArgumentException("No se encontró un ajuste válido de la matriz húngara.");
                for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) M[i][j] = limpio(M[i][j] + (filasCub[i] ? min : 0) - (!colsCub[j] ? min : 0));
                guardar(pasos, "Restar " + fmt(min) + " de las celdas no cubiertas y sumar en las intersecciones", M, filasCub, colsCub);
                continue;
            }
            primas[ci] = cj;
            if (estrellas[ci] >= 0) { filasCub[ci] = true; colsCub[estrellas[ci]] = false; continue; }
            // Camino alterno: cero con prima, cero con estrella de su columna, cero con prima de esa fila...
            List<int[]> camino = new ArrayList<>(List.of(new int[]{ci, cj}));
            while (true) {
                int j = camino.get(camino.size() - 1)[1], i = indice(estrellas, j);
                if (i < 0) break;
                camino.add(new int[]{i, j}); camino.add(new int[]{i, primas[i]});
            }
            for (int k = 1; k < camino.size(); k += 2) estrellas[camino.get(k)[0]] = -1;
            for (int k = 0; k < camino.size(); k += 2) estrellas[camino.get(k)[0]] = camino.get(k)[1];
            Arrays.fill(primas, -1); Arrays.fill(filasCub, false); Arrays.fill(colsCub, false);
            for (int j : estrellas) if (j >= 0) colsCub[j] = true;
            guardar(pasos, "Alternar asignaciones en el camino de ceros", M, filasCub, colsCub);
        }
        guardar(pasos, "Asignación óptima", M, filasCub, colsCub);

        List<Object> pares = new ArrayList<>();
        double total = 0;
        for (int fila = 0; fila < n; fila++) if (fila < f && estrellas[fila] < c) {
            pares.add(mapa("fila", fila, "columna", estrellas[fila], "costo", limpio(original[fila][estrellas[fila]])));
            total += original[fila][estrellas[fila]];
        }
        total = limpio(total);
        Map<String, Object> resultado = mapa("asignacion", pares, "total", total, "pasos", pasos);
        List<IoSolucion.Paso> pasosIo = pasos.stream().map(p -> new IoSolucion.Paso((String) p.get("titulo"), mapa("matriz", p.get("matriz"), "cubiertas", p.get("cubiertas")))).toList();
        List<String> advertencias = new ArrayList<>();
        if (f != c) advertencias.add("La matriz no es cuadrada: se agregaron " + Math.abs(f - c) + (f < c ? " fila(s)" : " columna(s)") + " ficticia(s) de valor cero; "
                + (f < c ? "las columnas" : "las filas") + " asignadas a una ficticia quedan sin asignar.");
        return new IoSolucion("asignacion", "hungaro", "optimo",
                (max ? "Ganancia total máxima " : "Costo total mínimo ") + fmt(total) + " con " + pares.size() + " asignación(es).",
                List.of(new IoSolucion.Metrica(max ? "Ganancia total" : "Costo total", total, null)), pasosIo, resultado, advertencias);
    }

    /** Guarda una copia de la matriz; filas == null significa "sin información de cubiertas". */
    private static void guardar(List<Map<String, Object>> pasos, String titulo, double[][] M, boolean[] filas, boolean[] columnas) {
        List<List<Double>> copia = new ArrayList<>();
        for (double[] fila : M) { List<Double> l = new ArrayList<>(); for (double x : fila) l.add(limpio(x)); copia.add(l); }
        pasos.add(mapa("titulo", titulo, "matriz", copia, "cubiertas", filas == null ? null : mapa("filas", marcadas(filas), "columnas", marcadas(columnas))));
    }
    private static List<Integer> marcadas(boolean[] v) { List<Integer> r = new ArrayList<>(); for (int k = 0; k < v.length; k++) if (v[k]) r.add(k); return r; }
    private static int cuenta(boolean[] v) { int c = 0; for (boolean b : v) if (b) c++; return c; }
    private static int indice(int[] v, int x) { for (int k = 0; k < v.length; k++) if (v[k] == x) return k; return -1; }

    private static double[][] matriz(JsonNode nodo) {
        if (!nodo.isArray() || nodo.isEmpty() || !nodo.get(0).isArray() || nodo.get(0).isEmpty()) throw new IllegalArgumentException("La matriz debe tener filas y columnas.");
        if (nodo.size() > MAX_DIM || nodo.get(0).size() > MAX_DIM) throw new IllegalArgumentException("La asignación admite hasta " + MAX_DIM + " filas y " + MAX_DIM + " columnas.");
        double[][] M = new double[nodo.size()][];
        for (int i = 0; i < M.length; i++) {
            JsonNode fila = nodo.get(i);
            if (!fila.isArray() || fila.size() != nodo.get(0).size()) throw new IllegalArgumentException("La matriz debe ser rectangular.");
            M[i] = new double[fila.size()];
            for (int j = 0; j < M[i].length; j++) {
                JsonNode x = fila.get(j);
                if (!x.isNumber() || !Double.isFinite(x.asDouble()) || Math.abs(x.asDouble()) > MAX) throw new IllegalArgumentException("La matriz debe contener números finitos de hasta 10¹² en valor absoluto.");
                M[i][j] = x.asDouble();
            }
        }
        return M;
    }
    private static double limpio(double x) {
        if (!Double.isFinite(x)) throw new IllegalArgumentException("El resultado excede la precisión numérica disponible. Reduce la escala de los datos.");
        return Math.abs(x) < EPS ? 0.0 : x;
    }
    private static String fmt(double x) { return BigDecimal.valueOf(limpio(x)).round(new MathContext(12)).stripTrailingZeros().toPlainString(); }
    private static Map<String, Object> mapa(Object... kv) {
        Map<String, Object> r = new LinkedHashMap<>();
        for (int k = 0; k < kv.length; k += 2) r.put((String) kv[k], kv[k + 1]);
        return r;
    }
}
