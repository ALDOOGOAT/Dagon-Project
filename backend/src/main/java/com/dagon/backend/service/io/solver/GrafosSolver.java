package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.MathContext;
import java.text.Collator;
import java.util.*;

/**
 * Redes sobre grafos: ruta más corta (Dijkstra), árbol de expansión mínima (Kruskal) y flujo máximo con corte mínimo
 * (Edmonds-Karp). Replica grafos.js, incluido el valor por defecto de "dirigido": falso en ruta_corta y arbol_minimo,
 * verdadero en flujo_maximo. Índices de aristas base 0 sobre la lista de entrada. Hasta 80 aristas.
 */
public final class GrafosSolver {
    private static final int MAX_ARISTAS = 80, MAX_ITER = 20000;
    private static final double EPS = 1e-9, MAX = 1e12, RESIDUAL = 1e-12;
    private static final Collator ES = Collator.getInstance(Locale.forLanguageTag("es"));
    private static final String TROZOS = "(?<=\\d)(?=\\D)|(?<=\\D)(?=\\d)";
    private GrafosSolver() {}

    private record Arista(String origen, String destino, double valor) {}
    private record Arco(int v, double w, int arista) {}

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (!Set.of("ruta_corta", "arbol_minimo", "flujo_maximo").contains(String.valueOf(metodo))) throw new IllegalArgumentException("Método de grafos desconocido.");
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indique las aristas de la red.");
        List<Arista> aristas = aristas(datos.path("aristas"), !metodo.equals("arbol_minimo"));
        List<String> nodos = new ArrayList<>(new LinkedHashSet<>(aristas.stream().flatMap(a -> java.util.stream.Stream.of(a.origen(), a.destino())).toList()));
        nodos.sort(GrafosSolver::natural);
        return switch (metodo) {
            case "ruta_corta" -> rutaCorta(aristas, nodos, nombre(datos, "origen"), nombre(datos, "destino"), dirigido(datos, false));
            case "arbol_minimo" -> arbolMinimo(aristas, nodos);
            default -> flujoMaximo(aristas, nodos, nombre(datos, "origen"), nombre(datos, "destino"), dirigido(datos, true));
        };
    }

    // ---------------- Dijkstra ----------------
    private static IoSolucion rutaCorta(List<Arista> E, List<String> nodos, String origen, String destino, boolean dirigido) {
        int N = nodos.size(), s = nodos.indexOf(origen), t = nodos.indexOf(destino);
        if (s < 0) throw new IllegalArgumentException("El nodo origen no aparece en la red.");
        if (t < 0) throw new IllegalArgumentException("El nodo destino no aparece en la red.");
        List<List<Arco>> ady = new ArrayList<>();
        for (int k = 0; k < N; k++) ady.add(new ArrayList<>());
        for (int i = 0; i < E.size(); i++) {
            int u = nodos.indexOf(E.get(i).origen()), v = nodos.indexOf(E.get(i).destino());
            ady.get(u).add(new Arco(v, E.get(i).valor(), i));
            if (!dirigido) ady.get(v).add(new Arco(u, E.get(i).valor(), i));
        }
        double[] dist = new double[N];
        Arrays.fill(dist, Double.POSITIVE_INFINITY); dist[s] = 0;
        int[] previo = new int[N], via = new int[N];
        Arrays.fill(previo, -1); Arrays.fill(via, -1);
        boolean[] fijo = new boolean[N];
        List<Object> pasos = new ArrayList<>();
        for (int cuenta = 0; cuenta < N; cuenta++) {
            int u = -1;
            for (int k = 0; k < N; k++) if (!fijo[k] && (u < 0 || dist[k] < dist[u])) u = k;
            if (u < 0 || dist[u] == Double.POSITIVE_INFINITY) break;
            fijo[u] = true;
            for (Arco a : ady.get(u)) if (!fijo[a.v()] && dist[u] + a.w() < dist[a.v()] - RESIDUAL) { dist[a.v()] = dist[u] + a.w(); previo[a.v()] = u; via[a.v()] = a.arista(); }
            Map<String, Object> fila = mapa("iteracion", pasos.size() + 1, "nodoFijado", nodos.get(u));
            for (int k = 0; k < N; k++)
                fila.put(nodos.get(k), dist[k] == Double.POSITIVE_INFINITY ? "∞" : fmt(dist[k]) + (previo[k] >= 0 ? " (" + nodos.get(previo[k]) + ")" : "") + (fijo[k] ? " ✓" : ""));
            pasos.add(fila);
            if (u == t) break;
        }
        if (dist[t] == Double.POSITIVE_INFINITY) {
            String mensaje = "No existe una ruta de " + origen + " a " + destino + ".";
            return new IoSolucion("grafos", "ruta_corta", "infactible", mensaje, List.of(), List.of(new IoSolucion.Paso("Etiquetas de Dijkstra por iteración (distancia y predecesor; ✓ = permanente).", pasos)),
                    mapa("distancia", null, "ruta", List.of(), "aristasSolucion", List.of(), "nodos", nodos, "pasos", pasos), List.of(mensaje));
        }
        LinkedList<String> ruta = new LinkedList<>(List.of(destino));
        LinkedList<Integer> elegidas = new LinkedList<>();
        for (int v = t; v != s; v = previo[v]) { elegidas.addFirst(via[v]); ruta.addFirst(nodos.get(previo[v])); }
        double distancia = limpio(dist[t]);
        return new IoSolucion("grafos", "ruta_corta", "optimo", "Distancia mínima " + fmt(distancia) + " por " + String.join(" → ", ruta) + ".",
                List.of(new IoSolucion.Metrica("Distancia mínima", distancia, null)),
                List.of(new IoSolucion.Paso("Ruta: " + String.join(" → ", ruta), null), new IoSolucion.Paso("Etiquetas de Dijkstra por iteración (distancia y predecesor; ✓ = permanente).", pasos)),
                mapa("distancia", distancia, "ruta", ruta, "aristasSolucion", elegidas, "nodos", nodos, "pasos", pasos), List.of("Dijkstra requiere distancias no negativas."));
    }

    // ---------------- Kruskal ----------------
    private static IoSolucion arbolMinimo(List<Arista> E, List<String> nodos) {
        int[] padre = new int[nodos.size()];
        for (int k = 0; k < padre.length; k++) padre[k] = k;
        Integer[] orden = new Integer[E.size()];
        for (int i = 0; i < orden.length; i++) orden[i] = i;
        Arrays.sort(orden, Comparator.<Integer>comparingDouble(i -> E.get(i).valor()).thenComparingInt(i -> i));   // estable por índice
        List<Object> pasos = new ArrayList<>();
        List<Integer> elegidas = new ArrayList<>();
        double total = 0;
        for (int i : orden) {
            Arista a = E.get(i);
            int ra = raiz(padre, nodos.indexOf(a.origen())), rb = raiz(padre, nodos.indexOf(a.destino()));
            boolean acepta = ra != rb;
            if (acepta) { padre[ra] = rb; elegidas.add(i); total += a.valor(); }
            pasos.add(mapa("arista", a.origen() + "–" + a.destino(), "valor", limpio(a.valor()), "decision", acepta ? "Se agrega" : "Se descarta: formaría un ciclo"));
        }
        int componentes = (int) java.util.stream.IntStream.range(0, padre.length).map(k -> raiz(padre, k)).distinct().count();
        total = limpio(total);
        List<String> advertencias = componentes == 1 ? List.of() : List.of("La red no es conexa: se obtuvo un bosque de " + componentes + " componentes.");
        return new IoSolucion("grafos", "arbol_minimo", "optimo",
                componentes == 1 ? "Árbol de expansión mínima de longitud " + fmt(total) + " con " + elegidas.size() + " aristas." : "Bosque de expansión mínima de longitud " + fmt(total) + " con " + elegidas.size() + " aristas.",
                List.of(new IoSolucion.Metrica("Longitud total del árbol", total, null)),
                List.of(new IoSolucion.Paso("Kruskal: aristas en orden creciente; se descarta la que forma ciclo.", pasos)),
                mapa("total", total, "aristasSolucion", elegidas, "nodos", nodos, "pasos", pasos, "conexo", componentes == 1, "componentes", componentes), advertencias);
    }

    // ---------------- Edmonds-Karp ----------------
    private static IoSolucion flujoMaximo(List<Arista> E, List<String> nodos, String origen, String destino, boolean dirigido) {
        int N = nodos.size(), s = nodos.indexOf(origen), t = nodos.indexOf(destino);
        if (s < 0 || t < 0) throw new IllegalArgumentException("La fuente y el sumidero deben aparecer en la red.");
        if (s == t) throw new IllegalArgumentException("La fuente y el sumidero deben ser distintos.");
        double[][] cap = new double[N][N], flujo = new double[N][N];
        for (Arista a : E) {
            int u = nodos.indexOf(a.origen()), v = nodos.indexOf(a.destino());
            cap[u][v] += a.valor();
            if (!dirigido) cap[v][u] += a.valor();
        }
        List<Object> pasos = new ArrayList<>();
        double total = 0;
        for (int iter = 0; ; iter++) {
            if (iter >= MAX_ITER) throw new IllegalArgumentException("Edmonds-Karp excedió el límite de iteraciones.");
            int[] previo = new int[N];
            Arrays.fill(previo, -1); previo[s] = s;
            ArrayDeque<Integer> cola = new ArrayDeque<>(List.of(s));
            while (!cola.isEmpty() && previo[t] < 0) {
                int u = cola.poll();
                for (int v = 0; v < N; v++) if (previo[v] < 0 && cap[u][v] - flujo[u][v] > RESIDUAL) { previo[v] = u; cola.add(v); }
            }
            if (previo[t] < 0) break;
            double cuello = Double.POSITIVE_INFINITY;
            for (int v = t; v != s; v = previo[v]) cuello = Math.min(cuello, cap[previo[v]][v] - flujo[previo[v]][v]);
            LinkedList<String> camino = new LinkedList<>();
            for (int v = t; v != s; v = previo[v]) { flujo[previo[v]][v] += cuello; flujo[v][previo[v]] -= cuello; camino.addFirst(nodos.get(v)); }
            camino.addFirst(origen);
            total += cuello;
            pasos.add(mapa("iteracion", pasos.size() + 1, "caminoAumentante", String.join(" → ", camino), "capacidadResidual", limpio(cuello), "flujoAcumulado", limpio(total)));
        }
        // Corte mínimo: nodos alcanzables desde la fuente en la red residual.
        boolean[] alcanzable = new boolean[N];
        alcanzable[s] = true;
        ArrayDeque<Integer> pila = new ArrayDeque<>(List.of(s));
        while (!pila.isEmpty()) {
            int u = pila.pop();
            for (int v = 0; v < N; v++) if (!alcanzable[v] && cap[u][v] - flujo[u][v] > RESIDUAL) { alcanzable[v] = true; pila.push(v); }
        }
        // Flujo por arista: el flujo neto de cada par se reparte entre sus aristas (paralelas) sin exceder sus capacidades.
        double[][] reparto = new double[N][N];
        for (int i = 0; i < N; i++) for (int j = 0; j < N; j++) reparto[i][j] = dirigido ? Math.max(0, flujo[i][j]) : Math.abs(flujo[i][j]);
        List<Object> flujos = new ArrayList<>();
        List<Integer> corte = new ArrayList<>(), conFlujo = new ArrayList<>();
        for (int i = 0; i < E.size(); i++) {
            Arista a = E.get(i);
            int u = nodos.indexOf(a.origen()), v = nodos.indexOf(a.destino()), p = dirigido ? u : Math.min(u, v), q = dirigido ? v : Math.max(u, v);
            double f = Math.min(a.valor(), reparto[p][q]);
            reparto[p][q] -= f;
            flujos.add(mapa("arista", a.origen() + "→" + a.destino(), "capacidad", limpio(a.valor()), "flujo", limpio(f)));
            if (limpio(f) > 0) conFlujo.add(i);
            if (dirigido ? alcanzable[u] && !alcanzable[v] : alcanzable[u] != alcanzable[v]) corte.add(i);
        }
        List<String> ladoFuente = new ArrayList<>();
        for (int k = 0; k < N; k++) if (alcanzable[k]) ladoFuente.add(nodos.get(k));
        double flujoMaximo = limpio(total);
        return new IoSolucion("grafos", "flujo_maximo", "optimo", "Flujo máximo " + fmt(flujoMaximo) + " de " + origen + " a " + destino + ".",
                List.of(new IoSolucion.Metrica("Flujo máximo", flujoMaximo, null)),
                List.of(new IoSolucion.Paso("Caminos aumentantes (Edmonds-Karp).", pasos), new IoSolucion.Paso("Flujo final por arista.", flujos),
                        new IoSolucion.Paso("Corte mínimo: lado de la fuente {" + String.join(", ", ladoFuente) + "}. Su capacidad iguala al flujo máximo.", null)),
                mapa("flujoMaximo", flujoMaximo, "flujos", flujos, "corteMinimo", corte, "ladoFuente", ladoFuente, "nodos", nodos, "pasos", pasos, "aristasSolucion", conFlujo), List.of());
    }

    // ---------------- lectura y utilidades ----------------
    private static List<Arista> aristas(JsonNode nodo, boolean noNegativo) {
        if (!nodo.isArray() || nodo.isEmpty() || nodo.size() > MAX_ARISTAS) throw new IllegalArgumentException("Indique entre 1 y " + MAX_ARISTAS + " aristas.");
        List<Arista> r = new ArrayList<>();
        for (JsonNode a : nodo) {
            if (!a.path("origen").isTextual() || !a.path("destino").isTextual() || a.get("origen").asText().isBlank() || a.get("destino").asText().isBlank())
                throw new IllegalArgumentException("Cada arista requiere origen y destino.");
            String o = a.get("origen").asText(), d = a.get("destino").asText();
            if (o.length() > 30 || d.length() > 30) throw new IllegalArgumentException("Los nombres de nodo admiten hasta 30 caracteres.");
            if (o.equals(d)) throw new IllegalArgumentException("La arista " + o + "→" + d + " no puede unir un nodo consigo mismo.");
            JsonNode x = a.get("valor");
            if (x == null || !x.isNumber() || !Double.isFinite(x.asDouble()) || Math.abs(x.asDouble()) > MAX || (noNegativo && x.asDouble() < 0))
                throw new IllegalArgumentException("El valor de " + o + "→" + d + " debe ser un número finito" + (noNegativo ? " mayor o igual que 0" : "") + ", de hasta 10¹² en valor absoluto.");
            r.add(new Arista(o, d, x.asDouble()));
        }
        return r;
    }
    private static String nombre(JsonNode datos, String clave) { return datos.path(clave).isTextual() ? datos.get(clave).asText() : null; }
    private static boolean dirigido(JsonNode datos, boolean defecto) {
        JsonNode n = datos.get("dirigido");
        if (n == null || n.isNull()) return defecto;
        if (!n.isBoolean()) throw new IllegalArgumentException("Indique si la red es dirigida (verdadero o falso).");
        return n.asBoolean();
    }
    private static int raiz(int[] padre, int k) { return padre[k] == k ? k : (padre[k] = raiz(padre, padre[k])); }

    /** Orden de nombres como localeCompare('es', {numeric:true}): texto por intercalación española y bloques de dígitos por valor (N2 < N10). */
    private static int natural(String a, String b) {
        String[] x = a.split(TROZOS), y = b.split(TROZOS);
        for (int k = 0; k < Math.min(x.length, y.length); k++) {
            int c = esNumero(x[k]) && esNumero(y[k]) ? new BigInteger(x[k]).compareTo(new BigInteger(y[k])) : ES.compare(x[k], y[k]);
            if (c != 0) return c;
        }
        return x.length != y.length ? Integer.compare(x.length, y.length) : a.compareTo(b);
    }
    private static boolean esNumero(String s) { return !s.isEmpty() && s.chars().allMatch(c -> c >= '0' && c <= '9'); }

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
