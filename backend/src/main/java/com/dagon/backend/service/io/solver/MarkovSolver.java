package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;

/**
 * Cadenas de Markov discretas: distribución tras 0..n pasos y distribución estacionaria (πP = π, Σπ = 1) por eliminación gaussiana.
 * Los índices de los resultados comienzan en cero; el texto llama "Estado 1" al índice 0, como la interfaz.
 */
public final class MarkovSolver {
    private MarkovSolver() {}
    private static final int MAX_ESTADOS = 50, MAX_PASOS = 1000;
    private static final double TOL = 1e-6, PIVOTE = 1e-12;

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indica P, la distribución inicial y n.");
        if (!"discreto".equals(metodo)) throw new IllegalArgumentException("Método de Markov no soportado: " + metodo + ".");
        double[][] P = transicion(datos.path("P"));
        int k = P.length;
        double[] ini = inicial(datos.path("inicial"), k);
        JsonNode nn = datos.path("n");
        if (!nn.isNumber() || nn.asDouble() != Math.rint(nn.asDouble()) || nn.asDouble() < 0 || nn.asDouble() > MAX_PASOS)
            throw new IllegalArgumentException("El número de pasos n debe ser un entero entre 0 y " + MAX_PASOS + ".");
        int n = nn.asInt();

        var historial = new ArrayList<double[]>(); historial.add(ini);
        for (int t = 0; t < n; t++) {
            double[] x = historial.get(t), y = new double[k];
            for (int i = 0; i < k; i++) for (int j = 0; j < k; j++) y[j] += x[i] * P[i][j];
            historial.add(y);
        }

        // (Pᵀ − I)π = 0 con la fila de normalización Σπ = 1; las variables libres (si las hay) se fijan en 0.
        double[][] A = new double[k + 1][k + 1];
        for (int j = 0; j < k; j++) for (int i = 0; i < k; i++) A[j][i] = P[i][j] - (i == j ? 1 : 0);
        Arrays.fill(A[k], 1);
        int fila = 0; var pivotes = new ArrayList<Integer>();
        for (int j = 0; j < k; j++) {
            int p = fila;
            for (int i = fila; i <= k; i++) if (Math.abs(A[i][j]) > Math.abs(A[p][j])) p = i;
            if (Math.abs(A[p][j]) < PIVOTE) continue;
            double[] tmp = A[fila]; A[fila] = A[p]; A[p] = tmp;
            double div = A[fila][j]; for (int c = 0; c <= k; c++) A[fila][c] /= div;
            for (int i = 0; i <= k; i++) if (i != fila) { double f = A[i][j]; if (f != 0) for (int c = 0; c <= k; c++) A[i][c] -= f * A[fila][c]; }
            pivotes.add(j); fila++;
        }
        double[] pi = new double[k]; double suma = 0;
        for (int i = 0; i < pivotes.size(); i++) pi[pivotes.get(i)] = A[i][k];
        for (double x : pi) suma += x;
        for (double x : pi) if (x < -1e-8) suma = Double.NaN;
        if (!(Math.abs(suma - 1) < TOL)) throw new IllegalArgumentException("No se pudo calcular una distribución estacionaria válida.");
        double total = 0; for (int i = 0; i < k; i++) { pi[i] = Math.max(0, pi[i]); total += pi[i]; }
        var estacionaria = new ArrayList<Double>(); for (int i = 0; i < k; i++) estacionaria.add(lim(pi[i] / total));
        boolean unica = pivotes.size() == k;
        var absorbentes = new ArrayList<Integer>(); for (int i = 0; i < k; i++) if (P[i][i] >= 1 - 1e-12) absorbentes.add(i);

        var tabla = new ArrayList<List<Double>>(); for (double[] x : historial) tabla.add(lista(x));
        var r = new LinkedHashMap<String, Object>();
        r.put("historial", tabla); r.put("estacionaria", estacionaria); r.put("estacionariaUnica", unica); r.put("absorbentes", absorbentes);
        var metricas = new ArrayList<IoSolucion.Metrica>(); double[] ultimo = historial.get(n);
        for (int i = 0; i < k; i++) metricas.add(new IoSolucion.Metrica("Estado " + (i + 1) + " después de " + n + " pasos", lim(ultimo[i]), null));
        for (int i = 0; i < k; i++) metricas.add(new IoSolucion.Metrica("Estado " + (i + 1) + " en el largo plazo (π)", estacionaria.get(i), null));
        var pasos = new ArrayList<IoSolucion.Paso>();
        pasos.add(new IoSolucion.Paso("Multiplicar la distribución inicial por P durante " + n + " pasos (cada fila es la distribución tras ese número de pasos).", tabla));
        pasos.add(new IoSolucion.Paso("Formar las ecuaciones πP = π y agregar la normalización Σπᵢ = 1.", null));
        for (int i = 0; i < pivotes.size(); i++) pasos.add(new IoSolucion.Paso("Eliminar la columna " + (pivotes.get(i) + 1) + " usando la fila " + (i + 1) + ".", null));
        if (!absorbentes.isEmpty()) pasos.add(new IoSolucion.Paso("Estados absorbentes (P[i][i] = 1): " + nombres(absorbentes) + ".", null));
        if (!unica) pasos.add(new IoSolucion.Paso("Existen varias distribuciones estacionarias (hay más de una clase cerrada); se fijaron las variables libres en cero para obtener una de ellas.", null));
        String resumen = "Distribución estacionaria π = " + estacionaria + (unica ? "." : " (una de varias posibles).");
        return new IoSolucion("markov", "discreto", "calculado", resumen, metricas, pasos, r,
                List.of("Una distribución estacionaria no garantiza convergencia ni unicidad; revisa periodicidad y clases cerradas."));
    }

    private static double[][] transicion(JsonNode m) {
        if (!m.isArray() || m.isEmpty()) throw new IllegalArgumentException("La matriz de transición debe tener filas y columnas.");
        int k = m.size();
        if (k > MAX_ESTADOS) throw new IllegalArgumentException("Markov admite hasta " + MAX_ESTADOS + " estados.");
        double[][] P = new double[k][k];
        for (int i = 0; i < k; i++) {
            if (!m.get(i).isArray() || m.get(i).size() != k) throw new IllegalArgumentException("La matriz de transición debe ser cuadrada.");
            double suma = 0;
            for (int j = 0; j < k; j++) {
                double x = prob(m.get(i).get(j), "Las probabilidades de la matriz");
                P[i][j] = x; suma += x;
            }
            if (Math.abs(suma - 1) > TOL) throw new IllegalArgumentException("Cada fila de la matriz debe sumar 1 (tolerancia 0.000001).");
            for (int j = 0; j < k; j++) P[i][j] /= suma; // normaliza el redondeo permitido
        }
        return P;
    }
    private static double[] inicial(JsonNode v, int k) {
        if (!v.isArray() || v.size() != k) throw new IllegalArgumentException("La distribución inicial tiene una dimensión incorrecta: debe tener un valor por estado.");
        double[] x = new double[k]; double suma = 0;
        for (int i = 0; i < k; i++) { x[i] = prob(v.get(i), "Las probabilidades iniciales"); suma += x[i]; }
        if (Math.abs(suma - 1) > TOL) throw new IllegalArgumentException("La distribución inicial debe sumar 1.");
        for (int i = 0; i < k; i++) x[i] /= suma;
        return x;
    }
    private static double prob(JsonNode n, String nombre) {
        if (!n.isNumber() || !(n.asDouble() >= 0 && n.asDouble() <= 1)) throw new IllegalArgumentException(nombre + " deben ser números entre 0 y 1.");
        return n.asDouble();
    }
    private static String nombres(List<Integer> idx) { return String.join(", ", idx.stream().map(i -> "Estado " + (i + 1)).toList()); }
    private static List<Double> lista(double[] x) { var l = new ArrayList<Double>(); for (double v : x) l.add(lim(v)); return l; }
    private static double lim(double x) {
        if (!Double.isFinite(x)) throw new IllegalArgumentException("El resultado excede la precisión numérica disponible.");
        return Math.abs(x) < 1e-9 ? 0.0 : x;
    }
}
