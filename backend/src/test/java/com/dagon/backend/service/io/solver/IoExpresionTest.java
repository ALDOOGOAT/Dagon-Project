package com.dagon.backend.service.io.solver;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class IoExpresionTest {
    private static double ev(String f, double... x) {
        List<String> vars = List.of("x", "y", "z").subList(0, Math.max(1, x.length));
        return IoExpresion.compilar(f, vars).evaluar(x.length == 0 ? new double[]{0} : x);
    }

    @Test void respetaPrecedenciaAsociatividadYMenosUnario() {
        assertThat(ev("2+3*4")).isEqualTo(14);
        assertThat(ev("2^3^2")).isEqualTo(512);          // asociatividad derecha
        assertThat(ev("-2^2")).isEqualTo(-4);             // -(2^2)
        assertThat(ev("2^-1")).isEqualTo(0.5);
        assertThat(ev("10-4-3")).isEqualTo(3);            // asociatividad izquierda
        assertThat(ev("8/2/2")).isEqualTo(2);
        assertThat(ev("--3")).isEqualTo(3);
        assertThat(ev("(1+2)*(3+4)")).isEqualTo(21);
    }

    @Test void admiteMultiplicacionImplicita() {
        assertThat(ev("2x", 3)).isEqualTo(6);
        assertThat(ev("3(x+1)", 2)).isEqualTo(9);
        assertThat(ev("x y", 3, 4)).isEqualTo(12);
        assertThat(ev("2x^2", 3)).isEqualTo(18);          // 2*(x^2)
        assertThat(ev("x(x+1)", 2)).isEqualTo(6);
        assertThat(ev("(x+1)(x-1)", 3)).isEqualTo(8);
        assertThat(ev("3x/2", 4)).isEqualTo(6);
        assertThat(ev("2pi")).isCloseTo(2 * Math.PI, within(1e-12));
    }

    @Test void leeNotacionCientificaFuncionesYConstantes() {
        assertThat(ev("1.5e3")).isEqualTo(1500);
        assertThat(ev("2e-2x", 100)).isCloseTo(2, within(1e-12));
        assertThat(ev("2e")).isCloseTo(2 * Math.E, within(1e-12));   // 2*e, no notación científica
        assertThat(ev("sin(0)+cos(0)")).isEqualTo(1);
        assertThat(ev("sqrt(16)")).isEqualTo(4);
        assertThat(ev("exp(0)")).isEqualTo(1);
        assertThat(ev("ln(e)")).isCloseTo(1, within(1e-12));
        assertThat(ev("log(e^2)")).isCloseTo(2, within(1e-12));
        assertThat(ev("abs(-3)")).isEqualTo(3);
        assertThat(ev("tan(0)")).isEqualTo(0);
        assertThat(ev("cos(pi)")).isCloseTo(-1, within(1e-12));
        assertThat(ev(".5+5.")).isEqualTo(5.5);
    }

    @Test void evaluaConMapaYArreglo() {
        var f = IoExpresion.compilar("x^2*y", List.of("x", "y"));
        assertThat(f.variables()).containsExactly("x", "y");
        assertThat(f.evaluar(3, 2)).isEqualTo(18);
        assertThat(f.evaluar(Map.of("x", 3.0, "y", 2.0))).isEqualTo(18);
        assertThatThrownBy(() -> f.evaluar(1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> f.evaluar(Map.of("x", 1.0))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void resultadoNoFinitoEsNaNControladoOErrorEstricto() {
        var f = IoExpresion.compilar("1/x", List.of("x"));
        assertThat(f.evaluar(0)).isNaN();
        assertThatThrownBy(() -> f.valor(0)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("finito");
        assertThat(IoExpresion.compilar("sqrt(x)", List.of("x")).evaluar(-1)).isNaN();
        assertThat(IoExpresion.compilar("log(x)", List.of("x")).evaluar(0)).isNaN();
        assertThat(IoExpresion.compilar("exp(x)", List.of("x")).evaluar(1000)).isNaN();
        assertThat(IoExpresion.compilar("x^0.5", List.of("x")).evaluar(-4)).isNaN();
    }

    @Test void rechazaTextoPeligrosoSimbolosDesconocidosYSintaxisInvalida() {
        for (String malo : List.of("java.lang.System.exit(0)", "x;rm", "x; DROP TABLE", "Runtime.getRuntime()", "x**2", "`ls`", "x$y",
                "System.exit(0)", "y", "sin x", "foo(x)", "x+", "(x", "x)", "()", "", "   ", "x,y", "2 3", "1e999", "1e13", "x == 2", "x− 1", "__proto__", "x/2y"))
            assertThatThrownBy(() -> IoExpresion.compilar(malo, List.of("x"))).as(malo).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresion.compilar(null, List.of("x"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void limitaLongitudYProfundidad() {
        assertThatThrownBy(() -> IoExpresion.compilar("x+".repeat(300) + "x", List.of("x"))).hasMessageContaining("500");
        assertThatThrownBy(() -> IoExpresion.compilar("(".repeat(50) + "x" + ")".repeat(50), List.of("x"))).hasMessageContaining("anidada");
        assertThatThrownBy(() -> IoExpresion.compilar("-".repeat(60) + "x", List.of("x"))).hasMessageContaining("anidada");
        assertThatThrownBy(() -> IoExpresion.compilar("x^".repeat(60) + "x", List.of("x"))).hasMessageContaining("anidada");
        assertThat(IoExpresion.compilar("(".repeat(30) + "x" + ")".repeat(30), List.of("x")).evaluar(7)).isEqualTo(7);
        assertThat(IoExpresion.compilar("x+".repeat(200) + "x", List.of("x")).evaluar(1)).isEqualTo(201);
    }

    @Test void rechazaVariablesReservadasODuplicadas() {
        assertThatThrownBy(() -> IoExpresion.compilar("1", List.of("sin"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresion.compilar("1", List.of("e"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresion.compilar("1", List.of("x", "x"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> IoExpresion.compilar("1", List.of("1x"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void extraeSimbolosLibresEnOrdenDeAparicion() {
        assertThat(IoExpresion.simbolos("3x1 + 2*x2 - sin(pi*y) + x1*e")).containsExactly("x1", "x2", "y");
        assertThat(IoExpresion.simbolos("5")).isEmpty();
        assertThatThrownBy(() -> IoExpresion.simbolos("x;rm")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void gradienteYHessianaNumericasSonPrecisas() {
        var f = IoExpresion.compilar("x^2*y + 3*y", List.of("x", "y"));
        assertThat(f.gradiente(3, 2)).containsExactly(new double[]{12, 12}, within(1e-8));
        double[][] h = f.hessiana(3, 2);
        assertThat(h[0][0]).isCloseTo(4, within(1e-6));
        assertThat(h[0][1]).isCloseTo(6, within(1e-6));
        assertThat(h[1][0]).isCloseTo(6, within(1e-6));
        assertThat(h[1][1]).isCloseTo(0, within(1e-6));
        var s = IoExpresion.compilar("sin(x)", List.of("x"));
        assertThat(s.parcial(1, 0, 0).valor()).isCloseTo(1, within(1e-9));
        assertThat(s.parcial(2, 0, Math.PI / 2).valor()).isCloseTo(-1, within(1e-7));
    }

    @Test void derivadasDeOrdenSuperiorYEscalasGrandes() {
        var cubo = IoExpresion.compilar("x^3", List.of("x"));
        assertThat(cubo.parcial(2, 0, 2).valor()).isCloseTo(12, within(1e-6));
        assertThat(cubo.parcial(3, 0, 2).valor()).isCloseTo(6, within(1e-5));
        assertThat(IoExpresion.compilar("x^4", List.of("x")).parcial(4, 0, 1).valor()).isCloseTo(24, within(1e-3));
        assertThat(IoExpresion.compilar("x^2", List.of("x")).parcial(1, 0, 1e6).valor()).isCloseTo(2e6, within(1e-3));
        // En x=0 un cubo tiene segunda derivada nula (dentro del ruido numérico) y tercera no nula.
        assertThat(cubo.parcial(2, 0, 0).nula()).isTrue();
        assertThat(cubo.parcial(3, 0, 0).nula()).isFalse();
        // x^3 + x^4: la segunda derivada en 0 es nula aunque el truncamiento de un esquema simple no lo sea.
        assertThat(IoExpresion.compilar("x^3+x^4", List.of("x")).parcial(2, 0, 0).nula()).isTrue();
        // Una función lineal tiene segunda derivada nula lejos del origen (ruido de redondeo).
        assertThat(IoExpresion.compilar("x", List.of("x")).parcial(2, 0, 1).nula()).isTrue();
    }

    @Test void hessianaDescartaLoQueNoSeDistingueDelRuido() {
        double[][] lineal = IoExpresion.compilar("3x+2y", List.of("x", "y")).hessiana(1, 1);
        assertThat(lineal).isEqualTo(new double[][]{{0, 0}, {0, 0}});
        double[][] h = IoExpresion.compilar("x^2+x*y+y^2", List.of("x", "y")).hessiana(1, 2);
        assertThat(h[0][0]).isCloseTo(2, within(1e-6));
        assertThat(h[0][1]).isCloseTo(1, within(1e-6));
        assertThat(h[1][1]).isCloseTo(2, within(1e-6));
    }

    @Test void derivadasFueraDeDominioDevuelvenNaN() {
        var f = IoExpresion.compilar("sqrt(x)", List.of("x"));
        assertThat(f.parcial(1, 0, -5).valor()).isNaN();
        assertThat(f.gradiente(-5)[0]).isNaN();
        assertThatThrownBy(() -> f.parcial(0, 0, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> f.parcial(11, 0, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> f.parcial(1, 1, 1)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void derivadaCercaDeUnaSingularidadReduceElPaso() {
        // sqrt(x) en x=1e-4: el paso nominal (7e-4) saldría del dominio por la izquierda; se reduce hasta poder muestrear.
        assertThat(IoExpresion.compilar("sqrt(x)", List.of("x")).parcial(1, 0, 1e-4).valor()).isCloseTo(50, within(2.0));
    }
}
