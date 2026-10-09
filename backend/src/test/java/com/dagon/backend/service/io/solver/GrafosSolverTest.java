package com.dagon.backend.service.io.solver;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.dagon.backend.service.io.solver.TransporteSolverTest.*;
import static org.assertj.core.api.Assertions.*;

class GrafosSolverTest {
    /** Aristas compactas "origen,destino,valor" -> JSON. */
    static String aristas(String... e) {
        return Arrays.stream(e).map(t -> { String[] p = t.split(","); return "{'origen':'" + p[0] + "','destino':'" + p[1] + "','valor':" + p[2] + "}"; }).collect(Collectors.joining(",", "[", "]"));
    }
    static IoSolucion resolver(String metodo, String datos) { return GrafosSolver.resolver(metodo, json(datos)); }
    // Red de Seervada Park (Hillier-Lieberman): ruta O-T = 13, árbol mínimo = 14.
    static final String SEERVADA = aristas("O,A,2", "O,B,5", "O,C,4", "A,B,2", "A,D,7", "B,C,1", "B,D,4", "B,E,3", "C,E,4", "D,E,1", "D,T,5", "E,T,7");
    // Red de CLRS (fig. 26.1): flujo máximo 23.
    static final String CLRS = aristas("s,v1,16", "s,v2,13", "v1,v3,12", "v2,v1,4", "v2,v4,14", "v3,v2,9", "v3,t,20", "v4,v3,7", "v4,t,4");

    // ---------------- ruta más corta ----------------
    @Test void dijkstraEnSeervadaDa13ConLaRutaYLaTablaDeEtiquetas() {
        var s = resolver("ruta_corta", "{'aristas':" + SEERVADA + ",'origen':'O','destino':'T'}");
        assertThat(s.tipo()).isEqualTo("grafos"); assertThat(s.metodo()).isEqualTo("ruta_corta"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(num(s.resultado().get("distancia"))).isEqualTo(13.0);
        var ruta = lista(s.resultado().get("ruta"));
        assertThat(ruta.get(0)).isEqualTo("O"); assertThat(ruta.get(ruta.size() - 1)).isEqualTo("T");
        var elegidas = lista(s.resultado().get("aristasSolucion"));
        double suma = 0; var valores = json(SEERVADA);
        for (Object i : elegidas) suma += valores.get(((Number) i).intValue()).get("valor").asDouble();
        assertThat(suma).isEqualTo(13.0);
        assertThat(lista(s.resultado().get("nodos"))).containsExactly("A", "B", "C", "D", "E", "O", "T");
        var primera = mapa(lista(s.resultado().get("pasos")).get(0));
        assertThat(primera.get("iteracion")).isEqualTo(1); assertThat(primera.get("nodoFijado")).isEqualTo("O");
        assertThat(primera.get("O")).isEqualTo("0 ✓"); assertThat(primera.get("A")).isEqualTo("2 (O)"); assertThat(primera.get("T")).isEqualTo("∞");
        assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Distancia mínima"); assertThat(s.metricas().get(0).valor()).isEqualTo(13.0);
        assertThat(s.pasos().get(0).texto()).startsWith("Ruta: O → ");
        assertThat(s.pasos().get(1).tabla()).isEqualTo(s.resultado().get("pasos"));
        assertThat(s.advertencias()).isNotEmpty();
    }

    @Test void dijkstraDirigidoDeClrsDa9ConRutaUnica() {
        var s = resolver("ruta_corta", "{'dirigido':true,'origen':'s','destino':'x','aristas':" + aristas("s,t,10", "s,y,5", "t,x,1", "t,y,2", "y,t,3", "y,x,9", "y,z,2", "x,z,4", "z,s,7", "z,x,6") + "}");
        assertThat(num(s.resultado().get("distancia"))).isEqualTo(9.0);
        assertThat(s.resultado().get("ruta")).isEqualTo(List.of("s", "y", "t", "x"));
    }

    @Test void porDefectoLaRutaEsNoDirigidaYConDirigidoTrueSeRespetaElSentido() {
        String a = aristas("A,B,4");
        var libre = resolver("ruta_corta", "{'aristas':" + a + ",'origen':'B','destino':'A'}");
        assertThat(num(libre.resultado().get("distancia"))).isEqualTo(4.0);
        var dirigida = resolver("ruta_corta", "{'aristas':" + a + ",'origen':'B','destino':'A','dirigido':true}");
        assertThat(dirigida.estado()).isEqualTo("infactible"); assertThat(dirigida.resumen()).contains("No existe una ruta de B a A");
        assertThat(dirigida.metricas()).isEmpty(); assertThat(dirigida.resultado().get("distancia")).isNull();
        assertSimple(dirigida.resultado());
    }

    @Test void origenIgualADestinoYAristasDeCostoCero() {
        var s = resolver("ruta_corta", "{'aristas':" + aristas("A,B,0", "B,C,0") + ",'origen':'A','destino':'A'}");
        assertThat(num(s.resultado().get("distancia"))).isEqualTo(0.0); assertThat(s.resultado().get("ruta")).isEqualTo(List.of("A"));
        var cero = resolver("ruta_corta", "{'aristas':" + aristas("A,B,0", "B,C,0") + ",'origen':'A','destino':'C'}");
        assertThat(num(cero.resultado().get("distancia"))).isEqualTo(0.0); assertThat(cero.resultado().get("ruta")).isEqualTo(List.of("A", "B", "C"));
    }

    @Test void decimalesSeAcumulanSinRuidoEnLasEtiquetas() {
        var s = resolver("ruta_corta", "{'aristas':" + aristas("A,B,0.1", "B,C,0.2") + ",'origen':'A','destino':'C'}");
        assertThat(num(s.resultado().get("distancia"))).isCloseTo(0.3, within(1e-12));
        assertThat(mapa(lista(s.resultado().get("pasos")).get(2)).get("C")).isEqualTo("0.3 (B) ✓");
    }

    @Test void nodosSeOrdenanDeFormaNatural() {
        var s = resolver("arbol_minimo", "{'aristas':" + aristas("N10,N2,1", "N2,N1,1", "N1,N20,1") + "}");
        assertThat(lista(s.resultado().get("nodos"))).containsExactly("N1", "N2", "N10", "N20");
    }

    // ---------------- árbol de expansión mínima ----------------
    @Test void kruskalEnSeervadaDa14ConSeisAristas() {
        var s = resolver("arbol_minimo", "{'aristas':" + SEERVADA + "}");
        assertThat(s.metodo()).isEqualTo("arbol_minimo"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(num(s.resultado().get("total"))).isEqualTo(14.0);
        assertThat(lista(s.resultado().get("aristasSolucion"))).hasSize(6);
        assertThat(s.resultado().get("conexo")).isEqualTo(true); assertThat(s.resultado().get("componentes")).isEqualTo(1);
        assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Longitud total del árbol");
        assertThat(s.advertencias()).isEmpty();
        var pasos = lista(s.resultado().get("pasos"));
        assertThat(pasos).hasSize(12);
        assertThat(mapa(pasos.get(0)).get("decision")).isEqualTo("Se agrega");
        assertThat(pasos.stream().filter(p -> mapa(p).get("decision").toString().startsWith("Se descarta")).count()).isEqualTo(6);
    }

    @Test void kruskalEnLaRedDeClrsDa37() {
        var s = resolver("arbol_minimo", "{'aristas':" + aristas("a,b,4", "a,h,8", "b,c,8", "b,h,11", "c,d,7", "c,f,4", "c,i,2", "d,e,9", "d,f,14", "e,f,10", "f,g,2", "g,h,1", "g,i,6", "h,i,7") + "}");
        assertThat(num(s.resultado().get("total"))).isEqualTo(37.0);
        assertThat(lista(s.resultado().get("aristasSolucion"))).hasSize(8);
    }

    @Test void redNoConexaDaUnBosqueYAvisa() {
        var s = resolver("arbol_minimo", "{'aristas':" + aristas("A,B,1", "C,D,2", "D,E,3") + "}");
        assertThat(s.resultado().get("conexo")).isEqualTo(false); assertThat(s.resultado().get("componentes")).isEqualTo(2);
        assertThat(num(s.resultado().get("total"))).isEqualTo(6.0);
        assertThat(s.advertencias()).hasSize(1); assertThat(s.advertencias().get(0)).contains("no es conexa", "2 componentes");
    }

    @Test void kruskalAceptaPesosNegativosYAristasParalelas() {
        var s = resolver("arbol_minimo", "{'aristas':" + aristas("A,B,5", "A,B,-2", "B,C,0") + "}");
        assertThat(num(s.resultado().get("total"))).isEqualTo(-2.0);
        assertThat(s.resultado().get("aristasSolucion")).isEqualTo(List.of(1, 2));
    }

    // ---------------- flujo máximo ----------------
    @Test void edmondsKarpEnClrsDa23YElCorteMinimoIgualaElFlujo() {
        var s = resolver("flujo_maximo", "{'aristas':" + CLRS + ",'origen':'s','destino':'t'}");
        assertThat(s.metodo()).isEqualTo("flujo_maximo"); assertThat(s.estado()).isEqualTo("optimo");
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(23.0);
        assertThat(s.metricas().get(0).etiqueta()).isEqualTo("Flujo máximo"); assertThat(s.metricas().get(0).valor()).isEqualTo(23.0);
        var red = json(CLRS); double capacidadCorte = 0;
        for (Object i : lista(s.resultado().get("corteMinimo"))) capacidadCorte += red.get(((Number) i).intValue()).get("valor").asDouble();
        assertThat(capacidadCorte).isEqualTo(23.0);
        assertThat(lista(s.resultado().get("ladoFuente"))).containsExactly("s", "v1", "v2", "v4");
        // Conservación del flujo en los nodos internos y respeto de las capacidades.
        var flujos = lista(s.resultado().get("flujos"));
        for (String nodo : List.of("v1", "v2", "v3", "v4")) {
            double entra = 0, sale = 0;
            for (int i = 0; i < red.size(); i++) {
                double f = num(mapa(flujos.get(i)).get("flujo"));
                if (red.get(i).get("destino").asText().equals(nodo)) entra += f;
                if (red.get(i).get("origen").asText().equals(nodo)) sale += f;
            }
            assertThat(entra).as(nodo).isCloseTo(sale, within(1e-9));
        }
        for (int i = 0; i < red.size(); i++) assertThat(num(mapa(flujos.get(i)).get("flujo"))).isBetween(0.0, red.get(i).get("valor").asDouble());
        var primera = mapa(lista(s.resultado().get("pasos")).get(0));
        assertThat(primera.get("caminoAumentante").toString()).startsWith("s → ").endsWith(" → t");
        var ultima = mapa(lista(s.resultado().get("pasos")).get(lista(s.resultado().get("pasos")).size() - 1));
        assertThat(num(ultima.get("flujoAcumulado"))).isEqualTo(23.0);
        assertThat(s.pasos()).hasSize(3);
    }

    @Test void flujoEnSeervadaDa14() {
        var red = aristas("O,A,5", "O,B,7", "O,C,4", "A,B,1", "A,D,3", "B,C,2", "B,D,4", "B,E,5", "C,E,4", "D,T,9", "E,D,1", "E,T,6");
        var s = resolver("flujo_maximo", "{'aristas':" + red + ",'origen':'O','destino':'T'}");
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(14.0);
    }

    @Test void flujoPorDefectoEsDirigidoYConDirigidoFalseSePuedeIrEnContra() {
        String a = aristas("A,B,5", "B,C,3");
        assertThat(num(resolver("flujo_maximo", "{'aristas':" + a + ",'origen':'C','destino':'A'}").resultado().get("flujoMaximo"))).isEqualTo(0.0);
        var s = resolver("flujo_maximo", "{'aristas':" + a + ",'origen':'C','destino':'A','dirigido':false}");
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(3.0);
        // El corte B-C (aristas[1]) cruza hacia dentro del lado de la fuente: en una red no dirigida también cuenta.
        assertThat(s.resultado().get("corteMinimo")).isEqualTo(List.of(1));
        assertThat(lista(s.resultado().get("flujos")).stream().map(f -> num(mapa(f).get("flujo"))).toList()).containsExactly(3.0, 3.0);
    }

    @Test void aristasParalelasSeSumanYElFlujoSeReparteSinExcederCapacidad() {
        var s = resolver("flujo_maximo", "{'aristas':" + aristas("O,T,3", "O,T,3") + ",'origen':'O','destino':'T'}");
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(6.0);
        assertThat(lista(s.resultado().get("flujos")).stream().map(f -> num(mapa(f).get("flujo"))).toList()).containsExactly(3.0, 3.0);
        var antiparalelas = resolver("flujo_maximo", "{'aristas':" + aristas("O,A,5", "A,O,4", "A,T,3") + ",'origen':'O','destino':'T'}");
        assertThat(num(antiparalelas.resultado().get("flujoMaximo"))).isEqualTo(3.0);
    }

    @Test void sinCaminoElFlujoEsCeroYElCorteEstaVacio() {
        var s = resolver("flujo_maximo", "{'aristas':" + aristas("O,A,3", "B,T,3") + ",'origen':'O','destino':'T'}");
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(0.0); assertThat(lista(s.resultado().get("corteMinimo"))).isEmpty();
        assertThat(lista(s.resultado().get("pasos"))).isEmpty();
    }

    @Test void capacidadesDecimalesYAristasDeCapacidadCero() {
        var s = resolver("flujo_maximo", "{'aristas':" + aristas("O,A,0.5", "O,B,0.25", "A,T,0.3", "B,T,0.4", "A,B,0") + ",'origen':'O','destino':'T'}");
        assertThat(num(s.resultado().get("flujoMaximo"))).isCloseTo(0.55, within(1e-12));
    }

    @Test void redGrandeDe80AristasSeResuelveRapido() {
        // Fuente -> capa a (4 nodos, cap 10) -> b -> c -> d -> e (aristas completas, cap 5) -> sumidero (cap 7): 4 + 64 + 4 = 72 aristas.
        List<String> e = new java.util.ArrayList<>();
        for (int i = 0; i < 4; i++) e.add("S,a" + i + ",10");
        for (String capa : List.of("ab", "bc", "cd", "de")) for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) e.add(capa.charAt(0) + "" + i + "," + capa.charAt(1) + j + ",5");
        for (int j = 0; j < 4; j++) e.add("e" + j + ",T,7");
        assertThat(e).hasSize(72);
        long t0 = System.nanoTime();
        var s = resolver("flujo_maximo", "{'aristas':" + aristas(e.toArray(String[]::new)) + ",'origen':'S','destino':'T'}");
        assertThat((System.nanoTime() - t0) / 1_000_000).isLessThan(2000);
        assertThat(num(s.resultado().get("flujoMaximo"))).isEqualTo(28.0);   // lo limita el sumidero: 4 * 7
    }

    // ---------------- contra oráculos independientes ----------------
    @Test void grafosAleatoriosCoincidenConFloydWarshallPrimYElCorteMinimoPorFuerzaBruta() {
        var azar = new java.util.Random(8);
        for (int caso = 0; caso < 80; caso++) {
            int n = 3 + azar.nextInt(5); boolean dirigido = azar.nextBoolean();
            List<String> e = new java.util.ArrayList<>(); int[][] w = new int[n][n];   // w = peso de la arista (0 = no hay)
            for (int i = 1; i < n; i++) { int j = azar.nextInt(i), peso = 1 + azar.nextInt(9); e.add("N" + j + ",N" + i + "," + peso); w[j][i] = peso; }   // conexa
            for (int k = 0; k < n; k++) { int a = azar.nextInt(n), b = azar.nextInt(n); if (a != b && w[a][b] == 0 && (dirigido || w[b][a] == 0)) { int peso = 1 + azar.nextInt(9); e.add("N" + a + ",N" + b + "," + peso); w[a][b] = peso; } }
            String aristas = aristas(e.toArray(String[]::new));
            // Dijkstra vs Floyd-Warshall (los nombres N0..N7 ordenan igual que los índices).
            double[][] dist = new double[n][n];
            for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) dist[i][j] = i == j ? 0 : Double.POSITIVE_INFINITY;
            for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (w[i][j] > 0) { dist[i][j] = Math.min(dist[i][j], w[i][j]); if (!dirigido) dist[j][i] = Math.min(dist[j][i], w[i][j]); }
            for (int k = 0; k < n; k++) for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
            int s = azar.nextInt(n), t = azar.nextInt(n);
            var ruta = resolver("ruta_corta", "{'aristas':" + aristas + ",'origen':'N" + s + "','destino':'N" + t + "','dirigido':" + dirigido + "}");
            if (Double.isInfinite(dist[s][t])) { assertThat(ruta.estado()).isEqualTo("infactible"); }
            else assertThat(num(ruta.resultado().get("distancia"))).as(aristas).isEqualTo(dist[s][t]);
            // Kruskal vs Prim (grafo no dirigido y conexo; se ignora el sentido).
            double prim = 0; boolean[] dentro = new boolean[n]; double[] cota = new double[n]; Arrays.fill(cota, Double.POSITIVE_INFINITY); cota[0] = 0;
            for (int k = 0; k < n; k++) {
                int u = -1; for (int i = 0; i < n; i++) if (!dentro[i] && (u < 0 || cota[i] < cota[u])) u = i;
                dentro[u] = true; prim += cota[u];
                for (int v = 0; v < n; v++) { int peso = w[u][v] > 0 && w[v][u] > 0 ? Math.min(w[u][v], w[v][u]) : Math.max(w[u][v], w[v][u]); if (peso > 0 && !dentro[v]) cota[v] = Math.min(cota[v], peso); }
            }
            assertThat(num(resolver("arbol_minimo", "{'aristas':" + aristas + "}").resultado().get("total"))).as(aristas).isEqualTo(prim);
            // Flujo máximo = capacidad del corte mínimo (enumerando los 2^(n-2) cortes s-t).
            if (s != t) {
                double mejor = Double.POSITIVE_INFINITY;
                for (int mask = 0; mask < (1 << n); mask++) {
                    if ((mask >> s & 1) == 0 || (mask >> t & 1) == 1) continue;
                    double cap = 0;
                    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if ((mask >> i & 1) == 1 && (mask >> j & 1) == 0) cap += dirigido ? w[i][j] : w[i][j] + w[j][i];
                    mejor = Math.min(mejor, cap);
                }
                var flujo = resolver("flujo_maximo", "{'aristas':" + aristas + ",'origen':'N" + s + "','destino':'N" + t + "','dirigido':" + dirigido + "}");
                assertThat(num(flujo.resultado().get("flujoMaximo"))).as(aristas + " " + s + "->" + t + " dirigido=" + dirigido).isEqualTo(mejor);
                // El corte devuelto tiene exactamente la capacidad del flujo.
                var red = json(aristas); double capacidadCorte = 0;
                for (Object i : lista(flujo.resultado().get("corteMinimo"))) capacidadCorte += red.get(((Number) i).intValue()).get("valor").asDouble();
                assertThat(capacidadCorte).isEqualTo(mejor);
            }
        }
    }

    // ---------------- validación ----------------
    @Test void entradasInvalidas() {
        assertThatThrownBy(() -> GrafosSolver.resolver("otro", json("{'aristas':" + SEERVADA + "}"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> GrafosSolver.resolver("arbol_minimo", null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':[]}")).hasMessageContaining("80");
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':" + aristas("A,A,1") + "}")).hasMessageContaining("consigo mismo");
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':[{'origen':'A','destino':'B'}]}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':[{'origen':'A','destino':'B','valor':'x'}]}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':[{'origen':' ','destino':'B','valor':1}]}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("ruta_corta", "{'aristas':" + aristas("A,B,-1") + ",'origen':'A','destino':'B'}")).hasMessageContaining("mayor o igual que 0");
        assertThatThrownBy(() -> resolver("flujo_maximo", "{'aristas':" + aristas("A,B,-1") + ",'origen':'A','destino':'B'}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> resolver("ruta_corta", "{'aristas':" + aristas("A,B,1") + ",'origen':'Z','destino':'B'}")).hasMessageContaining("origen");
        assertThatThrownBy(() -> resolver("ruta_corta", "{'aristas':" + aristas("A,B,1") + ",'origen':'A'}")).hasMessageContaining("destino");
        assertThatThrownBy(() -> resolver("flujo_maximo", "{'aristas':" + aristas("A,B,1") + ",'origen':'A','destino':'A'}")).hasMessageContaining("distintos");
        assertThatThrownBy(() -> resolver("flujo_maximo", "{'aristas':" + aristas("A,B,1") + ",'origen':'A','destino':'B','dirigido':'si'}")).hasMessageContaining("dirigida");
        assertThatThrownBy(() -> resolver("ruta_corta", "{'aristas':[{'origen':'" + "x".repeat(31) + "','destino':'B','valor':1}],'origen':'B','destino':'B'}")).hasMessageContaining("30");
    }

    @Test void masDe80AristasSeRechazan() {
        String[] e = IntStream.range(0, 81).mapToObj(i -> "N" + i + ",N" + (i + 1) + ",1").toArray(String[]::new);
        assertThatThrownBy(() -> resolver("arbol_minimo", "{'aristas':" + aristas(e) + "}")).hasMessageContaining("80");
        String[] ok = IntStream.range(0, 80).mapToObj(i -> "N" + i + ",N" + (i + 1) + ",1").toArray(String[]::new);
        assertThat(num(resolver("arbol_minimo", "{'aristas':" + aristas(ok) + "}").resultado().get("total"))).isEqualTo(80.0);
    }

    @Test void losResultadosSoloContienenTiposSimplesSerializables() {
        assertSimple(resolver("ruta_corta", "{'aristas':" + SEERVADA + ",'origen':'O','destino':'T'}").resultado());
        assertSimple(resolver("arbol_minimo", "{'aristas':" + SEERVADA + "}").resultado());
        var f = resolver("flujo_maximo", "{'aristas':" + CLRS + ",'origen':'s','destino':'t'}");
        assertSimple(f.resultado()); f.pasos().forEach(p -> assertSimple(p.tabla()));
    }
}
