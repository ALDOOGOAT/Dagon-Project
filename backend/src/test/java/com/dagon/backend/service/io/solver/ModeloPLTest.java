package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class ModeloPLTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static ObjectNode pl(String objetivo, String... restricciones) {
        ObjectNode d = JSON.createObjectNode().put("objetivo", objetivo);
        var lista = d.putArray("restricciones"); for (String r : restricciones) lista.add(r);
        return d;
    }

    @Test void parseaObjetivoYRestriccionesYOrdenaLasVariablesDeFormaNatural() {
        var m = ModeloPL.parsear(pl("max z=3x1+5x10", "x1+2x2<=40", "x1-x10>=-3", "x1,x2,x10>=0"));
        assertThat(m.max()).isTrue();
        assertThat(m.variables()).containsExactly("x1", "x2", "x10");
        assertThat(m.c()).containsExactly(3, 0, 5);
        assertThat(m.A()[0]).containsExactly(1, 2, 0);
        assertThat(m.A()[1]).containsExactly(1, 0, -1);
        assertThat(m.ops()).containsExactly("<=", ">=");
        assertThat(m.b()).containsExactly(40, -3);
        assertThat(m.enteras()).isEmpty(); assertThat(m.binarias()).isEmpty();
    }

    @Test void muevePasaVariablesDelLadoDerechoALaIzquierdaYLasConstantesALaDerecha() {
        var m = ModeloPL.parsear(pl("min z = x + y", "x + 2 <= 6 - y", "3x >= y", "x,y>=0"));
        assertThat(m.max()).isFalse();
        assertThat(m.A()[0]).containsExactly(1, 1); assertThat(m.b()[0]).isEqualTo(4);
        assertThat(m.A()[1]).containsExactly(3, -1); assertThat(m.b()[1]).isEqualTo(0); assertThat(m.ops()[1]).isEqualTo(">=");
    }

    @Test void aceptaSimbolosUnicodeEIgualdad() {
        var m = ModeloPL.parsear(pl("max z=x", "x ≤ 5", "x ≥ 1", "x = 3"));
        assertThat(m.ops()).containsExactly("<=", ">=", "=");
    }

    @Test void declaraEnterasYBinariasEnTextoOEnListas() {
        var m = ModeloPL.parsear(pl("max z=x1+x2+y1+y2", "x1+x2+y1+y2<=9", "x1,x2 enteras", "y1 binaria", "y2 ∈ {0,1}"));
        assertThat(m.enteras()).containsExactlyInAnyOrder("x1", "x2");
        assertThat(m.binarias()).containsExactlyInAnyOrder("y1", "y2");
        assertThat(m.A()).hasNumberOfRows(1);

        ObjectNode d = pl("max z=a+b+c", "a+b+c<=9"); d.putArray("enteras").add("a"); d.putArray("binarias").add("c");
        var m2 = ModeloPL.parsear(d);
        assertThat(m2.enteras()).containsExactly("a"); assertThat(m2.binarias()).containsExactly("c");
    }

    @Test void unaVariableSoloDeclaradaNoNegativaSeIncluyeEnElModelo() {
        var m = ModeloPL.parsear(pl("max z=x1", "x1<=4", "x1,x3>=0"));
        assertThat(m.variables()).containsExactly("x1", "x3");
        assertThat(m.c()).containsExactly(1, 0);
    }

    @Test void rechazaObjetivosInvalidos() {
        assertThatThrownBy(() -> ModeloPL.parsear(pl("3x+2y", "x<=1"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("max o min");
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=3x+5", "x<=1"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("término constante");
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=x*y", "x<=1"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("no es lineal");
        assertThatThrownBy(() -> ModeloPL.parsear(JSON.createObjectNode())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ModeloPL.parsear(null)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Faltan los datos");
    }

    @Test void rechazaRestriccionesInvalidas() {
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=x", "x"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Restricción inválida");
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=x", "x^2<=4"))).isInstanceOf(IllegalArgumentException.class);
        ObjectNode noLista = JSON.createObjectNode().put("objetivo", "max z=x").put("restricciones", "x<=1");
        assertThatThrownBy(() -> ModeloPL.parsear(noLista)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("lista");
        ObjectNode noTexto = JSON.createObjectNode().put("objetivo", "max z=x"); noTexto.putArray("restricciones").add(5);
        assertThatThrownBy(() -> ModeloPL.parsear(noTexto)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void rechazaEnterasQueNoAparecenEnElModelo() {
        ObjectNode d = pl("max z=x", "x<=4"); d.putArray("enteras").add("w");
        assertThatThrownBy(() -> ModeloPL.parsear(d)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("no aparece en el modelo");
    }

    @Test void limitaVariablesYRestricciones() {
        StringBuilder suma = new StringBuilder("x1");
        for (int i = 2; i <= 61; i++) suma.append("+x").append(i);
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=" + suma, suma + "<=10"))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("60 variables");
        List<String> rs = new java.util.ArrayList<>(); for (int i = 0; i < 61; i++) rs.add("x<=" + (i + 1));
        assertThatThrownBy(() -> ModeloPL.parsear(pl("max z=x", rs.toArray(new String[0])))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("60 restricciones");
        // El límite exacto sí se acepta.
        List<String> sesenta = rs.subList(0, 60);
        assertThat(ModeloPL.parsear(pl("max z=x", sesenta.toArray(new String[0]))).A()).hasNumberOfRows(60);
    }
}
