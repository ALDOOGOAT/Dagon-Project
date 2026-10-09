package com.dagon.backend.service.io.solver;

import static com.dagon.backend.service.io.solver.ModeloPL.limpio;
import static com.dagon.backend.service.io.solver.ModeloPL.num;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;

/**
 * Programación entera, binaria y mixta por ramificación y acotamiento sobre SimplexSolver.
 * Profundidad primero (rama ≤ antes que ≥), variable más fraccionaria. Nunca redondea la relajación: cada subproblema añade cotas.
 */
public final class EnteroSolver {
    private EnteroSolver() {}
    static final int MAX_NODOS = 3000;
    static final double TOL = 1e-6;
    static final long MAX_NANOS = 15_000_000_000L; // tope de tiempo para modelos grandes; el de nodos manda en los pequeños

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!"branch_bound".equals(metodo)) throw new IllegalArgumentException("Método de PL no soportado: " + metodo + ".");
        return resolver(ModeloPL.parsear(datos));
    }

    private record Nodo(int padre, String rama, int profundidad, double[] lb, double[] ub) {}

    static IoSolucion resolver(ModeloPL m) {
        Set<String> enteras = new LinkedHashSet<>(m.enteras()); enteras.addAll(m.binarias());
        if (enteras.isEmpty()) throw new IllegalArgumentException("Indique al menos una variable entera o binaria.");
        int n = m.n(), signo = m.max() ? 1 : -1;
        int[] idx = enteras.stream().mapToInt(m.variables()::indexOf).sorted().toArray();
        double[] lb0 = new double[n], ub0 = new double[n]; Arrays.fill(ub0, Double.POSITIVE_INFINITY);
        for (String b : m.binarias()) ub0[m.variables().indexOf(b)] = 1; // binaria = entera con 0 <= y <= 1
        Deque<Nodo> pila = new ArrayDeque<>(); pila.push(new Nodo(-1, "Relajación lineal (P0)", 0, lb0, ub0));
        List<Map<String, Object>> nodos = new ArrayList<>();
        SimplexSolver.Resultado relajacion = null;
        double[] mejorX = null; double mejorZ = Double.NaN; int mejorNodo = -1;
        boolean noAcotado = false, limite = false; long inicio = System.nanoTime();

        while (!pila.isEmpty()) {
            if (nodos.size() >= MAX_NODOS || System.nanoTime() - inicio > MAX_NANOS) { limite = true; break; }
            Nodo nd = pila.pop(); int id = nodos.size();
            var r = SimplexSolver.resolver(conCotas(m, nd.lb(), nd.ub()), id == 0);
            Map<String, Object> nodo = new LinkedHashMap<>();
            nodo.put("id", id); nodo.put("padre", nd.padre() < 0 ? null : nd.padre()); nodo.put("rama", nd.rama()); nodo.put("profundidad", nd.profundidad());
            nodo.put("estado", r.estado()); nodo.put("z", Double.isNaN(r.z()) ? null : limpio(r.z())); nodo.put("x", SimplexSolver.mapaVariables(m.variables(), r.x()));
            nodos.add(nodo);
            if (id == 0) relajacion = r;
            if (r.estado().equals("infactible")) { nodo.put("decision", "Podado: subproblema infactible"); continue; }
            if (r.estado().equals("no_acotado")) { nodo.put("decision", "Relajación no acotada"); noAcotado = true; break; }
            if (mejorX != null && signo * r.z() <= signo * mejorZ + TOL) {
                nodo.put("decision", "Podado por cota: Z = " + num(r.z()) + " no mejora la incumbente " + num(mejorZ)); continue;
            }
            int j = -1; double distancia = 0; // variable más fraccionaria (la más cercana a .5)
            for (int k : idx) {
                double v = r.x()[k], d = Math.min(v - Math.floor(v), Math.ceil(v) - v);
                if (d > TOL && d > distancia) { distancia = d; j = k; }
            }
            if (j < 0) {
                double[] x = r.x().clone(); for (int k : idx) x[k] = Math.rint(x[k]); // solo limpia ruido numérico < TOL
                double z = 0; for (int k = 0; k < n; k++) z += m.c()[k] * x[k];
                nodo.put("decision", "Solución entera factible: nueva incumbente"); nodo.put("incumbente", true);
                mejorX = x; mejorZ = z; mejorNodo = id; continue;
            }
            double v = r.x()[j]; String var = m.variables().get(j);
            double piso = Math.floor(v + TOL), techo = Math.ceil(v - TOL);
            nodo.put("decision", "Ramificar en " + var + " = " + num(v)); nodo.put("ramificaEn", var);
            double[] ubIzq = nd.ub().clone(), lbDer = nd.lb().clone(); ubIzq[j] = piso; lbDer[j] = techo;
            pila.push(new Nodo(id, var + " ≥ " + num(techo), nd.profundidad() + 1, lbDer, nd.ub()));
            pila.push(new Nodo(id, var + " ≤ " + num(piso), nd.profundidad() + 1, nd.lb(), ubIzq)); // se explora primero
        }
        for (Map<String, Object> nodo : nodos) nodo.putIfAbsent("decision", "");
        if (mejorNodo >= 0) nodos.get(mejorNodo).put("optimo", true);
        if (limite && mejorX == null) throw new IllegalArgumentException("La ramificación superó el límite de " + nodos.size() + " subproblemas (o de tiempo) sin hallar una solución entera factible. Simplifique el modelo o acote las variables.");
        String estado = noAcotado ? "no_acotado" : mejorX == null ? "infactible" : limite ? "limite" : "optimo";
        return presentar(m, enteras, estado, mejorX, mejorZ, relajacion, nodos);
    }

    /** Modelo del nodo: el original más x >= lb (si lb > 0) y x <= ub (si es finita) para cada variable. */
    private static ModeloPL conCotas(ModeloPL m, double[] lb, double[] ub) {
        int n = m.n(), mf = m.A().length, extra = 0;
        for (int j = 0; j < n; j++) extra += (lb[j] > 0 ? 1 : 0) + (Double.isFinite(ub[j]) ? 1 : 0);
        double[][] A = Arrays.copyOf(m.A(), mf + extra); String[] ops = Arrays.copyOf(m.ops(), mf + extra); double[] b = Arrays.copyOf(m.b(), mf + extra);
        int p = mf;
        for (int j = 0; j < n; j++) {
            if (lb[j] > 0) { A[p] = unidad(n, j); ops[p] = ">="; b[p++] = lb[j]; }
            if (Double.isFinite(ub[j])) { A[p] = unidad(n, j); ops[p] = "<="; b[p++] = ub[j]; }
        }
        return new ModeloPL(m.max(), m.variables(), m.c(), A, ops, b, m.enteras(), m.binarias());
    }
    private static double[] unidad(int n, int j) { double[] f = new double[n]; f[j] = 1; return f; }

    private static IoSolucion presentar(ModeloPL m, Set<String> enteras, String estado, double[] x, double z, SimplexSolver.Resultado rel, List<Map<String, Object>> nodos) {
        boolean hay = x != null;
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("estado", estado); res.put("sentido", m.max() ? "max" : "min"); res.put("z", hay ? (Object) limpio(z) : null);
        res.put("x", SimplexSolver.mapaVariables(m.variables(), hay ? x : new double[m.n()]));
        Map<String, Object> holguras = new LinkedHashMap<>();
        if (hay) for (int i = 0; i < m.A().length; i++) {
            double ax = 0; for (int j = 0; j < m.n(); j++) ax += m.A()[i][j] * x[j];
            holguras.put((m.ops()[i].equals(">=") ? "e_" : "s_") + (i + 1), limpio(m.ops()[i].equals(">=") ? ax - m.b()[i] : m.b()[i] - ax));
        }
        res.put("holguras", holguras); res.put("enteras", List.copyOf(enteras)); res.put("binarias", List.copyOf(m.binarias()));
        Map<String, Object> relajada = new LinkedHashMap<>();
        relajada.put("estado", rel.estado()); relajada.put("z", Double.isNaN(rel.z()) ? null : limpio(rel.z()));
        relajada.put("x", SimplexSolver.mapaVariables(m.variables(), rel.x())); relajada.put("tablas", rel.tablas());
        res.put("relajacion", relajada);
        res.put("brecha", hay && !Double.isNaN(rel.z()) ? (Object) limpio(Math.abs(rel.z() - z)) : null);
        res.put("nodos", nodos); res.put("explorados", nodos.size());

        List<IoSolucion.Metrica> metricas = new ArrayList<>(); StringBuilder valores = new StringBuilder();
        if (hay) {
            for (int j = 0; j < m.n(); j++) { metricas.add(new IoSolucion.Metrica(m.variables().get(j), limpio(x[j]), null)); valores.append(j > 0 ? ", " : "").append(m.variables().get(j)).append(" = ").append(num(x[j])); }
            metricas.add(new IoSolucion.Metrica("Valor objetivo Z (entero)", limpio(z), null));
            if (!Double.isNaN(rel.z())) metricas.add(new IoSolucion.Metrica("Cota de la relajación lineal", limpio(rel.z()), null));
            metricas.add(new IoSolucion.Metrica("Subproblemas explorados", nodos.size(), null));
        }
        List<Map<String, Object>> arbol = new ArrayList<>();
        for (Map<String, Object> n : nodos) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("nodo", "P" + n.get("id")); f.put("padre", n.get("padre") == null ? "—" : "P" + n.get("padre")); f.put("rama", n.get("rama"));
            f.put("Z", n.get("z") == null ? "—" : n.get("z"));
            f.put("solucion", n.get("estado").equals("infactible") ? "infactible" : solucion(m, n));
            f.put("decision", n.get("decision")); arbol.add(f);
        }
        Object ultimaTabla = rel.tablas().isEmpty() ? null : rel.tablas().get(rel.tablas().size() - 1);
        List<IoSolucion.Paso> pasos = List.of(
                new IoSolucion.Paso("Relajación lineal P0: se resuelve el modelo sin exigir enteros; su Z es la cota inicial.", ultimaTabla),
                new IoSolucion.Paso("Árbol de ramificación y acotamiento (cada nodo agrega una cota a su padre).", arbol));
        List<String> advertencias = new ArrayList<>(List.of("El óptimo entero se obtuvo por branch & bound: no se redondeó la relajación."));
        if (estado.equals("limite")) advertencias.add("Se alcanzó el límite de " + nodos.size() + " subproblemas (o de tiempo): la solución mostrada es la mejor encontrada, sin garantía de óptimo.");
        if (estado.equals("no_acotado")) advertencias.add("La relajación lineal no está acotada; revise si falta una restricción.");
        String resumen = switch (estado) {
            case "optimo" -> "Óptimo entero: Z = " + num(z) + " con " + valores + " (" + nodos.size() + " subproblemas explorados).";
            case "limite" -> "Mejor solución entera encontrada: Z = " + num(z) + " con " + valores + ", sin garantía de optimalidad.";
            case "infactible" -> "Ninguna combinación de valores enteros cumple las restricciones.";
            default -> "La relajación lineal no está acotada con estas restricciones.";
        };
        return new IoSolucion("pl", "branch_bound", estado.equals("limite") ? "aproximado" : estado, resumen, metricas, pasos, res, advertencias);
    }

    @SuppressWarnings("unchecked")
    private static String solucion(ModeloPL m, Map<String, Object> nodo) {
        Map<String, Object> x = (Map<String, Object>) nodo.get("x"); StringBuilder s = new StringBuilder();
        for (String v : m.variables()) s.append(s.length() > 0 ? ", " : "").append(v).append("=").append(num(((Number) x.get(v)).doubleValue()));
        return s.toString();
    }
}
