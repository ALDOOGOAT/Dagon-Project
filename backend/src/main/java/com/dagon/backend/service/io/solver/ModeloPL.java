package com.dagon.backend.service.io.solver;

import com.dagon.backend.service.io.IoExpresionLineal;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Modelo de programación lineal ya interpretado: A x (op) b, con todas las variables >= 0 (convención del contrato, como parser.js).
 * Las binarias implican 0 <= y <= 1 entera; el solver entero las trata así.
 */
public record ModeloPL(boolean max, List<String> variables, double[] c, double[][] A, String[] ops, double[] b,
                       Set<String> enteras, Set<String> binarias) {
    public static final int MAX_VARIABLES = 60, MAX_RESTRICCIONES = 60;
    private static final Pattern CABECERA = Pattern.compile("(?is)^\\s*(max|min)\\s+(?:z\\s*=\\s*)?(.+?)\\s*$");
    private static final Pattern NO_NEGATIVA = Pattern.compile("^([A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*)\\s*>=\\s*0$");
    private static final Pattern DECLARACION = Pattern.compile("(?i)^([A-Za-z]\\w*(?:\\s*,\\s*[A-Za-z]\\w*)*)\\s+(?:son\\s+)?(enter[oa]s?|int|integer|binari[oa]s?|bin|∈\\s*\\{\\s*0\\s*,\\s*1\\s*\\})$");
    private static final Pattern RESTRICCION = Pattern.compile("^(.+?)\\s*(<=|>=|=)\\s*(.+)$");

    public int n() { return variables.size(); }

    /** Lee {objetivo, restricciones, enteras?, binarias?}; lanza IllegalArgumentException en español si algo no es válido. */
    public static ModeloPL parsear(JsonNode datos) {
        if (datos == null || !datos.isObject()) throw new IllegalArgumentException("Faltan los datos del modelo.");
        Matcher cabecera = CABECERA.matcher(texto(datos.path("objetivo"), "El objetivo"));
        if (!cabecera.matches()) throw new IllegalArgumentException("El objetivo debe comenzar con max o min, por ejemplo max z = 3x1 + 5x2.");
        JsonNode lista = datos.path("restricciones");
        if (!lista.isArray()) throw new IllegalArgumentException("Las restricciones deben ser una lista de textos.");
        if (lista.size() > 4 * MAX_RESTRICCIONES) throw new IllegalArgumentException("El modelo admite hasta " + MAX_RESTRICCIONES + " restricciones.");
        List<String[]> relaciones = new ArrayList<>();
        Set<String> declaradas = new LinkedHashSet<>(), enteras = new LinkedHashSet<>(), binarias = new LinkedHashSet<>();
        for (JsonNode nodo : lista) {
            String t = texto(nodo, "Una restricción").replace("≤", "<=").replace("≥", ">=").trim();
            Matcher nn = NO_NEGATIVA.matcher(t), tipo = DECLARACION.matcher(t), rel = RESTRICCION.matcher(t);
            if (nn.matches()) declaradas.addAll(nombres(nn.group(1)));
            else if (tipo.matches()) {
                List<String> vs = nombres(tipo.group(1));
                (tipo.group(2).toLowerCase(Locale.ROOT).matches("^(binari|bin|∈).*") ? binarias : enteras).addAll(vs);
                declaradas.addAll(vs);
            } else if (rel.matches()) relaciones.add(new String[]{rel.group(1), rel.group(2), rel.group(3)});
            else throw new IllegalArgumentException("Restricción inválida: " + t + ".");
        }
        if (relaciones.size() > MAX_RESTRICCIONES) throw new IllegalArgumentException("El modelo admite hasta " + MAX_RESTRICCIONES + " restricciones.");
        for (String clave : List.of("enteras", "binarias")) {
            JsonNode vs = datos.path(clave);
            if (vs.isMissingNode() || vs.isNull()) continue;
            if (!vs.isArray() || vs.size() > MAX_VARIABLES) throw new IllegalArgumentException("La lista " + clave + " no es válida.");
            for (JsonNode v : vs) (clave.equals("binarias") ? binarias : enteras).add(texto(v, "Una variable de " + clave).trim());
        }
        IoExpresionLineal.Forma objetivo = IoExpresionLineal.parsear(cabecera.group(2));
        if (Math.abs(objetivo.constante()) >= 1e-9) throw new IllegalArgumentException("El objetivo debe expresarse sin término constante.");
        List<IoExpresionLineal.Forma[]> lados = new ArrayList<>();
        Set<String> nombres = new TreeSet<>(ModeloPL::natural);
        nombres.addAll(declaradas); nombres.addAll(objetivo.coeficientes().keySet());
        for (String[] r : relaciones) {
            var izq = IoExpresionLineal.parsear(r[0]); var der = IoExpresionLineal.parsear(r[2]);
            lados.add(new IoExpresionLineal.Forma[]{izq, der}); nombres.addAll(izq.coeficientes().keySet()); nombres.addAll(der.coeficientes().keySet());
        }
        if (nombres.isEmpty()) throw new IllegalArgumentException("El modelo debe contener al menos una variable.");
        if (nombres.size() > MAX_VARIABLES) throw new IllegalArgumentException("El modelo admite hasta " + MAX_VARIABLES + " variables.");
        for (String v : concat(enteras, binarias)) if (!nombres.contains(v)) throw new IllegalArgumentException("La variable " + v + " no aparece en el modelo.");
        List<String> vars = List.copyOf(nombres);
        int n = vars.size(), m = relaciones.size();
        double[] c = new double[n], b = new double[m]; double[][] A = new double[m][n]; String[] ops = new String[m];
        for (int j = 0; j < n; j++) c[j] = limpio(objetivo.coeficientes().getOrDefault(vars.get(j), 0.0));
        for (int i = 0; i < m; i++) {
            var izq = lados.get(i)[0]; var der = lados.get(i)[1]; ops[i] = relaciones.get(i)[1];
            for (int j = 0; j < n; j++) A[i][j] = limpio(izq.coeficientes().getOrDefault(vars.get(j), 0.0) - der.coeficientes().getOrDefault(vars.get(j), 0.0));
            b[i] = limpio(der.constante() - izq.constante());
        }
        return new ModeloPL(cabecera.group(1).equalsIgnoreCase("max"), vars, c, A, ops, b, enteras, binarias);
    }

    private static String texto(JsonNode n, String que) {
        if (!n.isTextual() || n.asText().length() > 2000) throw new IllegalArgumentException(que + " debe ser un texto de hasta 2000 caracteres.");
        return n.asText();
    }
    private static List<String> nombres(String lista) { return Arrays.stream(lista.split(",")).map(String::trim).toList(); }
    private static Set<String> concat(Set<String> a, Set<String> b) { Set<String> s = new LinkedHashSet<>(a); s.addAll(b); return s; }

    /** Orden natural (x2 antes que x10), como localeCompare numérico del frontend. */
    private static int natural(String a, String b) {
        int i = 0, j = 0;
        while (i < a.length() && j < b.length()) {
            char x = a.charAt(i), y = b.charAt(j);
            if (Character.isDigit(x) && Character.isDigit(y)) {
                int i2 = i, j2 = j;
                while (i2 < a.length() && Character.isDigit(a.charAt(i2))) i2++;
                while (j2 < b.length() && Character.isDigit(b.charAt(j2))) j2++;
                int cmp = new BigInteger(a.substring(i, i2)).compareTo(new BigInteger(b.substring(j, j2)));
                if (cmp != 0) return cmp;
                i = i2; j = j2;
            } else {
                int cmp = Character.compare(Character.toLowerCase(x), Character.toLowerCase(y));
                if (cmp != 0) return cmp;
                i++; j++;
            }
        }
        int cmp = Integer.compare(a.length() - i, b.length() - j);
        return cmp != 0 ? cmp : a.compareTo(b);
    }

    // ---- Utilidades de salida compartidas por los solvers de este paquete ----
    /** Valores con |x| < 1e-9 (y -0.0) se devuelven como 0.0. */
    static double limpio(double x) { return Math.abs(x) < 1e-9 ? 0.0 : x; }
    /** null cuando no hay cota (Infinity/NaN no se serializan). */
    static Double finito(double x) { return Double.isFinite(x) ? limpio(x) : null; }
    /** Número legible para los resúmenes (hasta 6 decimales, sin ceros sobrantes). */
    static String num(double v) {
        BigDecimal bd = BigDecimal.valueOf(limpio(v)).setScale(6, RoundingMode.HALF_UP).stripTrailingZeros();
        return (bd.scale() < 0 ? bd.setScale(0) : bd).toPlainString();
    }
}
