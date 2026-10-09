package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.*;

/**
 * CPM y PERT sobre actividades en nodo. Replica redes.js: ES/EF = inicio/terminación más cercanos (IC, TC),
 * LS/LF = más lejanos (IL, TL), holgura total = LS − ES, ruta(s) crítica(s) y, en PERT, la aproximación normal
 * de la ruta crítica de mayor varianza. Las rutas críticas listadas se acotan (pueden ser exponenciales);
 * la de mayor varianza se obtiene por programación dinámica, sin enumerar.
 */
public final class RedesSolver {
    private static final double EPS = 1e-9, MAX = 1e12;
    private static final int MAX_ACT = 80, MAX_RUTAS = 100;
    private RedesSolver() {}

    private record Act(String id, List<String> pred, double dur, double varianza, double a, double m, double b) {}

    /** Resultado del recorrido; los índices son posiciones en la lista de entrada. */
    private record Cpm(int[] orden, int[][] pred, List<List<Integer>> suc, double[] es, double[] ef, double[] ls, double[] lf, double[] holgura, boolean[] crit, double duracion) {
        boolean continua(int a, int s) { return crit[s] && Math.abs(ef[a] - es[s]) < EPS; }

        /** Actividades críticas donde arranca una ruta crítica. */
        List<Integer> inicios() {
            List<Integer> r = new ArrayList<>();
            for (int i : orden) {
                boolean hayCriticaPrevia = false;
                for (int p : pred[i]) hayCriticaPrevia |= crit[p] && Math.abs(ef[p] - es[i]) < EPS;
                if (crit[i] && es[i] == 0 && !hayCriticaPrevia) r.add(i);
            }
            return r;
        }

        /** Rutas críticas en el mismo orden que el JS, hasta MAX_RUTAS; truncada[0] indica que hay más. */
        List<List<Integer>> rutas(boolean[] truncada) {
            List<List<Integer>> rutas = new ArrayList<>();
            for (int i : inicios()) recorrer(i, List.of(), rutas, truncada);
            return rutas;
        }
        private void recorrer(int i, List<Integer> ruta, List<List<Integer>> rutas, boolean[] truncada) {
            if (rutas.size() >= MAX_RUTAS) { truncada[0] = true; return; }
            List<Integer> nueva = new ArrayList<>(ruta); nueva.add(i);
            boolean sigue = false;
            for (int s : suc.get(i)) if (continua(i, s)) { sigue = true; recorrer(s, nueva, rutas, truncada); }
            if (!sigue && Math.abs(ef[i] - duracion) < EPS) rutas.add(nueva);
        }

        /** Ruta crítica de mayor suma de varianzas; en empate la primera en el orden de enumeración. */
        List<Integer> mayorVarianza(double[] varianzas) {
            int n = orden.length;
            double[] mejor = new double[n]; int[] sig = new int[n];
            for (int k = n - 1; k >= 0; k--) {
                int i = orden[k];
                if (!crit[i]) continue;
                sig[i] = -1;
                for (int s : suc.get(i)) if (continua(i, s) && (sig[i] < 0 || mejor[s] > mejor[sig[i]] + 1e-12)) sig[i] = s;
                mejor[i] = varianzas[i] + (sig[i] < 0 ? 0 : mejor[sig[i]]);
            }
            int ini = -1;
            for (int i : inicios()) if (ini < 0 || mejor[i] > mejor[ini] + 1e-12) ini = i;
            List<Integer> ruta = new ArrayList<>();
            for (int i = ini; i >= 0; i = sig[i]) ruta.add(i);
            return ruta;
        }
    }

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        boolean pert = "pert".equals(metodo);
        if (!pert && !"cpm".equals(metodo)) throw new IllegalArgumentException("Método de redes desconocido.");
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indique las actividades del proyecto.");
        List<Act> acts = actividades(datos.path("actividades"), pert);
        Double plazo = pert && datos.hasNonNull("plazo") ? Double.valueOf(numero(datos.get("plazo"), "El plazo")) : null;
        Cpm cpm = calcular(acts);
        int n = acts.size();

        boolean[] truncada = {false};
        List<List<Integer>> rutas = cpm.rutas(truncada);
        double[] varianzas = acts.stream().mapToDouble(Act::varianza).toArray();
        List<Integer> critica = pert ? cpm.mayorVarianza(varianzas) : rutas.isEmpty() ? List.of() : rutas.get(0);

        List<Object> filas = new ArrayList<>(), tabla = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Act a = acts.get(i);
            Map<String, Object> fila = mapa("id", a.id(), "duracion", limpio(a.dur()), "predecesoras", a.pred(), "ES", limpio(cpm.es()[i]), "EF", limpio(cpm.ef()[i]),
                    "LF", limpio(cpm.lf()[i]), "LS", limpio(cpm.ls()[i]), "holgura", limpio(cpm.holgura()[i]), "critica", cpm.crit()[i]);
            if (pert) { fila.put("te", limpio(a.dur())); fila.put("varianza", limpio(a.varianza())); }
            filas.add(fila);
            tabla.add(mapa("actividad", a.id(), "duracion", limpio(a.dur()), "IC", limpio(cpm.es()[i]), "TC", limpio(cpm.ef()[i]), "IL", limpio(cpm.ls()[i]), "TL", limpio(cpm.lf()[i]),
                    "holgura", limpio(cpm.holgura()[i]), "critica", cpm.crit()[i] ? "Sí" : "No"));
        }
        double duracion = limpio(cpm.duracion());
        List<String> rutaCritica = nombres(acts, critica);
        List<List<String>> rutasCriticas = rutas.stream().map(r -> nombres(acts, r)).toList();
        Map<String, Object> resultado = mapa("actividades", filas, "duracion", duracion, "rutaCritica", rutaCritica, "rutasCriticas", rutasCriticas);

        List<IoSolucion.Paso> pasos = new ArrayList<>();
        List<IoSolucion.Metrica> metricas = new ArrayList<>(List.of(new IoSolucion.Metrica("Duración del proyecto", duracion, null)));
        List<String> advertencias = new ArrayList<>();
        if (pert) {
            List<Object> estimaciones = new ArrayList<>();
            for (Act a : acts) estimaciones.add(mapa("actividad", a.id(), "a", a.a(), "m", a.m(), "b", a.b(), "te", limpio(a.dur()), "varianza", limpio(a.varianza())));
            pasos.add(new IoSolucion.Paso("Estimaciones PERT: te = (a + 4m + b)/6 y varianza = ((b − a)/6)².", estimaciones));
        }
        pasos.add(new IoSolucion.Paso("Recorrido hacia adelante y hacia atrás: IC/TC = inicio/terminación más cercanos, IL/TL = más lejanos; holgura = IL − IC. Crítica si la holgura es 0.", tabla));
        pasos.add(new IoSolucion.Paso("Ruta crítica: " + String.join(" → ", rutaCritica) + " (duración " + fmt(duracion) + ")" + (rutasCriticas.size() > 1 ? "; hay " + (truncada[0] ? "más de " : "") + rutasCriticas.size() + " rutas críticas." : "."), null));
        if (truncada[0]) advertencias.add("Hay más de " + MAX_RUTAS + " rutas críticas; se listan las primeras " + MAX_RUTAS + (pert ? " (la de mayor varianza se calcula sobre todas)." : "."));

        if (pert) {
            double varianzaRuta = limpio(critica.stream().mapToDouble(i -> varianzas[i]).sum()), desviacion = limpio(Math.sqrt(varianzaRuta));
            Double z = null, probabilidad = null;
            if (plazo != null) {
                if (desviacion > 0) { double zc = (plazo - cpm.duracion()) / desviacion; z = limpio(zc); probabilidad = limpio(normalCdf(zc)); }
                else {
                    probabilidad = plazo >= cpm.duracion() - EPS ? 1.0 : 0.0;
                    advertencias.add("La desviación de la ruta crítica es 0: la duración es determinista, así que la probabilidad es 0 o 1 y z no está definido.");
                }
            }
            resultado.put("varianzaRuta", varianzaRuta); resultado.put("desviacion", desviacion);
            resultado.put("plazo", plazo == null ? null : limpio(plazo)); resultado.put("z", z); resultado.put("probabilidad", probabilidad);
            metricas.add(new IoSolucion.Metrica("Varianza de ruta crítica", varianzaRuta, null));
            if (probabilidad != null) {
                metricas.add(new IoSolucion.Metrica("Probabilidad de cumplimiento", probabilidad, null));
                pasos.add(new IoSolucion.Paso("Aproximación normal: σ = √" + fmt(varianzaRuta) + " = " + redondeo(desviacion) + (z == null ? "; con σ = 0 la probabilidad es " + fmt(probabilidad) + "."
                        : "; z = (" + fmt(plazo) + " − " + fmt(duracion) + ")/σ = " + redondeo(z) + "; P(T ≤ " + fmt(plazo) + ") = Φ(z) = " + redondeo(probabilidad) + "."), null));
            }
            advertencias.add("PERT usa una aproximación normal de la ruta crítica con tiempos independientes; no garantiza la fecha.");
        }
        return new IoSolucion("redes", metodo, "calculado",
                "Duración del proyecto " + fmt(duracion) + "; ruta crítica " + String.join(" → ", rutaCritica) + ".", metricas, pasos, resultado, advertencias);
    }

    private static List<String> nombres(List<Act> acts, List<Integer> ruta) { return ruta.stream().map(i -> acts.get(i).id()).toList(); }

    private static Cpm calcular(List<Act> acts) {
        int n = acts.size();
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < n; i++) idx.put(acts.get(i).id(), i);
        int[][] pred = new int[n][];
        List<List<Integer>> suc = new ArrayList<>();
        for (int i = 0; i < n; i++) suc.add(new ArrayList<>());
        for (int i = 0; i < n; i++) {
            List<String> ps = acts.get(i).pred();
            pred[i] = new int[ps.size()];
            for (int k = 0; k < ps.size(); k++) {
                Integer p = idx.get(ps.get(k));
                if (p == null) throw new IllegalArgumentException("Predecesora desconocida: " + ps.get(k) + ".");
                pred[i][k] = p; suc.get(p).add(i);
            }
        }
        // Orden topológico por búsqueda en profundidad desde las predecesoras; un nodo "en curso" revisitado es un ciclo.
        int[] estado = new int[n], orden = new int[n], pos = {0};
        for (int i = 0; i < n; i++) visitar(i, acts, pred, estado, orden, pos);
        double[] es = new double[n], ef = new double[n], ls = new double[n], lf = new double[n], holgura = new double[n];
        boolean[] crit = new boolean[n];
        double duracion = 0;
        for (int i : orden) {
            double inicio = 0;
            for (int p : pred[i]) inicio = Math.max(inicio, ef[p]);
            es[i] = inicio; ef[i] = cero(inicio + acts.get(i).dur());
            duracion = Math.max(duracion, ef[i]);
        }
        for (int k = n - 1; k >= 0; k--) {
            int i = orden[k];
            double fin = suc.get(i).isEmpty() ? duracion : Double.POSITIVE_INFINITY;
            for (int s : suc.get(i)) fin = Math.min(fin, ls[s]);
            lf[i] = fin; ls[i] = cero(fin - acts.get(i).dur()); holgura[i] = cero(ls[i] - es[i]); crit[i] = Math.abs(holgura[i]) < EPS;
        }
        return new Cpm(orden, pred, suc, es, ef, ls, lf, holgura, crit, duracion);
    }

    private static void visitar(int i, List<Act> acts, int[][] pred, int[] estado, int[] orden, int[] pos) {
        if (estado[i] == 1) throw new IllegalArgumentException("La red contiene un ciclo en " + acts.get(i).id() + ".");
        if (estado[i] == 2) return;
        estado[i] = 1;
        for (int p : pred[i]) visitar(p, acts, pred, estado, orden, pos);
        estado[i] = 2; orden[pos[0]++] = i;
    }

    private static List<Act> actividades(JsonNode nodo, boolean pert) {
        if (!nodo.isArray() || nodo.isEmpty()) throw new IllegalArgumentException(pert ? "Debe indicar al menos una actividad PERT." : "Debe indicar al menos una actividad.");
        if (nodo.size() > MAX_ACT) throw new IllegalArgumentException("La red admite entre 1 y " + MAX_ACT + " actividades.");
        Set<String> ids = new HashSet<>();
        List<Act> r = new ArrayList<>();
        for (JsonNode a : nodo) {
            JsonNode jid = a.path("id");
            if (!a.isObject() || !jid.isTextual() || jid.asText().isBlank() || jid.asText().length() > 40 || !ids.add(jid.asText()))
                throw new IllegalArgumentException("Cada actividad debe tener un identificador único y no vacío (hasta 40 caracteres).");
            String id = jid.asText();
            JsonNode p = a.path("predecesoras");
            List<String> pred = new ArrayList<>();
            if (!p.isArray() || p.size() > MAX_ACT) throw new IllegalArgumentException("Las predecesoras de " + id + " son inválidas.");
            for (JsonNode x : p) { if (!x.isTextual()) throw new IllegalArgumentException("Las predecesoras de " + id + " son inválidas."); pred.add(x.asText()); }
            if (new HashSet<>(pred).size() != pred.size()) throw new IllegalArgumentException("Las predecesoras de " + id + " son inválidas.");
            if (!pert) { r.add(new Act(id, pred, numero(a.get("duracion"), "La duración"), 0, Double.NaN, Double.NaN, Double.NaN)); continue; }
            double o = numero(a.get("a"), "El tiempo optimista"), m = numero(a.get("m"), "El tiempo probable"), b = numero(a.get("b"), "El tiempo pesimista");
            if (!(o <= m && m <= b)) throw new IllegalArgumentException("En " + id + " debe cumplirse a ≤ m ≤ b.");
            r.add(new Act(id, pred, (o + 4 * m + b) / 6, Math.pow((b - o) / 6, 2), o, m, b));
        }
        return r;
    }

    /** Φ(z) = (1 + erf(z/√2))/2. erf por serie de Taylor si |z/√2| < 3 y fracción continua de erfc después; error absoluto < 1e-12. */
    static double normalCdf(double z) {
        if (Double.isNaN(z)) throw new IllegalArgumentException("z no es un número.");
        if (Double.isInfinite(z)) return z > 0 ? 1 : 0;
        double x = Math.abs(z) / Math.sqrt(2), erfc;
        if (x < 3) {
            double suma = x, termino = x;
            for (int k = 1; k < 200 && Math.abs(termino) > 1e-18; k++) { termino *= -x * x / k; suma += termino / (2 * k + 1); }
            erfc = 1 - 2 / Math.sqrt(Math.PI) * suma;
        } else {
            double f = x;
            for (int k = 60; k >= 1; k--) f = x + k / 2.0 / f;
            erfc = Math.exp(-x * x) / (Math.sqrt(Math.PI) * f);
        }
        return z >= 0 ? 1 - erfc / 2 : erfc / 2;
    }

    private static double numero(JsonNode n, String nombre) {
        if (n == null || !n.isNumber() || !Double.isFinite(n.asDouble()) || n.asDouble() < 0 || n.asDouble() > MAX)
            throw new IllegalArgumentException(nombre + " debe ser un número finito mayor o igual que 0, de hasta 10¹².");
        return n.asDouble();
    }
    private static double cero(double x) { return Math.abs(x) < EPS ? 0.0 : x; }
    private static double limpio(double x) {
        if (!Double.isFinite(x)) throw new IllegalArgumentException("El resultado excede la precisión numérica disponible. Reduce la escala de los datos.");
        return cero(x);
    }
    private static String fmt(double x) { return BigDecimal.valueOf(limpio(x)).round(new MathContext(12)).stripTrailingZeros().toPlainString(); }
    private static String redondeo(double x) { return BigDecimal.valueOf(limpio(x)).setScale(4, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString(); }
    private static Map<String, Object> mapa(Object... kv) {
        Map<String, Object> r = new LinkedHashMap<>();
        for (int k = 0; k < kv.length; k += 2) r.put((String) kv[k], kv[k + 1]);
        return r;
    }
}
