package com.dagon.backend.service.io.solver;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import static com.dagon.backend.service.io.solver.TransporteSolverTest.*;
import static org.assertj.core.api.Assertions.*;

class AsignacionSolverTest {
    // Matriz 4x4 de libro: asignación óptima (0,2)+(1,1)+(2,0)+(3,3) = 69+37+11+23 = 140.
    static final String M4 = "[[82,83,69,92],[77,37,49,92],[11,69,5,86],[8,9,98,23]]";

    static IoSolucion resolver(String matriz, String objetivo) { return AsignacionSolver.resolver("hungaro", json("{'matriz':" + matriz + ",'objetivo':'" + objetivo + "'}")); }
    static double total(IoSolucion s) { return num(s.resultado().get("total")); }
    static List<Object> pares(IoSolucion s) { return lista(s.resultado().get("asignacion")); }

    @Test void hungaro4x4DeLibroCuesta140() {
        var s = resolver(M4, "min");
        assertThat(s.tipo()).isEqualTo("asignacion"); assertThat(s.metodo()).isEqualTo("hungaro"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(total(s)).isEqualTo(140.0);
        assertThat(pares(s)).hasSize(4);
        assertThat(pares(s).stream().map(p -> mapa(p).get("columna")).collect(java.util.stream.Collectors.toSet())).hasSize(4);
        assertThat(pares(s).stream().map(p -> mapa(p).get("fila") + ":" + mapa(p).get("columna")).toList()).containsExactlyInAnyOrder("0:2", "1:1", "2:0", "3:3");
        assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Costo total"); assertThat(s.metricas().get(0).valor()).isEqualTo(140.0);
        assertThat(s.advertencias()).isEmpty();
    }

    @Test void pasosMuestranLasMatricesDeReduccionYLasCubiertas() {
        var s = resolver(M4, "min");
        assertThat(s.pasos().get(0).texto()).isEqualTo("Matriz inicial");
        assertThat(s.pasos().stream().map(IoSolucion.Paso::texto)).contains("Restar el mínimo de cada fila", "Restar el mínimo de cada columna", "Asignación óptima");
        var pasosJs = lista(s.resultado().get("pasos"));
        assertThat(pasosJs).hasSameSizeAs(s.pasos());
        assertThat(pasosJs.stream().anyMatch(p -> mapa(p).get("cubiertas") != null)).isTrue();
        // Tras restar mínimos de filas y columnas, toda fila y columna contiene un cero.
        var tras = lista(mapa(pasosJs.get(s.pasos().stream().map(IoSolucion.Paso::texto).toList().indexOf("Restar el mínimo de cada columna"))).get("matriz"));
        for (Object fila : tras) assertThat(lista(fila).stream().mapToDouble(x -> num(x)).min().getAsDouble()).isEqualTo(0.0);
    }

    @Test void maximizacionConvierteConMaxMenosCostoYReportaLaGanancia() {
        var s = resolver("[[4,1],[2,3]]", "max");
        assertThat(total(s)).isEqualTo(7.0);
        assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Ganancia total");
        assertThat(s.pasos().stream().map(IoSolucion.Paso::texto)).contains("Conversión de maximización a minimización");
        // 3x3 de ganancias: de las 6 permutaciones la mejor es (0,2)+(1,0)+(2,1) = 8+9+8 = 25.
        assertThat(total(resolver("[[7,5,8],[9,6,4],[3,8,6]]", "max"))).isEqualTo(25.0);
    }

    @Test void rectangular3x4RellenaConFilaFicticiaYLaExcluyeDelResultado() {
        var s = resolver("[[1,10,20,30],[10,2,30,40],[20,30,3,50]]", "min");
        assertThat(total(s)).isEqualTo(6.0);
        assertThat(pares(s)).hasSize(3);
        assertThat(pares(s).stream().allMatch(p -> num(mapa(p).get("fila")) < 3 && num(mapa(p).get("columna")) < 4)).isTrue();
        assertThat(lista(mapa(s.pasos().get(0).tabla()).get("matriz"))).hasSize(4);   // matriz cuadrada de 4x4 con la fila ficticia
        assertThat(s.pasos().get(0).texto()).contains("ficticia");
        assertThat(s.advertencias()).isNotEmpty();
    }

    @Test void rectangularConMasFilasQueColumnas() {
        var s = resolver("[[1,10],[10,2],[20,30]]", "min");
        assertThat(total(s)).isEqualTo(3.0); assertThat(pares(s)).hasSize(2);
    }

    @Test void empatesCostosNegativosYMatrizDeUnaCelda() {
        assertThat(total(resolver("[[-5,0],[0,-3]]", "min"))).isEqualTo(-8.0);
        assertThat(total(resolver("[[0,0],[0,0]]", "max"))).isEqualTo(0.0);
        assertThat(total(resolver("[[5,5,5],[5,5,5],[5,5,5]]", "min"))).isEqualTo(15.0);
        var uno = resolver("[[9]]", "min");
        assertThat(total(uno)).isEqualTo(9.0); assertThat(pares(uno)).hasSize(1);
    }

    @Test void frenteAFuerzaBrutaPorPermutacionesEnMatricesAleatorias() {
        var azar = new Random(11);
        for (int caso = 0; caso < 60; caso++) {
            int f = 1 + azar.nextInt(5), c = 1 + azar.nextInt(5); boolean max = azar.nextBoolean();
            int[][] M = new int[f][c];
            for (int[] fila : M) for (int j = 0; j < c; j++) fila[j] = azar.nextInt(41) - 10;
            var s = resolver(Arrays.deepToString(M), max ? "max" : "min");
            double esperado = f <= c ? mejor(M, 0, new HashSet<>(), max) : mejor(transpuesta(M), 0, new HashSet<>(), max);
            assertThat(total(s)).as("%s %s", max ? "max" : "min", Arrays.deepToString(M)).isCloseTo(esperado, within(1e-9));
            Set<Object> columnas = new HashSet<>(), filas = new HashSet<>();
            for (Object p : pares(s)) { assertThat(columnas.add(mapa(p).get("columna"))).isTrue(); assertThat(filas.add(mapa(p).get("fila"))).isTrue(); }
            assertThat(pares(s)).hasSize(Math.min(f, c));
            assertThat(pares(s).stream().mapToDouble(p -> num(mapa(p).get("costo"))).sum()).isCloseTo(total(s), within(1e-9));
        }
    }
    private static int[][] transpuesta(int[][] M) { int[][] T = new int[M[0].length][M.length]; for (int i = 0; i < M.length; i++) for (int j = 0; j < M[0].length; j++) T[j][i] = M[i][j]; return T; }
    // Todas las asignaciones inyectivas de cada fila a una columna distinta (filas <= columnas).
    private static double mejor(int[][] M, int fila, Set<Integer> usadas, boolean max) {
        if (fila == M.length) return 0;
        double mejor = max ? Double.NEGATIVE_INFINITY : Double.POSITIVE_INFINITY;
        for (int j = 0; j < M[0].length; j++) if (usadas.add(j)) {
            double v = M[fila][j] + mejor(M, fila + 1, usadas, max);
            mejor = max ? Math.max(mejor, v) : Math.min(mejor, v);
            usadas.remove(j);
        }
        return mejor;
    }

    @Test void matrizDe20x20SeResuelveYEsInyectiva() {
        var azar = new Random(5); int n = 20; int[][] M = new int[n][n];
        for (int[] fila : M) for (int j = 0; j < n; j++) fila[j] = azar.nextInt(1000);
        var s = resolver(Arrays.deepToString(M), "min");
        assertThat(pares(s)).hasSize(n);
        assertThat(pares(s).stream().map(p -> mapa(p).get("columna")).distinct().count()).isEqualTo(n);
        // Cota inferior independiente: la suma de los mínimos por fila nunca supera el óptimo.
        assertThat(total(s)).isGreaterThanOrEqualTo(Arrays.stream(M).mapToInt(r -> Arrays.stream(r).min().getAsInt()).sum());
        // Certificado de optimalidad (dualidad): la matriz final es M - u_i - v_j >= 0 y vale 0 en las celdas asignadas.
        var pasos = lista(s.resultado().get("pasos"));
        var fin = lista(mapa(pasos.get(pasos.size() - 1)).get("matriz"));
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) {
            double d = M[i][j] - num(lista(fin.get(i)).get(j));   // = u_i + v_j
            assertThat(num(lista(fin.get(i)).get(j))).isGreaterThanOrEqualTo(0);
            assertThat(d - (M[i][0] - num(lista(fin.get(i)).get(0))) - (M[0][j] - num(lista(fin.get(0)).get(j))) + (M[0][0] - num(lista(fin.get(0)).get(0)))).isCloseTo(0, within(1e-9));
        }
        for (Object p : pares(s)) assertThat(num(lista(fin.get(((Number) mapa(p).get("fila")).intValue())).get(((Number) mapa(p).get("columna")).intValue()))).isEqualTo(0.0);
    }

    @Test void entradasInvalidas() {
        assertThatThrownBy(() -> AsignacionSolver.resolver("otro", json("{'matriz':[[1]],'objetivo':'min'}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> AsignacionSolver.resolver("hungaro", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("[]", "min")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("[[1],[2,3]]", "min")).hasMessageContaining("rectangular");
        assertThatThrownBy(() -> resolver("[[1]]", "otro")).hasMessageContaining("min o max");
        assertThatThrownBy(() -> resolver("[['a']]", "min")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("[[1e13]]", "min")).isInstanceOf(IllegalArgumentException.class);
        String grande = Arrays.deepToString(new int[21][21]);
        assertThatThrownBy(() -> resolver(grande, "min")).hasMessageContaining("20");
        assertThatThrownBy(() -> AsignacionSolver.resolver("hungaro", json("{'matriz':[[1]]}"))).hasMessageContaining("min o max");
    }

    @Test void elResultadoSoloContieneTiposSimplesSerializables() {
        var s = resolver(M4, "max");
        TransporteSolverTest.assertSimple(s.resultado()); s.pasos().forEach(p -> TransporteSolverTest.assertSimple(p.tabla()));
    }
}
