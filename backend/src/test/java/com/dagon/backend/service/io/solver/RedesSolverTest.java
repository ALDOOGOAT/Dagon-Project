package com.dagon.backend.service.io.solver;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static com.dagon.backend.service.io.solver.TransporteSolverTest.*;
import static org.assertj.core.api.Assertions.*;

class RedesSolverTest {
    // Red de libro: A(3) B(2) C(4,A) D(2,A) E(3,B+C) F(2,D+E). Ruta crítica A-C-E-F de 12.
    static final String RED = "[{'id':'A','predecesoras':[],'duracion':3},{'id':'B','predecesoras':[],'duracion':2},{'id':'C','predecesoras':['A'],'duracion':4},"
            + "{'id':'D','predecesoras':['A'],'duracion':2},{'id':'E','predecesoras':['B','C'],'duracion':3},{'id':'F','predecesoras':['D','E'],'duracion':2}]";

    static IoSolucion cpm(String actividades) { return RedesSolver.resolver("cpm", json("{'actividades':" + actividades + "}")); }
    static IoSolucion pert(String actividades, String plazo) { return RedesSolver.resolver("pert", json("{'actividades':" + actividades + (plazo == null ? "" : ",'plazo':" + plazo) + "}")); }
    static Map<String, Object> act(IoSolucion s, String id) {
        return lista(s.resultado().get("actividades")).stream().map(TransporteSolverTest::mapa).filter(a -> id.equals(a.get("id"))).findFirst().orElseThrow();
    }

    @Test void cpmDeLibroRecorridoHaciaAdelanteYHaciaAtras() {
        var s = cpm(RED);
        assertThat(s.tipo()).isEqualTo("redes"); assertThat(s.metodo()).isEqualTo("cpm"); assertThat(s.estado()).isEqualTo("calculado");
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(12.0);
        assertThat(s.resultado().get("rutaCritica")).isEqualTo(List.of("A", "C", "E", "F"));
        assertThat(s.resultado().get("rutasCriticas")).isEqualTo(List.of(List.of("A", "C", "E", "F")));
        // IC=ES, TC=EF, IL=LS, TL=LF.
        var d = act(s, "D");
        assertThat(d.get("ES")).isEqualTo(3.0); assertThat(d.get("EF")).isEqualTo(5.0); assertThat(d.get("LS")).isEqualTo(8.0); assertThat(d.get("LF")).isEqualTo(10.0);
        assertThat(d.get("holgura")).isEqualTo(5.0); assertThat(d.get("critica")).isEqualTo(false);
        assertThat(act(s, "E").get("ES")).isEqualTo(7.0);
        assertThat(act(s, "B").get("holgura")).isEqualTo(5.0);   // B: ES 0, LF = LS(E) = 7 -> LS 5
        assertThat(lista(s.resultado().get("actividades")).stream().map(a -> mapa(a).get("id")).toList()).containsExactly("A", "B", "C", "D", "E", "F");
        assertThat(s.metricas()).hasSize(1); assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Duración del proyecto"); assertThat(s.metricas().get(0).valor()).isEqualTo(12.0);
        assertThat(s.pasos()).isNotEmpty(); assertThat(s.advertencias()).isEmpty();
    }

    @Test void cpmSegundoEjemploConCaminoCriticoABDF() {
        // A3 B4(A) C2(A) D5(B) E1(C) F2(D,E): A-B-D-F = 14; C-E tiene holgura 14-(3+2+1+2)=6.
        var s = cpm("[{'id':'A','predecesoras':[],'duracion':3},{'id':'B','predecesoras':['A'],'duracion':4},{'id':'C','predecesoras':['A'],'duracion':2},"
                + "{'id':'D','predecesoras':['B'],'duracion':5},{'id':'E','predecesoras':['C'],'duracion':1},{'id':'F','predecesoras':['D','E'],'duracion':2}]");
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(14.0);
        assertThat(s.resultado().get("rutaCritica")).isEqualTo(List.of("A", "B", "D", "F"));
        assertThat(act(s, "C").get("holgura")).isEqualTo(6.0); assertThat(act(s, "E").get("holgura")).isEqualTo(6.0);
    }

    @Test void ordenDeEntradaNoAfectaYHayVariasRutasCriticas() {
        var s = cpm("[{'id':'C','predecesoras':['A','B'],'duracion':1},{'id':'A','predecesoras':[],'duracion':2},{'id':'B','predecesoras':[],'duracion':2}]");
        assertThat(s.resultado().get("rutasCriticas")).isEqualTo(List.of(List.of("A", "C"), List.of("B", "C")));
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(3.0);
        assertThat(lista(s.resultado().get("actividades")).stream().map(a -> mapa(a).get("id")).toList()).containsExactly("C", "A", "B");
    }

    @Test void actividadUnicaYDuracionCero() {
        var s = cpm("[{'id':'X','predecesoras':[],'duracion':0}]");
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(0.0); assertThat(s.resultado().get("rutaCritica")).isEqualTo(List.of("X"));
        assertThat(act(s, "X").get("critica")).isEqualTo(true);
    }

    @Test void cicloPredecesoraInexistenteYDatosInvalidos() {
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':['B'],'duracion':1},{'id':'B','predecesoras':['A'],'duracion':1}]")).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ciclo");
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':['A'],'duracion':1}]")).hasMessageContaining("ciclo");
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':['Z'],'duracion':1}]")).hasMessageContaining("Predecesora desconocida: Z");
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':[],'duracion':-1}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':[],'duracion':1},{'id':'A','predecesoras':[],'duracion':1}]")).hasMessageContaining("único");
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':[],'duracion':1},{'id':'B','predecesoras':['A','A'],'duracion':1}]")).hasMessageContaining("predecesoras de B");
        assertThatThrownBy(() -> cpm("[]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> cpm("[{'id':'','predecesoras':[],'duracion':1}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> cpm("[{'id':'A','duracion':1}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> cpm("[{'id':'A','predecesoras':[],'duracion':'3'}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> RedesSolver.resolver("cpm", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> RedesSolver.resolver("otro", json("{'actividades':" + RED + "}"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void masDe80ActividadesSeRechazan() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < 81; i++) sb.append(i > 0 ? "," : "").append("{'id':'T").append(i).append("','predecesoras':[],'duracion':1}");
        assertThatThrownBy(() -> cpm(sb + "]")).hasMessageContaining("80");
    }

    @Test void pertCalculaTiempoEsperadoVarianzaYProbabilidadConPlazo() {
        // te = (1+4*2+3)/6 = 2 y (2+4*3+4)/6 = 3; varianza ((3-1)/6)^2 = 1/9 cada una; sigma = sqrt(2/9); plazo 5 = media -> 0.5.
        var s = pert("[{'id':'A','predecesoras':[],'a':1,'m':2,'b':3},{'id':'B','predecesoras':['A'],'a':2,'m':3,'b':4}]", "5");
        assertThat(s.metodo()).isEqualTo("pert"); assertThat(s.estado()).isEqualTo("calculado");
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(5.0);
        assertThat(num(s.resultado().get("varianzaRuta"))).isCloseTo(2.0 / 9, within(1e-12));
        assertThat(num(s.resultado().get("desviacion"))).isCloseTo(Math.sqrt(2.0 / 9), within(1e-12));
        assertThat(num(s.resultado().get("z"))).isEqualTo(0.0);
        assertThat(num(s.resultado().get("probabilidad"))).isCloseTo(0.5, within(1e-9));
        assertThat(num(s.resultado().get("plazo"))).isEqualTo(5.0);
        assertThat(act(s, "A").get("te")).isEqualTo(2.0); assertThat(num(act(s, "A").get("varianza"))).isCloseTo(1.0 / 9, within(1e-12));
        assertThat(s.metricas().stream().map(IoSolucion.Metrica::etiqueta)).containsExactly("Duración del proyecto", "Varianza de ruta crítica", "Probabilidad de cumplimiento");
        assertThat(s.advertencias()).isNotEmpty();
    }

    @Test void pertUnaDesviacionPorEncimaDaPhiDeUno() {
        // a=0,m=3,b=6: te 3, varianza 1; plazo 4 -> z = 1 -> 0.8413447461.
        var s = pert("[{'id':'A','predecesoras':[],'a':0,'m':3,'b':6}]", "4");
        assertThat(num(s.resultado().get("z"))).isEqualTo(1.0);
        assertThat(num(s.resultado().get("probabilidad"))).isCloseTo(0.8413447461, within(1e-9));
    }

    @Test void pertZNegativoYZDeDos() {
        // a=4,m=10,b=16: te 10, varianza 4, sigma 2. Plazo 14 -> z=2 -> 0.9772498681; plazo 8 -> z=-1 -> 0.1586552539.
        String a = "[{'id':'A','predecesoras':[],'a':4,'m':10,'b':16}]";
        assertThat(num(pert(a, "14").resultado().get("probabilidad"))).isCloseTo(0.9772498681, within(1e-9));
        var bajo = pert(a, "8");
        assertThat(num(bajo.resultado().get("z"))).isEqualTo(-1.0);
        assertThat(num(bajo.resultado().get("probabilidad"))).isCloseTo(0.1586552539, within(1e-9));
    }

    @Test void pertSinPlazoDejaPlazoZYProbabilidadEnNull() {
        var s = pert("[{'id':'A','predecesoras':[],'a':2,'m':2,'b':2}]", null);
        assertThat(s.resultado()).containsEntry("plazo", null).containsEntry("z", null).containsEntry("probabilidad", null);
        assertThat(s.metricas()).hasSize(2);
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(2.0);
    }

    @Test void pertDeterministaConPlazoDa1O0SinInfinitos() {
        String a = "[{'id':'A','predecesoras':[],'a':2,'m':2,'b':2}]";
        var cumple = pert(a, "2");
        assertThat(num(cumple.resultado().get("probabilidad"))).isEqualTo(1.0); assertThat(cumple.resultado().get("z")).isNull();
        assertThat(num(pert(a, "1").resultado().get("probabilidad"))).isEqualTo(0.0);
        assertThat(cumple.advertencias().stream().anyMatch(t -> t.contains("determinista"))).isTrue();
        assertSimple(cumple.resultado());
    }

    @Test void pertEnEmpateDeRutasElijeLaDeMayorVarianza() {
        // X (var 0) y Y (var 1) duran 3 en paralelo; la ruta crítica usada para la probabilidad es la de Y.
        var s = pert("[{'id':'X','predecesoras':[],'a':3,'m':3,'b':3},{'id':'Y','predecesoras':[],'a':0,'m':3,'b':6},{'id':'Z','predecesoras':['X','Y'],'a':1,'m':1,'b':1}]", "5");   // duración 4, plazo 5 -> z = 1
        assertThat(lista(s.resultado().get("rutasCriticas"))).hasSize(2);
        assertThat(s.resultado().get("rutaCritica")).isEqualTo(List.of("Y", "Z"));
        assertThat(num(s.resultado().get("varianzaRuta"))).isEqualTo(1.0);
        assertThat(num(s.resultado().get("probabilidad"))).isCloseTo(0.8413447461, within(1e-9));
    }

    @Test void pertEstimacionesInvertidasYPlazoNegativoSeRechazan() {
        assertThatThrownBy(() -> pert("[{'id':'A','predecesoras':[],'a':3,'m':2,'b':1}]", null)).hasMessageContaining("a ≤ m ≤ b");
        assertThatThrownBy(() -> pert("[{'id':'A','predecesoras':[],'a':1,'m':2,'b':3}]", "-1")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> RedesSolver.resolver("pert", json("{'actividades':[{'id':'A','predecesoras':[],'duracion':2}]}"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void cadenaDeDiamantesConMillonesDeRutasCriticasSeResuelveRapidoYSinExplotar() {
        // 26 diamantes encadenados = 2^26 rutas críticas; la enumeración se acota y PERT elige la de mayor varianza por programación dinámica.
        StringBuilder sb = new StringBuilder("["); String previa = null; int diamantes = 26;
        for (int k = 0; k < diamantes; k++) {
            String p = previa == null ? "" : "'" + previa + "'";
            sb.append(k > 0 ? "," : "").append("{'id':'U").append(k).append("','predecesoras':[").append(p).append("],'a':0,'m':3,'b':6}")   // te 3, var 1
                    .append(",{'id':'L").append(k).append("','predecesoras':[").append(p).append("],'a':3,'m':3,'b':3}")                              // te 3, var 0
                    .append(",{'id':'J").append(k).append("','predecesoras':['U").append(k).append("','L").append(k).append("'],'a':1,'m':1,'b':1}");
            previa = "J" + k;
        }
        long t0 = System.nanoTime();
        var s = pert(sb + "]", "100");
        assertThat((System.nanoTime() - t0) / 1_000_000).isLessThan(2000);
        assertThat(num(s.resultado().get("duracion"))).isEqualTo(4.0 * diamantes);
        assertThat(num(s.resultado().get("varianzaRuta"))).isEqualTo((double) diamantes);   // en cada diamante gana la rama U (var 1)
        assertThat(lista(s.resultado().get("rutasCriticas")).size()).isLessThanOrEqualTo(100);
        assertThat(((List<?>) s.resultado().get("rutaCritica")).get(0)).isEqualTo("U0");
        assertThat(s.advertencias().stream().anyMatch(t -> t.contains("rutas críticas"))).isTrue();
    }

    @Test void redesAleatoriasCoincidenConUnCaminoMasLargoRecursivoIndependiente() {
        var azar = new java.util.Random(21);
        for (int caso = 0; caso < 60; caso++) {
            int n = 2 + azar.nextInt(11);
            int[] dur = new int[n]; List<List<Integer>> pred = new java.util.ArrayList<>();
            for (int i = 0; i < n; i++) {
                dur[i] = azar.nextInt(6); List<Integer> p = new java.util.ArrayList<>();
                for (int k = 0; k < i; k++) if (azar.nextInt(4) == 0) p.add(k);
                pred.add(p);
            }
            // Se entrega en orden aleatorio: el solver no debe depender del orden de entrada.
            List<Integer> orden = new java.util.ArrayList<>(); for (int i = 0; i < n; i++) orden.add(i);
            java.util.Collections.shuffle(orden, azar);
            String json = orden.stream().map(i -> "{'id':'T" + i + "','predecesoras':" + pred.get(i).stream().map(k -> "'T" + k + "'").toList() + ",'duracion':" + dur[i] + "}").collect(java.util.stream.Collectors.joining(",", "[", "]"));
            var s = cpm(json);
            int[] ef = new int[n]; for (int i = 0; i < n; i++) { int es = 0; for (int p : pred.get(i)) es = Math.max(es, ef[p]); ef[i] = es + dur[i]; }   // índices ya en orden topológico
            int total = java.util.Arrays.stream(ef).max().getAsInt();
            int[] ls = new int[n];
            for (int i = n - 1; i >= 0; i--) { int lf = total; for (int k = i + 1; k < n; k++) if (pred.get(k).contains(i)) lf = Math.min(lf, ls[k]); ls[i] = lf - dur[i]; }
            assertThat(num(s.resultado().get("duracion"))).isEqualTo(total);
            for (int i = 0; i < n; i++) {
                var a = act(s, "T" + i);
                assertThat(num(a.get("EF"))).isEqualTo(ef[i]); assertThat(num(a.get("LS"))).isEqualTo(ls[i]);
                assertThat(num(a.get("holgura"))).isEqualTo(ls[i] - (ef[i] - dur[i])).isGreaterThanOrEqualTo(0);
                assertThat(a.get("critica")).isEqualTo(ls[i] == ef[i] - dur[i]);
            }
            // La ruta crítica devuelta es una cadena de precedencias de actividades críticas que suma la duración.
            var ruta = (List<?>) s.resultado().get("rutaCritica"); int suma = 0;
            for (int k = 0; k < ruta.size(); k++) {
                int i = Integer.parseInt(ruta.get(k).toString().substring(1)); suma += dur[i];
                assertThat(act(s, "T" + i).get("critica")).isEqualTo(true);
                if (k > 0) assertThat(pred.get(i)).contains(Integer.parseInt(ruta.get(k - 1).toString().substring(1)));
            }
            assertThat(suma).isEqualTo(total);
        }
    }

    @Test void funcionDeDistribucionNormalConErrorMenorQue1e9() {
        double[][] casos = {{0, 0.5}, {1, 0.8413447460685429}, {-1, 0.15865525393145707}, {1.96, 0.9750021048517795}, {-1.96, 0.024997895148220435},
                {2.5, 0.9937903346742238}, {3.5, 0.9997673709209645}, {-3, 0.0013498980316300946}, {5, 0.9999997133484281}, {-5, 2.866515718791939e-7},
                {0.1, 0.5398278372770290}, {-0.5, 0.3085375387259869}};
        for (double[] c : casos) assertThat(RedesSolver.normalCdf(c[0])).as("z=%s", c[0]).isCloseTo(c[1], within(1e-9));
        // Colas (rama de fracción continua y serie): error relativo pequeño, no solo absoluto.
        double[][] colas = {{-4, 3.167124183311992e-5}, {-4.5, 3.397673124730062e-6}, {-6, 9.865876450376946e-10}, {-7, 1.279812543885835e-12}, {-8, 6.220960574271786e-16}};
        for (double[] c : colas) assertThat(RedesSolver.normalCdf(c[0])).as("z=%s", c[0]).isCloseTo(c[1], org.assertj.core.data.Percentage.withPercentage(1e-6));
        assertThat(RedesSolver.normalCdf(40)).isEqualTo(1.0); assertThat(RedesSolver.normalCdf(-40)).isLessThan(1e-300 + 1e-20);
        // Monótona y simétrica.
        for (double z = -6; z < 6; z += 0.05) { assertThat(RedesSolver.normalCdf(z + 0.05)).isGreaterThanOrEqualTo(RedesSolver.normalCdf(z)); assertThat(RedesSolver.normalCdf(z) + RedesSolver.normalCdf(-z)).isCloseTo(1.0, within(1e-12)); }
    }

    @Test void elResultadoSoloContieneTiposSimplesSerializables() {
        var s = pert("[{'id':'A','predecesoras':[],'a':1,'m':2,'b':3},{'id':'B','predecesoras':['A'],'a':2,'m':3,'b':4}]", "5");
        assertSimple(s.resultado()); s.pasos().forEach(p -> assertSimple(p.tabla()));
        assertSimple(cpm(RED).resultado());
    }
}
