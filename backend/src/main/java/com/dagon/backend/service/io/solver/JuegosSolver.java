package com.dagon.backend.service.io.solver;

import static com.dagon.backend.service.io.solver.ModeloPL.limpio;
import static com.dagon.backend.service.io.solver.ModeloPL.num;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;

/**
 * Juegos de suma cero de dos personas. Pagos desde el punto de vista del jugador A (filas, maximiza); B (columnas) minimiza.
 * Punto silla si maximin = minimax; si no, estrategias mixtas por PL (la matriz se desplaza para que el valor sea positivo).
 */
public final class JuegosSolver {
    private JuegosSolver() {}
    static final int MAX = 20;
    private static final double TOL = 1e-12;

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!"suma_cero".equals(metodo)) throw new IllegalArgumentException("Método de juegos no soportado: " + metodo + ".");
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Faltan los datos del juego.");
        double[][] a = pagos(datos.path("pagos"));
        int f = a.length, c = a[0].length;
        String[] filas = nombres(datos.path("filas"), f, "A", "fila"), cols = nombres(datos.path("columnas"), c, "B", "columna");

        double[] minFila = new double[f], maxCol = new double[c]; Arrays.fill(minFila, Double.POSITIVE_INFINITY); Arrays.fill(maxCol, Double.NEGATIVE_INFINITY);
        double minimo = Double.POSITIVE_INFINITY;
        for (int i = 0; i < f; i++) for (int j = 0; j < c; j++) { minFila[i] = Math.min(minFila[i], a[i][j]); maxCol[j] = Math.max(maxCol[j], a[i][j]); minimo = Math.min(minimo, a[i][j]); }
        double maximin = Arrays.stream(minFila).max().getAsDouble(), minimax = Arrays.stream(maxCol).min().getAsDouble();

        List<IoSolucion.Paso> pasos = new ArrayList<>();
        List<Map<String, Object>> tabla = new ArrayList<>();
        for (int i = 0; i < f; i++) {
            Map<String, Object> fila = new LinkedHashMap<>(); fila.put("estrategia", filas[i]);
            for (int j = 0; j < c; j++) fila.put(cols[j], limpio(a[i][j]));
            fila.put("minimoFila", limpio(minFila[i])); tabla.add(fila);
        }
        Map<String, Object> maximos = new LinkedHashMap<>(); maximos.put("estrategia", "Máximo de columna");
        for (int j = 0; j < c; j++) maximos.put(cols[j], limpio(maxCol[j]));
        tabla.add(maximos);
        pasos.add(new IoSolucion.Paso("Mínimo de cada fila (jugador A) y máximo de cada columna (jugador B).", tabla));
        pasos.add(new IoSolucion.Paso(dominancia(a, filas, cols), null));

        Map<String, Object> estrategiaA = new LinkedHashMap<>(), estrategiaB = new LinkedHashMap<>();
        List<Object> puntosSilla = new ArrayList<>();
        boolean silla = Math.abs(maximin - minimax) <= TOL;
        double valor; String resumen;
        if (silla) {
            int fi = -1, cj = -1;
            for (int i = 0; i < f; i++) for (int j = 0; j < c; j++) if (minFila[i] >= maximin - TOL && maxCol[j] <= minimax + TOL) {
                if (fi < 0) { fi = i; cj = j; }
                Map<String, Object> p = new LinkedHashMap<>(); p.put("fila", filas[i]); p.put("columna", cols[j]); puntosSilla.add(p);
            }
            valor = maximin;
            for (int i = 0; i < f; i++) estrategiaA.put(filas[i], i == fi ? 1.0 : 0.0);
            for (int j = 0; j < c; j++) estrategiaB.put(cols[j], j == cj ? 1.0 : 0.0);
            pasos.add(new IoSolucion.Paso("maximin = minimax = " + num(maximin) + ": hay punto silla en (" + filas[fi] + ", " + cols[cj] + "); estrategias puras.", null));
            resumen = "Hay punto silla en (" + filas[fi] + ", " + cols[cj] + "): el valor del juego es " + num(valor) + " con estrategias puras.";
        } else {
            // Con k tal que todos los pagos sean >= 1, el jugador B resuelve max Σq' s.a. A' q' <= 1; q = q'/Σq', y los duales (precios sombra) dan p' de A.
            double k = Math.max(0, 1 - minimo);
            double[][] b = new double[f][c];
            for (int i = 0; i < f; i++) for (int j = 0; j < c; j++) b[i][j] = a[i][j] + k;
            double[] unos = new double[c], unosF = new double[f]; Arrays.fill(unos, 1); Arrays.fill(unosF, 1);
            String[] ops = new String[f]; Arrays.fill(ops, "<=");
            List<String> q = new ArrayList<>(); for (int j = 1; j <= c; j++) q.add("q" + j);
            var r = SimplexSolver.resolver(new ModeloPL(true, q, unos, b, ops, unosF, Set.of(), Set.of()), true);
            if (!r.estado().equals("optimo")) throw new IllegalArgumentException("No se pudo resolver el juego por programación lineal.");
            double s = Arrays.stream(r.x()).sum(), sp = Arrays.stream(r.duales()).sum();
            if (s <= 0 || Math.abs(s - sp) > 1e-6 * (1 + s)) throw new IllegalArgumentException("No se pudo resolver el juego por programación lineal.");
            double v = 1 / s; // valor del juego desplazado
            valor = v - k;
            for (int i = 0; i < f; i++) estrategiaA.put(filas[i], limpio(r.duales()[i] * v));
            for (int j = 0; j < c; j++) estrategiaB.put(cols[j], limpio(r.x()[j] * v));
            pasos.add(new IoSolucion.Paso("maximin = " + num(maximin) + " < minimax = " + num(minimax) + ": no hay punto silla; se buscan estrategias mixtas.", null));
            pasos.add(new IoSolucion.Paso("Se suma k = " + num(k) + " a todos los pagos y B resuelve: max Σqⱼ' s.a. Σⱼ aᵢⱼ qⱼ' ≤ 1. Su dual (precios sombra) da la estrategia de A. El valor es 1/Σqⱼ' − k.", r.tablas().get(r.tablas().size() - 1)));
            resumen = "No hay punto silla (maximin = " + num(maximin) + " < minimax = " + num(minimax) + "): el valor del juego es " + num(valor) + " con estrategias mixtas.";
        }

        List<IoSolucion.Metrica> metricas = new ArrayList<>(); metricas.add(new IoSolucion.Metrica("Valor del juego", limpio(valor), null));
        estrategiaA.forEach((k, p) -> metricas.add(new IoSolucion.Metrica("Jugador A: " + k, p, null)));
        estrategiaB.forEach((k, p) -> metricas.add(new IoSolucion.Metrica("Jugador B: " + k, p, null)));
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("puntoSilla", silla); res.put("valor", limpio(valor)); res.put("maximin", limpio(maximin)); res.put("minimax", limpio(minimax));
        res.put("estrategiaFilas", estrategiaA); res.put("estrategiaColumnas", estrategiaB); res.put("puntosSilla", puntosSilla);
        res.put("filas", List.of(filas)); res.put("columnas", List.of(cols));
        return new IoSolucion("juegos", "suma_cero", "optimo", resumen, metricas, pasos, res,
                List.of("Pagos desde el punto de vista del jugador A (filas); lo que gana A lo pierde B."));
    }

    /** Dominancia informativa: A prefiere filas mayores; B prefiere columnas menores. No reduce la tabla. */
    private static String dominancia(double[][] a, String[] filas, String[] cols) {
        List<String> dominadas = new ArrayList<>();
        for (int i = 0; i < a.length; i++) for (int k = 0; k < a.length; k++) if (k != i && domina(a, k, i, true)) { dominadas.add(filas[i] + " está dominada por " + filas[k]); break; }
        for (int j = 0; j < a[0].length; j++) for (int l = 0; l < a[0].length; l++) if (l != j && domina(a, l, j, false)) { dominadas.add(cols[j] + " está dominada por " + cols[l]); break; }
        return dominadas.isEmpty() ? "No hay estrategias dominadas: ninguna fila ni columna puede eliminarse."
                : "Dominancia (informativa; el valor se calcula con la tabla completa): " + String.join("; ", dominadas) + ".";
    }
    /** ¿La estrategia p domina a q? Nunca peor en todo y mejor en algo (o idéntica con p anterior). */
    private static boolean domina(double[][] a, int p, int q, boolean filas) {
        int largo = filas ? a[0].length : a.length; boolean estricta = false;
        for (int t = 0; t < largo; t++) {
            double vp = filas ? a[p][t] : a[t][p], vq = filas ? a[q][t] : a[t][q];
            if (filas ? vp < vq : vp > vq) return false;
            if (vp != vq) estricta = true;
        }
        return estricta || p < q;
    }

    private static double[][] pagos(JsonNode p) {
        if (!p.isArray() || p.isEmpty() || !p.get(0).isArray() || p.get(0).isEmpty()) throw new IllegalArgumentException("Indique la tabla de pagos con filas y columnas.");
        if (p.size() > MAX || p.get(0).size() > MAX) throw new IllegalArgumentException("La tabla admite hasta " + MAX + " estrategias por jugador.");
        double[][] a = new double[p.size()][p.get(0).size()];
        for (int i = 0; i < a.length; i++) {
            JsonNode fila = p.get(i);
            if (!fila.isArray() || fila.size() != a[0].length) throw new IllegalArgumentException("La tabla de pagos debe ser rectangular.");
            for (int j = 0; j < a[0].length; j++) {
                JsonNode v = fila.get(j);
                if (!v.isNumber() || !Double.isFinite(v.asDouble()) || Math.abs(v.asDouble()) > 1e12) throw new IllegalArgumentException("Cada pago debe ser un número finito (máximo 1e12 en valor absoluto).");
                a[i][j] = v.asDouble();
            }
        }
        return a;
    }

    private static String[] nombres(JsonNode lista, int n, String prefijo, String que) {
        String[] r = new String[n];
        if (lista.isMissingNode() || lista.isNull()) { for (int i = 0; i < n; i++) r[i] = prefijo + (i + 1); return r; }
        if (!lista.isArray() || lista.size() != n) throw new IllegalArgumentException("Indique un nombre por " + que + " de la tabla.");
        for (int i = 0; i < n; i++) {
            JsonNode t = lista.get(i);
            if (!t.isTextual() || t.asText().isBlank() || t.asText().length() > 60) throw new IllegalArgumentException("Cada nombre de " + que + " debe ser un texto de 1 a 60 caracteres.");
            r[i] = t.asText().trim();
        }
        if (new HashSet<>(Arrays.asList(r)).size() != n) throw new IllegalArgumentException("Los nombres de las estrategias de cada jugador deben ser distintos.");
        return r;
    }
}
