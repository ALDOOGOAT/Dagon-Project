package com.dagon.backend.service.io;

import java.util.*;
import java.util.regex.Pattern;

/** Parser aritmético simbólico; nunca evalúa código, funciones ni instrucciones del alumno. */
final class IoExpresionLineal {
    record Forma(double constante, Map<String, Double> coeficientes) {}
    private static final Pattern NUMERO = Pattern.compile("(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?");
    private final String texto;
    private int posicion;
    private int profundidad;
    private IoExpresionLineal(String texto) { this.texto = texto.replaceAll("\\s+", ""); }
    static Forma parsear(String texto) {
        var parser = new IoExpresionLineal(texto);
        Forma f = parser.suma();
        if (parser.posicion != parser.texto.length()) throw new IllegalArgumentException("Expresión PL inválida o no lineal.");
        return f;
    }
    private Forma suma() {
        Forma resultado = producto();
        while (posicion < texto.length() && (texto.charAt(posicion) == '+' || texto.charAt(posicion) == '-')) {
            char operador = texto.charAt(posicion++); resultado = sumar(resultado, producto(), operador == '+' ? 1 : -1);
        }
        return resultado;
    }
    private Forma producto() {
        Forma r = atomo();
        while (posicion < texto.length()) {
            char c = texto.charAt(posicion);
            if (c == '*' || c == '/') {
                posicion++; Forma d = atomo();
                if (c == '/') {
                    if (!d.coeficientes.isEmpty() || d.constante == 0) throw new IllegalArgumentException("PL no admite dividir por una variable ni por cero.");
                    r = escalar(r, 1 / d.constante);
                } else r = multiplicar(r, d);
            } else if (c == '(' || Character.isLetter(c) || Character.isDigit(c) || c == '.') {
                r = multiplicar(r, atomo());
            } else break;
        }
        return r;
    }
    private Forma atomo() {
        if (++profundidad > 40) throw new IllegalArgumentException("Expresión demasiado anidada.");
        try {
            if (posicion >= texto.length()) throw new IllegalArgumentException("Expresión incompleta.");
            char c = texto.charAt(posicion);
            if (c == '+' || c == '-') { posicion++; return escalar(atomo(), c == '-' ? -1 : 1); }
            if (c == '(') { posicion++; Forma f = suma(); if (posicion >= texto.length() || texto.charAt(posicion++) != ')') throw new IllegalArgumentException("Falta cerrar un paréntesis."); return f; }
            if (Character.isLetter(c)) {
                int inicio = posicion++; while (posicion < texto.length() && (Character.isLetterOrDigit(texto.charAt(posicion)) || texto.charAt(posicion) == '_')) posicion++;
                String simbolo = texto.substring(inicio, posicion);
                if (!simbolo.matches("[A-Za-z][A-Za-z0-9_]{0,29}") || Set.of("constructor", "prototype", "__proto__").contains(simbolo)) throw new IllegalArgumentException("Símbolo de variable inválido.");
                return new Forma(0, Map.of(simbolo, 1.0));
            }
            var numero = NUMERO.matcher(texto.substring(posicion));
            if (!numero.lookingAt()) throw new IllegalArgumentException("La expresión contiene un operador o función no permitidos.");
            posicion += numero.end(); double valor = Double.parseDouble(numero.group()); seguro(valor);
            return new Forma(valor, Map.of());
        } finally { profundidad--; }
    }
    private static Forma multiplicar(Forma a, Forma b) {
        if (!a.coeficientes.isEmpty() && !b.coeficientes.isEmpty()) throw new IllegalArgumentException("El producto de variables no es lineal.");
        return a.coeficientes.isEmpty() ? escalar(b, a.constante) : escalar(a, b.constante);
    }
    private static Forma escalar(Forma f, double k) {
        seguro(k); Map<String, Double> mapa = new HashMap<>();
        f.coeficientes.forEach((v, c) -> { double valor = c * k; seguro(valor); mapa.put(v, valor); });
        double constante = f.constante * k; seguro(constante); return new Forma(constante, mapa);
    }
    private static Forma sumar(Forma a, Forma b, int signo) {
        Map<String, Double> m = new HashMap<>(a.coeficientes);
        b.coeficientes.forEach((v, c) -> { double valor = m.getOrDefault(v, 0.0) + signo * c; seguro(valor); m.put(v, valor); });
        double constante = a.constante + signo * b.constante; seguro(constante); return new Forma(constante, m);
    }
    private static void seguro(double n) { if (!Double.isFinite(n) || Math.abs(n) > 1e12) throw new IllegalArgumentException("Coeficiente no finito o fuera de rango."); }
}
