package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.MathContext;
import java.util.*;

/**
 * Colas M/M/1 y M/M/s en régimen estacionario. lambda y mu comparten unidad de tiempo; mu es la tasa de cada servidor.
 * M/M/1 es el caso s = 1. Erlang B por recurrencia y P0 en escala logarítmica: sin factoriales, estable hasta 1000 servidores.
 */
public final class ColasSolver {
    private ColasSolver() {}
    private static final double MAX = 1e12;
    private static final int MAX_S = 1000, N_PN = 16;

    public static IoSolucion resolver(String metodo, JsonNode datos) {
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Indica los parámetros de la cola.");
        if (metodo == null || !Set.of("mm1", "mms").contains(metodo)) throw new IllegalArgumentException("Método de colas no soportado: " + metodo + ".");
        boolean mm1 = metodo.equals("mm1");
        double lambda = num(datos, "lambda", "La tasa de llegadas lambda", 0, false), mu = num(datos, "mu", "La tasa de servicio mu", 0, true);
        int s = 1;
        if (!mm1) {
            JsonNode n = datos.path("s");
            if (!n.isNumber() || n.asDouble() != Math.rint(n.asDouble()) || n.asDouble() < 1 || n.asDouble() > MAX_S) throw new IllegalArgumentException("El número de servidores s debe ser un entero entre 1 y " + MAX_S + ".");
            s = n.asInt();
        } else if (tiene(datos, "s") && datos.path("s").asDouble() != 1) throw new IllegalArgumentException("M/M/1 requiere un solo servidor.");
        boolean costos = tiene(datos, "cs");
        if (costos != tiene(datos, "cw")) throw new IllegalArgumentException("Indica ambos costos cs y cw para calcular el costo total.");
        double cs = costos ? num(datos, "cs", "El costo por servidor cs", 0, false) : 0, cw = costos ? num(datos, "cw", "El costo por cliente en el sistema cw", 0, false) : 0;
        if (lambda >= s * mu) throw new IllegalArgumentException("La cola es inestable: λ debe ser menor que " + (mm1 ? "μ" : "s·μ") + " (ρ < 1); no existe régimen estacionario.");

        double a = lambda / mu, rho = a / s;
        double B = 1; // Erlang B: B_k = a·B_(k-1) / (k + a·B_(k-1))
        for (int k = 1; k <= s; k++) B = a * B / (k + a * B);
        double Pw = a == 0 ? 0 : B / (1 - rho + rho * B), Lq = Pw * rho / (1 - rho), Wq = lambda == 0 ? 0 : Lq / lambda, W = Wq + 1 / mu, L = Lq + a;
        // P0 = 1 / (Σ_{k<s} a^k/k! + a^s/(s!(1-rho))), sumado con log-suma-exp
        double logTermino = 0, logSuma = 0;
        for (int k = 1; k <= s; k++) {
            logTermino += Math.log(a) - Math.log(k);
            double x = logTermino - (k == s ? Math.log1p(-rho) : 0), mx = Math.max(logSuma, x);
            logSuma = mx + Math.log(Math.exp(logSuma - mx) + Math.exp(x - mx));
        }
        double P0 = Math.exp(-logSuma), logP = -logSuma;
        var pn = new ArrayList<Map<String, Object>>();
        for (int n = 0; n < N_PN; n++) {
            if (n > 0) logP += n <= s ? Math.log(a) - Math.log(n) : Math.log(rho);
            pn.add(mapa("n", n, "p", Math.exp(logP)));
        }
        var r = mapa("rho", rho, "P0", P0, "L", L, "Lq", Lq, "W", W, "Wq", Wq, "Pw", Pw, "Pn", pn, "estable", true);
        var metricas = new ArrayList<>(List.of(m("Utilización (rho)", rho), m("Probabilidad de sistema vacío (P0)", P0), m("Clientes en el sistema (L)", L), m("Clientes en la cola (Lq)", Lq),
                m("Tiempo en el sistema (W)", W), m("Tiempo en la cola (Wq)", Wq), m("Probabilidad de esperar (Pw)", Pw)));
        var pasos = new ArrayList<>(List.of(
                paso(mm1 ? "Utilización: ρ = λ/μ = %s/%s = %s < 1, el sistema es estable." : "Utilización: ρ = λ/(s·μ) = %s/(" + s + "·%s) = %s < 1, el sistema es estable.", lambda, mu, rho),
                paso("Con a = λ/μ = %s, la recurrencia de Erlang B (B_k = a·B_(k−1)/(k + a·B_(k−1))) da B_" + s + " = %s; la probabilidad de esperar (Erlang C) es Pw = B/(1 − ρ + ρ·B) = %s.", a, B, Pw),
                paso("Lq = Pw·ρ/(1−ρ) = %s·%s/(1−%s) = %s; Wq = Lq/λ = %s; W = Wq + 1/μ = %s; L = Lq + a = %s (ley de Little).", Pw, rho, rho, Lq, Wq, W, L),
                paso("Probabilidad de sistema vacío: P0 = 1/(Σ_{k<s} aᵏ/k! + aˢ/(s!·(1−ρ))) = %s; Pn = P0·aⁿ/n! si n ≤ s y P0·aˢ/s!·ρ^(n−s) si n > s.", P0)));
        Double costo = null;
        if (costos) {
            costo = s * cs + L * cw; r.put("costoTotal", lim(costo)); metricas.add(m("Costo total por unidad de tiempo", costo));
            pasos.add(paso("Costo total = s·cs + L·cw = " + s + "·%s + %s·%s = %s.", cs, L, cw, costo));
        }
        return new IoSolucion("colas", metodo, "calculado", (mm1 ? "Cola M/M/1" : "Cola M/M/" + s) + ": ρ = " + fmt(rho) + ", L = " + fmt(L) + ", Lq = " + fmt(Lq) + ", W = " + fmt(W) + ", Wq = " + fmt(Wq) + (costo == null ? "." : "; costo total " + fmt(costo) + "."),
                metricas, pasos, r, List.of("Se supone Poisson/exponencial y régimen estacionario. Mu es tasa por servidor; W usa la unidad temporal de las tasas.", "Pn muestra n=0..15; no representa toda la distribución."));
    }

    // --- utilidades ---
    private static boolean tiene(JsonNode d, String k) { return !d.path(k).isMissingNode() && !d.path(k).isNull(); }
    private static IoSolucion.Metrica m(String etiqueta, double valor) { return new IoSolucion.Metrica(etiqueta, lim(valor), null); }
    private static IoSolucion.Paso paso(String plantilla, double... x) { return new IoSolucion.Paso(String.format(plantilla, Arrays.stream(x).mapToObj(ColasSolver::fmt).toArray()), null); }
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
            throw new IllegalArgumentException(nombre + " debe ser un número " + (estricto ? "mayor que " : "mayor o igual que ") + fmt(min) + " y no exceder " + fmt(MAX) + ".");
        return x;
    }
}
