package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;
import java.util.function.DoubleUnaryOperator;

/**
 * Inventarios deterministas: EOQ, faltantes planeados, EPQ, descuentos por cantidad, punto de reorden y período fijo.
 * D, P, S y H usan un año como unidad; sigma es la desviación de la demanda por unidad de tiempo (ver lib/io/README.md).
 */
public final class InventarioSolver {
    private InventarioSolver() {}
    private static final double MAX = 1e12;
    private static final String ANUAL = "D y P usan un año; S es costo por pedido y H costo por unidad al año.";
    private static final String ESTOCASTICO = "Demanda por período y tiempos deben usar la misma unidad; sigma supone demandas independientes.";

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indica los parámetros del inventario.");
        if (metodo == null) throw new IllegalArgumentException("Indica el método de inventarios.");
        return switch (metodo) {
            case "eoq" -> eoq(datos);
            case "faltantes" -> faltantes(datos);
            case "epq" -> epq(datos);
            case "descuentos" -> descuentos(datos);
            case "reorden" -> reorden(datos);
            case "periodo_fijo" -> periodoFijo(datos);
            default -> throw new IllegalArgumentException("Método de inventarios no soportado: " + metodo + ".");
        };
    }

    private static IoSolucion eoq(JsonNode d) {
        double D = num(d, "D", "La demanda anual D", 0, true), S = num(d, "S", "El costo por pedido S", 0, true), H = num(d, "H", "El costo de mantener H", 0, true);
        double Q = Math.sqrt(2 * D * S / H), costo = D * S / Q + H * Q / 2;
        var r = mapa("Q", Q, "N", D / Q, "T", Q / D, "costoTotal", costo, "curva", curva(Q, q -> D * S / q, q -> H * q / 2));
        return sol("eoq", "Lote económico Q* = " + fmt(Q) + " unidades por pedido; costo total anual " + fmt(costo) + ".",
                List.of(m("Cantidad de pedido (Q*)", Q, "unidades"), m("Pedidos por año (N)", D / Q, "pedidos/año"), m("Tiempo de ciclo (T)", Q / D, "años"), m("Costo total", costo, "costo/año")),
                List.of(paso("Lote económico: Q* = √(2·D·S/H) = √(2·%s·%s/%s) = %s.", D, S, H, Q),
                        paso("Pedidos por año N = D/Q* = %s/%s = %s; tiempo de ciclo T = Q*/D = %s/%s = %s años.", D, Q, D / Q, Q, D, Q / D),
                        paso("Costo anual: CT = D·S/Q* + H·Q*/2 = %s·%s/%s + %s·%s/2 = %s + %s = %s.", D, S, Q, H, Q, D * S / Q, H * Q / 2, costo)), r, ANUAL);
    }

    private static IoSolucion faltantes(JsonNode d) {
        double D = num(d, "D", "La demanda anual D", 0, true), S = num(d, "S", "El costo por pedido S", 0, true), H = num(d, "H", "El costo de mantener H", 0, true), p = num(d, "p", "El costo por faltante p", 0, true);
        double Q = Math.sqrt(2 * D * S * (H + p) / (H * p)), imax = Q * p / (H + p), bmax = Q * H / (H + p);
        double cMantener = H * imax * imax / (2 * Q), cFaltantes = p * bmax * bmax / (2 * Q), costo = D * S / Q + cMantener + cFaltantes;
        var r = mapa("Q", Q, "N", D / Q, "T", Q / D, "inventarioMaximo", imax, "faltanteMaximo", bmax, "costoMantener", cMantener, "costoFaltantes", cFaltantes,
                "costoTotal", costo, "curva", curva(Q, q -> D * S / q, q -> H * p * q / (2 * (H + p))));
        return sol("faltantes", "Lote con faltantes planeados Q* = " + fmt(Q) + " unidades; inventario máximo " + fmt(imax) + " y faltante máximo " + fmt(bmax) + "; costo total anual " + fmt(costo) + ".",
                List.of(m("Cantidad de pedido (Q*)", Q, "unidades"), m("Pedidos por año (N)", D / Q, "pedidos/año"), m("Tiempo de ciclo (T)", Q / D, "años"), m("Costo total", costo, "costo/año"),
                        m("Inventario máximo", imax, "unidades"), m("Faltante máximo", bmax, "unidades")),
                List.of(paso("Lote con faltantes planeados (p = costo anual por unidad faltante): Q* = √(2·D·S·(H+p)/(H·p)) = √(2·%s·%s·(%s+%s)/(%s·%s)) = %s.", D, S, H, p, H, p, Q),
                        paso("Inventario máximo I = p·Q*/(H+p) = %s·%s/(%s+%s) = %s; faltante máximo B = H·Q*/(H+p) = %s·%s/(%s+%s) = %s.", p, Q, H, p, imax, H, Q, H, p, bmax),
                        paso("Costo anual: CT = D·S/Q* + (H·I² + p·B²)/(2·Q*) = %s + %s + %s = %s.", D * S / Q, cMantener, cFaltantes, costo)), r, ANUAL);
    }

    private static IoSolucion epq(JsonNode d) {
        double D = num(d, "D", "La demanda anual D", 0, true), S = num(d, "S", "El costo por pedido S", 0, true), H = num(d, "H", "El costo de mantener H", 0, true), P = num(d, "P", "La producción anual P", 0, true);
        if (P <= D) throw new IllegalArgumentException("La producción anual P debe ser mayor que la demanda D.");
        double f = 1 - D / P, Q = Math.sqrt(2 * D * S / (H * f)), imax = Q * f, costo = D * S / Q + H * imax / 2;
        var r = mapa("Q", Q, "N", D / Q, "T", Q / D, "inventarioMaximo", imax, "tiempoProduccion", Q / P, "costoTotal", costo, "curva", curva(Q, q -> D * S / q, q -> H * q * f / 2));
        return sol("epq", "Lote de producción Q* = " + fmt(Q) + " unidades; inventario máximo " + fmt(imax) + "; costo total anual " + fmt(costo) + ".",
                List.of(m("Cantidad de pedido (Q*)", Q, "unidades"), m("Pedidos por año (N)", D / Q, "pedidos/año"), m("Tiempo de ciclo (T)", Q / D, "años"), m("Costo total", costo, "costo/año"), m("Inventario máximo", imax, "unidades")),
                List.of(paso("Lote de producción económica: Q* = √(2·D·S/(H·(1−D/P))) = √(2·%s·%s/(%s·(1−%s/%s))) = %s.", D, S, H, D, P, Q),
                        paso("Inventario máximo Imax = Q*·(1−D/P) = %s·%s = %s; tiempo de producción Q*/P = %s/%s = %s años.", Q, f, imax, Q, P, Q / P),
                        paso("Costo anual: CT = D·S/Q* + H·Imax/2 = %s + %s = %s.", D * S / Q, H * imax / 2, costo)), r, ANUAL);
    }

    /** Precio de todas las unidades: se calcula el lote de cada tramo, se sube al mínimo si hace falta y se descartan los que exceden el tramo. */
    private static IoSolucion descuentos(JsonNode d) {
        double D = num(d, "D", "La demanda anual D", 0, true), S = num(d, "S", "El costo por pedido S", 0, true), i = num(d, "i", "La tasa de mantenimiento i", 0, true);
        JsonNode tr = d.path("tramos");
        if (!tr.isArray() || tr.isEmpty() || tr.size() > 30) throw new IllegalArgumentException("Indica de 1 a 30 tramos de precio.");
        int n = tr.size(); double[] min = new double[n], precio = new double[n];
        for (int k = 0; k < n; k++) {
            if (!tr.get(k).isObject()) throw new IllegalArgumentException("Tramo inválido.");
            min[k] = num(tr.get(k), "min", "La cantidad mínima del tramo", 0, false); precio[k] = num(tr.get(k), "precio", "El precio del tramo", 0, true);
            if (k > 0 && min[k] <= min[k - 1]) throw new IllegalArgumentException("Los mínimos de los tramos deben ser estrictamente crecientes.");
            if (k > 0 && precio[k] > precio[k - 1]) throw new IllegalArgumentException("Los precios de descuento deben ser no crecientes.");
        }
        record Cand(double Q, double precio, double H, double costo) {}
        var cand = new ArrayList<Cand>(); var pasos = new ArrayList<IoSolucion.Paso>();
        for (int k = 0; k < n; k++) {
            double H = i * precio[k], ideal = Math.sqrt(2 * D * S / H), Q = Math.max(ideal, min[k]), sup = k + 1 < n ? min[k + 1] : Double.POSITIVE_INFINITY;
            lim(ideal); // un lote infinito se rechaza aquí, no como "sin tramo factible"
            double costo = D * precio[k] + D * S / Q + H * Q / 2;
            String cabecera = String.format("Tramo %d (desde %s unidades, precio %s): H = i·p = %s·%s = %s; Q ideal = √(2·D·S/H) = %s", k + 1, fmt(min[k]), fmt(precio[k]), fmt(i), fmt(precio[k]), fmt(H), fmt(ideal));
            if (Q < sup) {
                cand.add(new Cand(Q, precio[k], H, costo));
                pasos.add(new IoSolucion.Paso(cabecera + "; Q = máx(Q ideal, mínimo) = " + fmt(Q) + " es factible. CT = D·p + D·S/Q + H·Q/2 = " + fmt(D * precio[k]) + " + " + fmt(D * S / Q) + " + " + fmt(H * Q / 2) + " = " + fmt(costo) + ".", null));
            } else pasos.add(new IoSolucion.Paso(cabecera + "; el lote " + fmt(Q) + " alcanza el tramo siguiente (desde " + fmt(sup) + "), así que se descarta.", null));
        }
        if (cand.isEmpty()) throw new IllegalArgumentException("No existe un lote factible para los tramos indicados.");
        cand.sort(Comparator.comparingDouble(Cand::costo)); // estable: en empate gana el tramo de menor cantidad
        var mejor = cand.get(0);
        var candidatos = cand.stream().map(c -> mapa("Q", c.Q(), "precio", c.precio(), "H", c.H(), "costoTotal", c.costo())).toList();
        var curva = new ArrayList<Map<String, Object>>();
        for (int j = 0; j <= 40; j++) {
            double q = Math.max(min[0], mejor.Q() * (0.25 + j * 1.75 / 40)); int t = 0;
            while (t + 1 < n && q >= min[t + 1]) t++;
            double ordenar = D * S / q, mantener = i * precio[t] * q / 2;
            curva.add(mapa("q", q, "ordenar", ordenar, "mantener", mantener, "total", D * precio[t] + ordenar + mantener));
        }
        pasos.add(new IoSolucion.Paso("Se elige el candidato de menor costo total: precio " + fmt(mejor.precio()) + ", Q = " + fmt(mejor.Q()) + ", CT = " + fmt(mejor.costo()) + ".", candidatos));
        var r = mapa("Q", mejor.Q(), "precio", mejor.precio(), "H", mejor.H(), "costoTotal", mejor.costo(), "N", D / mejor.Q(), "T", mejor.Q() / D, "candidatos", candidatos, "curva", curva);
        return sol("descuentos", "Con el precio " + fmt(mejor.precio()) + " conviene pedir Q = " + fmt(mejor.Q()) + " unidades; costo total anual " + fmt(mejor.costo()) + " (incluye la compra).",
                List.of(m("Cantidad de pedido (Q*)", mejor.Q(), "unidades"), m("Pedidos por año (N)", D / mejor.Q(), "pedidos/año"), m("Período (T)", mejor.Q() / D, "años"),
                        m("Costo total", mejor.costo(), "costo/año"), m("Precio unitario", mejor.precio(), null)),
                pasos, r, "Descuento sobre todas las unidades (no incremental). " + ANUAL);
    }

    private static IoSolucion reorden(JsonNode d) {
        double dem = num(d, "d", "La demanda por unidad de tiempo d", 0, false), L = num(d, "L", "El tiempo de entrega L", 0, false);
        double sigma = opt(d, "sigma", "La desviación de la demanda sigma", 0), z = opt(d, "z", "El factor de servicio z", 0);
        double ss = z * sigma * Math.sqrt(L), dl = dem * L, R = dl + ss;
        var r = mapa("R", R, "puntoReorden", R, "stockSeguridad", ss, "demandaDuranteEntrega", dl);
        return sol("reorden", "Punto de reorden R = " + fmt(R) + " unidades (inventario de seguridad " + fmt(ss) + ").",
                List.of(m("Punto de reorden (R)", R, "unidades"), m("Stock de seguridad", ss, "unidades")),
                List.of(paso("Demanda durante la entrega: d·L = %s·%s = %s.", dem, L, dl),
                        paso("Stock de seguridad = z·σ·√L = %s·%s·√%s = %s.", z, sigma, L, ss),
                        paso("Punto de reorden: R = d·L + z·σ·√L = %s + %s = %s.", dl, ss, R)), r, ESTOCASTICO);
    }

    private static IoSolucion periodoFijo(JsonNode d) {
        double dem = num(d, "d", "La demanda d", 0, false), T = num(d, "T", "El período de revisión T", 0, true), L = num(d, "L", "El tiempo de entrega L", 0, false);
        double sigma = num(d, "sigma", "La desviación sigma", 0, false), z = num(d, "z", "El factor de servicio z", 0, false), inv = num(d, "inventario", "La posición de inventario", -MAX, false);
        double ss = z * sigma * Math.sqrt(T + L), M = dem * (T + L) + ss, Q = Math.max(0, M - inv);
        var r = mapa("Q", Q, "T", T, "stockSeguridad", ss, "nivelObjetivo", M);
        return sol("periodo_fijo", "Nivel objetivo M = " + fmt(M) + "; con la posición de inventario " + fmt(inv) + " se pide Q = " + fmt(Q) + " unidades.",
                List.of(m("Cantidad de pedido (Q)", Q, "unidades"), m("Período (T)", T, null), m("Stock de seguridad", ss, "unidades"), m("Nivel objetivo (M)", M, "unidades")),
                List.of(paso("Stock de seguridad = z·σ·√(T+L) = %s·%s·√(%s+%s) = %s.", z, sigma, T, L, ss),
                        paso("Nivel objetivo: M = d·(T+L) + z·σ·√(T+L) = %s·(%s+%s) + %s = %s.", dem, T, L, ss, M),
                        paso("Pedido: Q = máx(0, M − I) = máx(0, %s − %s) = %s (I = existencias + pedidos − faltantes).", M, inv, Q)), r, ESTOCASTICO);
    }

    // --- utilidades ---
    private static IoSolucion sol(String metodo, String resumen, List<IoSolucion.Metrica> metricas, List<IoSolucion.Paso> pasos, Map<String, Object> resultado, String advertencia) {
        return new IoSolucion("inventarios", metodo, "calculado", resumen, metricas, pasos, resultado, List.of(advertencia));
    }
    private static List<Map<String, Object>> curva(double Q, DoubleUnaryOperator ordenar, DoubleUnaryOperator mantener) {
        var c = new ArrayList<Map<String, Object>>();
        for (int j = 0; j <= 40; j++) { double q = Q * (0.25 + j * 1.75 / 40), o = ordenar.applyAsDouble(q), h = mantener.applyAsDouble(q); c.add(mapa("q", q, "ordenar", o, "mantener", h, "total", o + h)); }
        return c;
    }
    private static IoSolucion.Metrica m(String etiqueta, double valor, String unidad) { return new IoSolucion.Metrica(etiqueta, lim(valor), unidad); }
    private static IoSolucion.Paso paso(String plantilla, double... x) { return new IoSolucion.Paso(String.format(plantilla, Arrays.stream(x).mapToObj(InventarioSolver::fmt).toArray()), null); }
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
    private static double num(JsonNode d, String clave, String nombre, double min, boolean estricto) {
        JsonNode n = d.path(clave); double x = n.asDouble();
        if (!n.isNumber() || !Double.isFinite(x) || Math.abs(x) > MAX || (estricto ? x <= min : x < min))
            throw new IllegalArgumentException(nombre + " debe ser un número " + (estricto ? "mayor que " : "mayor o igual que ") + fmt(min) + " y no exceder " + fmt(MAX) + " en valor absoluto.");
        return x;
    }
    private static double opt(JsonNode d, String clave, String nombre, double defecto) {
        return d.path(clave).isMissingNode() || d.path(clave).isNull() ? defecto : num(d, clave, nombre, 0, false);
    }
}
