package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

/**
 * Teoría de decisiones sobre una tabla de pagos (filas = alternativas, columnas = estados de la naturaleza).
 * incertidumbre: optimista, pesimista de Wald, Laplace, Hurwicz (si hay alfa) y Savage. riesgo: valor esperado, VEIP y pérdida de oportunidad esperada.
 * objetivo "max" trata los pagos como ganancias; "min", como costos. En empates gana la primera alternativa.
 */
public final class DecisionesSolver {
    private DecisionesSolver() {}
    private static final double MAX = 1e12, TOL = 1e-6;
    private static final int MAX_DIM = 20;

    private record Tabla(double[][] pagos, List<String> filas, List<String> cols, boolean max) {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indica la tabla de pagos.");
        if (metodo == null || !Set.of("incertidumbre", "riesgo").contains(metodo)) throw new IllegalArgumentException("Método de decisiones no soportado: " + metodo + ".");
        var t = tabla(datos);
        return metodo.equals("riesgo") ? riesgo(datos, t) : incertidumbre(datos, t);
    }

    private static IoSolucion incertidumbre(JsonNode d, Tabla t) {
        Double alfa = null;
        if (!d.path("alfa").isMissingNode() && !d.path("alfa").isNull()) {
            JsonNode a = d.path("alfa");
            if (!a.isNumber() || !(a.asDouble() >= 0 && a.asDouble() <= 1)) throw new IllegalArgumentException("El coeficiente de optimismo α debe estar entre 0 y 1.");
            alfa = a.asDouble();
        }
        double[][] p = t.pagos(); int nf = p.length, nc = p[0].length; boolean max = t.max();
        double[] mejorCol = new double[nc];
        for (int j = 0; j < nc; j++) { mejorCol[j] = p[0][j]; for (double[] fila : p) mejorCol[j] = max ? Math.max(mejorCol[j], fila[j]) : Math.min(mejorCol[j], fila[j]); }
        double[][] arrep = new double[nf][nc];
        double[] optimista = new double[nf], pesimista = new double[nf], laplace = new double[nf], hurwicz = new double[nf], savage = new double[nf];
        for (int i = 0; i < nf; i++) {
            double mejor = p[i][0], peor = p[i][0], suma = 0;
            for (int j = 0; j < nc; j++) {
                double x = p[i][j]; suma += x; arrep[i][j] = Math.abs(mejorCol[j] - x); savage[i] = Math.max(savage[i], arrep[i][j]);
                mejor = max ? Math.max(mejor, x) : Math.min(mejor, x); peor = max ? Math.min(peor, x) : Math.max(peor, x);
            }
            optimista[i] = mejor; pesimista[i] = peor; laplace[i] = suma / nc; if (alfa != null) hurwicz[i] = alfa * mejor + (1 - alfa) * peor;
        }
        var criterios = new ArrayList<Map<String, Object>>(); var metricas = new ArrayList<IoSolucion.Metrica>(); var pasos = new ArrayList<IoSolucion.Paso>();
        var defs = new ArrayList<Object[]>(List.of(
                new Object[]{"optimista", max ? "Optimista (maximax)" : "Optimista (minimin)", optimista, max},
                new Object[]{"pesimista", max ? "Pesimista de Wald (maximin)" : "Pesimista de Wald (minimax)", pesimista, max},
                new Object[]{"laplace", "Laplace (equiprobable)", laplace, max}));
        if (alfa != null) defs.add(new Object[]{"hurwicz", "Hurwicz (α = " + fmt(alfa) + ")", hurwicz, max});
        defs.add(new Object[]{"savage", "Savage (minimax de arrepentimiento)", savage, false});
        for (Object[] c : defs) {
            double[] v = (double[]) c[2]; boolean maximiza = (Boolean) c[3]; int idx = mejorIndice(v, maximiza); String nombre = (String) c[1];
            criterios.add(mapa("clave", c[0], "nombre", nombre, "valores", lista(v), "max", maximiza, "decision", t.filas().get(idx), "indice", idx));
            metricas.add(new IoSolucion.Metrica(nombre, lim(v[idx]), "→ " + t.filas().get(idx)));
            var tabla = new ArrayList<Map<String, Object>>(); for (int i = 0; i < nf; i++) tabla.add(mapa("alternativa", t.filas().get(i), "valor", v[i]));
            pasos.add(new IoSolucion.Paso(nombre + ": se elige " + t.filas().get(idx) + " (" + (maximiza ? "mayor" : "menor") + " valor " + fmt(v[idx]) + ").", tabla));
        }
        var arrepLista = new ArrayList<List<Double>>(); for (double[] fila : arrep) arrepLista.add(lista(fila));
        pasos.add(new IoSolucion.Paso("Matriz de arrepentimiento (Savage): diferencia con el mejor pago de cada estado.", arrepLista));
        var r = mapa("alternativas", t.filas(), "estados", t.cols(), "criterios", criterios, "arrepentimiento", arrepLista);
        return new IoSolucion("decisiones", "incertidumbre", "calculado", "Alternativa elegida por cada criterio: " + String.join("; ", metricas.stream().map(m -> m.etiqueta() + " " + m.unidad()).toList()) + ".",
                metricas, pasos, r, List.of());
    }

    private static IoSolucion riesgo(JsonNode d, Tabla t) {
        double[][] p = t.pagos(); int nf = p.length, nc = p[0].length; boolean max = t.max();
        JsonNode pr = d.path("probabilidades"); double[] prob = new double[nc]; double suma = 0;
        if (!pr.isArray() || pr.size() != nc) throw new IllegalArgumentException("Indica una probabilidad entre 0 y 1 por estado.");
        for (int j = 0; j < nc; j++) {
            if (!pr.get(j).isNumber() || !(pr.get(j).asDouble() >= 0 && pr.get(j).asDouble() <= 1)) throw new IllegalArgumentException("Indica una probabilidad entre 0 y 1 por estado.");
            prob[j] = pr.get(j).asDouble(); suma += prob[j];
        }
        if (Math.abs(suma - 1) > TOL) throw new IllegalArgumentException("Las probabilidades deben sumar 1.");
        double[] ve = new double[nf], poe = new double[nf], mejorCol = new double[nc];
        for (int j = 0; j < nc; j++) { mejorCol[j] = p[0][j]; for (double[] fila : p) mejorCol[j] = max ? Math.max(mejorCol[j], fila[j]) : Math.min(mejorCol[j], fila[j]); }
        double conInfo = 0; for (int j = 0; j < nc; j++) conInfo += mejorCol[j] * prob[j];
        for (int i = 0; i < nf; i++) for (int j = 0; j < nc; j++) { ve[i] += p[i][j] * prob[j]; poe[i] += Math.abs(mejorCol[j] - p[i][j]) * prob[j]; }
        int idx = mejorIndice(ve, max); double veip = Math.abs(conInfo - ve[idx]), poeMin = Arrays.stream(poe).min().getAsDouble();
        var tablaVe = new ArrayList<Map<String, Object>>(); for (int i = 0; i < nf; i++) tablaVe.add(mapa("alternativa", t.filas().get(i), "valorEsperado", ve[i], "perdidaOportunidadEsperada", poe[i]));
        var r = mapa("alternativas", t.filas(), "estados", t.cols(), "valoresEsperados", lista(ve), "decision", t.filas().get(idx), "indice", idx, "valorEsperado", ve[idx],
                "valorConInformacionPerfecta", conInfo, "veip", veip, "perdidaOportunidadEsperada", lista(poe), "perdidaOportunidadMinima", poeMin);
        return new IoSolucion("decisiones", "riesgo", "calculado", "Se elige " + t.filas().get(idx) + " con valor esperado " + fmt(ve[idx]) + "; el VEIP es " + fmt(veip) + ".",
                List.of(new IoSolucion.Metrica("Mejor alternativa (valor esperado)", lim(ve[idx]), "→ " + t.filas().get(idx)), new IoSolucion.Metrica("Valor esperado con información perfecta", lim(conInfo), null),
                        new IoSolucion.Metrica("VEIP (valor esperado de la información perfecta)", lim(veip), null)),
                List.of(new IoSolucion.Paso("Valor esperado de cada alternativa: Σ pago × probabilidad. Se elige " + t.filas().get(idx) + " (" + (max ? "mayor" : "menor") + " valor esperado).", tablaVe),
                        new IoSolucion.Paso("Valor esperado con información perfecta = Σ (" + (max ? "mejor" : "menor") + " pago del estado × probabilidad) = " + fmt(conInfo) + ".", null),
                        new IoSolucion.Paso("VEIP = |VE con información perfecta − mejor VE| = |" + fmt(conInfo) + " − " + fmt(ve[idx]) + "| = " + fmt(veip) + ": lo máximo que convendría pagar por saber el estado. Coincide con la pérdida de oportunidad esperada mínima (" + fmt(poeMin) + ").", null)),
                r, List.of());
    }

    // --- utilidades ---
    private static Tabla tabla(JsonNode d) {
        JsonNode m = d.path("pagos");
        if (!m.isArray() || m.isEmpty() || !m.get(0).isArray() || m.get(0).isEmpty()) throw new IllegalArgumentException("La tabla de pagos debe tener filas y columnas.");
        int nf = m.size(), nc = m.get(0).size();
        if (nf > MAX_DIM || nc > MAX_DIM) throw new IllegalArgumentException("La tabla admite hasta " + MAX_DIM + " alternativas y " + MAX_DIM + " estados.");
        double[][] p = new double[nf][nc];
        for (int i = 0; i < nf; i++) {
            if (!m.get(i).isArray() || m.get(i).size() != nc) throw new IllegalArgumentException("La tabla de pagos debe ser rectangular.");
            for (int j = 0; j < nc; j++) {
                JsonNode x = m.get(i).get(j);
                if (!x.isNumber() || !Double.isFinite(x.asDouble()) || Math.abs(x.asDouble()) > MAX) throw new IllegalArgumentException("Cada pago debe ser un número finito con valor absoluto menor o igual que " + fmt(MAX) + ".");
                p[i][j] = x.asDouble();
            }
        }
        String obj = d.path("objetivo").asText();
        if (!d.path("objetivo").isTextual() || !Set.of("max", "min").contains(obj)) throw new IllegalArgumentException("Indica si los pagos son ganancias (max) o costos (min).");
        return new Tabla(p, nombres(d.path("alternativas"), nf, "A", "Indica un nombre por alternativa."), nombres(d.path("estados"), nc, "E", "Indica un nombre por estado de la naturaleza."), obj.equals("max"));
    }
    private static List<String> nombres(JsonNode n, int cuantos, String prefijo, String error) {
        var l = new ArrayList<String>();
        if (n.isMissingNode() || n.isNull()) { for (int i = 1; i <= cuantos; i++) l.add(prefijo + i); return l; }
        if (!n.isArray() || n.size() != cuantos) throw new IllegalArgumentException(error);
        for (JsonNode x : n) { if (!x.isTextual() || x.asText().length() > 60) throw new IllegalArgumentException(error); l.add(x.asText()); }
        return l;
    }
    private static int mejorIndice(double[] v, boolean max) {
        int m = 0;
        for (int i = 1; i < v.length; i++) if (max ? v[i] > v[m] + 1e-12 : v[i] < v[m] - 1e-12) m = i;
        return m;
    }
    private static List<Double> lista(double[] x) { var l = new ArrayList<Double>(); for (double v : x) l.add(lim(v)); return l; }
    /** Mapa ordenado; cada Double pasa por lim (limpia ruido y rechaza Infinity/NaN). */
    private static Map<String, Object> mapa(Object... kv) {
        var m = new LinkedHashMap<String, Object>();
        for (int k = 0; k < kv.length; k += 2) m.put((String) kv[k], kv[k + 1] instanceof Double x ? (Object) lim(x) : kv[k + 1]);
        return m;
    }
    private static double lim(double x) {
        if (!Double.isFinite(x)) throw new IllegalArgumentException("El resultado excede la precisión numérica disponible. Reduce la escala de los datos.");
        return Math.abs(x) < 1e-9 ? 0.0 : x;
    }
    private static String fmt(double x) { return Double.isFinite(x) ? new BigDecimal(x).round(new MathContext(6)).stripTrailingZeros().toPlainString() : String.valueOf(x); }
}
