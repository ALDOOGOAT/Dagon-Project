package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class IoInterpretacionServiceTest {
    // Modelo de IA para IoParserLocalTest.PL; la cita es literal del enunciado.
    private com.fasterxml.jackson.databind.JsonNode mesas(String objetivo, String primera) throws Exception {
        return new ObjectMapper().readTree("{\"estado\":\"listo\",\"resumen\":\"Mesas y sillas\",\"preguntas\":[],\"advertencias\":[],\"supuestos\":[],\"modelo\":{\"tipo\":\"pl\",\"metodo\":\"simplex\","
                + "\"variables\":[{\"simbolo\":\"x1\",\"nombre\":\"Mesas\"},{\"simbolo\":\"x2\",\"nombre\":\"Sillas\"}],"
                + "\"datos\":{\"objetivo\":\"" + objetivo + "\",\"restricciones\":[\"" + primera + "\",\"x2<=6\",\"3x1+2x2<=18\",\"x1,x2>=0\"]},"
                + "\"evidencias\":[{\"campo\":\"datos.restricciones\",\"texto\":\"hay 18 horas de acabado disponibles\"}]}}");
    }
    private static double z(IoResultado r) { return ((Number) r.solucion().resultado().get("z")).doubleValue(); }

    @Test void sinIaDisponibleElServidorInterpretaYResuelve() throws Exception {
        var proveedor = mock(IoProveedorClient.class);
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(IoParserLocalTest.PL);
        assertThat(r.interpretacion().fuente()).isEqualTo("local");
        assertThat(r.solucion().estado()).isEqualTo("optimo");
        assertThat(z(r)).isCloseTo(36, within(1e-9));
        verify(proveedor, never()).extraer(anyString(), anyString());
    }
    @Test void laIaEsElPrimerIntentoYSuModeloLoResuelveElServidor() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        when(proveedor.extraer("groq", IoParserLocalTest.PL)).thenReturn(mesas("max z=3x1+5x2", "x1<=4"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(IoParserLocalTest.PL);
        assertThat(r.interpretacion().fuente()).isEqualTo("groq");
        assertThat(z(r)).isCloseTo(36, within(1e-9));
        assertThat(r.interpretacion().advertencias()).noneMatch(a -> a.contains("otra forma"));
    }
    @Test void modeloDeIaSinOptimoSeDescartaYResuelveElServidor() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        when(proveedor.extraer("groq", IoParserLocalTest.PL)).thenReturn(mesas("max z=3x1+5x2", "x1>=40"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(IoParserLocalTest.PL);
        assertThat(r.interpretacion().fuente()).isEqualTo("local");
        assertThat(z(r)).isCloseTo(36, within(1e-9));
    }
    @Test void siLaIaYElServidorLeenCifrasDistintasSeAdvierte() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        when(proveedor.extraer("groq", IoParserLocalTest.PL)).thenReturn(mesas("max z=3x1+6x2", "x1<=4"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(IoParserLocalTest.PL);
        assertThat(r.interpretacion().fuente()).isEqualTo("groq");
        assertThat(r.interpretacion().advertencias()).anyMatch(a -> a.contains("otra forma"));
    }
    @Test void loResueltoSeGuardaEnLaBdYLoLeidoDeLaBdSeRevalida() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        when(proveedor.extraer("groq", IoParserLocalTest.PL)).thenReturn(mesas("max z=3x1+5x2", "x1<=4"));
        var bd = mock(com.dagon.backend.service.clawbot.ClawbotCacheService.class);
        when(bd.clave(eq("io_modelo"), anyString())).thenReturn("k");
        // Fila alterada: cita inventada. No debe salir; se vuelve a interpretar.
        when(bd.buscar("k")).thenReturn(java.util.Optional.of("{\"fuente\":\"groq\",\"resumen\":\"x\",\"modelo\":{\"tipo\":\"pl\",\"metodo\":\"simplex\",\"variables\":[],"
                + "\"datos\":{\"objetivo\":\"max z=99x1\",\"restricciones\":[\"x1<=99\"]},\"evidencias\":[{\"campo\":\"datos\",\"texto\":\"cifra 99 inventada\"}]}}"));
        var servicio = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator(), new com.dagon.backend.service.io.solver.IoSolverService(), bd);
        var r = servicio.resolver(IoParserLocalTest.PL);
        assertThat(z(r)).isCloseTo(36, within(1e-9));
        verify(proveedor).extraer("groq", IoParserLocalTest.PL);
        verify(bd).guardar(eq("k"), contains("3x1+5x2"), eq("groq"));
    }
    @Test void modeloEscritoAManoSeValidaYSeResuelve() throws Exception {
        var servicio = new IoInterpretacionService(new IoParserLocal(), mock(IoProveedorClient.class), new IoModeloValidator());
        var r = servicio.resolverModelo(new ObjectMapper().readTree("{\"tipo\":\"colas\",\"metodo\":\"mm1\",\"datos\":{\"lambda\":2,\"mu\":3},\"variables\":[]}"));
        assertThat(((Number) r.solucion().resultado().get("L")).doubleValue()).isCloseTo(2, within(1e-9));
        var invalido = servicio.resolverModelo(new ObjectMapper().readTree("{\"tipo\":\"colas\",\"metodo\":\"mm1\",\"datos\":{\"lambda\":5,\"mu\":3},\"variables\":[]}"));
        assertThat(invalido.solucion()).isNull();
    }
    @Test void respuestaProveedorSeValidaYSanitizaAntesDeSalir() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        String enunciado = "Tengo un problema de inventario incompleto sin costos. ¿Qué falta?";
        when(proveedor.extraer("groq", enunciado)).thenReturn(new ObjectMapper().readTree("{\"estado\":\"incompleto\",\"resumen\":\"Faltan costos\",\"preguntas\":[\"¿Cuál es el costo por pedido?\"],\"secreto\":\"no exponer\"}"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(enunciado);
        assertThat(r.fuente()).isEqualTo("groq"); assertThat(r.modelo()).isNull(); assertThat(r.preguntas()).hasSize(1);
    }
    @Test void proveedorFallaYLocalAdmiteQueNoSabe() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        String enunciado = "Modela un transporte sin matriz de costos ni destinos.";
        when(proveedor.extraer("groq", enunciado)).thenThrow(new IllegalStateException("error sensible del proveedor"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(enunciado);
        assertThat(r.fuente()).isEqualTo("local"); assertThat(r.estado()).isEqualTo("incompleto");
        assertThat(r.preguntas().get(0)).contains("saturado");
        assertThat(r.toString()).doesNotContain("error sensible");
    }
    static final String SI_NO = "Una empresa evalúa 3 proyectos y cada uno se acepta completo o se rechaza (decisión de sí o no). Los beneficios son 14, 10 y 15 millones; los costos son 9, 6 y 2 millones. El presupuesto es de 14 millones. ¿Qué proyectos elegir para maximizar el beneficio?";
    private com.fasterxml.jackson.databind.JsonNode pl(String extra) throws Exception {
        return new ObjectMapper().readTree("{\"estado\":\"listo\",\"resumen\":\"Seleccion\",\"preguntas\":[],\"advertencias\":[],\"supuestos\":[],\"modelo\":{\"tipo\":\"pl\",\"metodo\":\"" + (extra.isEmpty() ? "simplex" : "branch_bound") + "\","
                + "\"variables\":[{\"simbolo\":\"x1\",\"nombre\":\"P1\"},{\"simbolo\":\"x2\",\"nombre\":\"P2\"},{\"simbolo\":\"x3\",\"nombre\":\"P3\"}],"
                + "\"datos\":{\"objetivo\":\"max z=14x1+10x2+15x3\",\"restricciones\":[\"9x1+6x2+2x3<=14\",\"x1,x2,x3>=0\"]" + extra + "},"
                + "\"evidencias\":[{\"campo\":\"datos.restricciones\",\"texto\":\"El presupuesto es de 14 millones.\"}]}}");
    }
    @Test void modeloContinuoParaTextoSiONoSeRechazaYSePruebaOtraFuente() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer("groq", SI_NO)).thenReturn(pl(""));
        when(proveedor.extraer("gemini", SI_NO)).thenReturn(pl(",\"binarias\":[\"x1\",\"x2\",\"x3\"]"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(SI_NO);
        assertThat(r.estado()).isEqualTo("listo"); assertThat(r.fuente()).isEqualTo("gemini");
        assertThat(r.modelo().path("metodo").asText()).isEqualTo("branch_bound");
    }
    @Test void siNingunaFuenteDeclaraIntegralidadElServidorUsaSuModeloBinario() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer(anyString(), eq(SI_NO))).thenReturn(pl(""));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(SI_NO);
        assertThat(r.interpretacion().fuente()).isEqualTo("local");
        assertThat(r.interpretacion().modelo().path("metodo").asText()).isEqualTo("branch_bound");
        assertThat(z(r)).isCloseTo(29, within(1e-9)); // proyectos 1 y 3: 14+15 con costo 11 ≤ 14
    }
    @Test void siNingunaFuenteDeclaraIntegralidadYElServidorNoEntiendePideAclarar() throws Exception {
        String texto = SI_NO.replace("Los beneficios son 14, 10 y 15 millones; los costos son 9, 6 y 2 millones.", "Los datos están en la hoja adjunta del proyecto.");
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer(anyString(), eq(texto))).thenReturn(pl(""));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(texto);
        assertThat(r.estado()).isEqualTo("incompleto"); assertThat(r.modelo()).isNull();
    }
    @Test void textoContinuoNoActivaLaGuarda() {
        assertThat(IoParserLocal.exigeEnteros(IoParserLocalTest.PL)).isFalse();
        assertThat(IoParserLocal.exigeEnteros("Maximiza la ganancia; las cantidades pueden ser fraccionarias.")).isFalse();
        assertThat(IoParserLocal.exigeEnteros("Solo se fabrican unidades completas.")).isTrue();
        assertThat(IoParserLocal.exigeEnteros(SI_NO)).isTrue();
    }
    @Test void soloEnterasNoBastaCuandoElTextoEsDeSiONo() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer("groq", SI_NO)).thenReturn(pl(",\"enteras\":[\"x1\",\"x2\",\"x3\"]"));
        when(proveedor.extraer("gemini", SI_NO)).thenReturn(pl(",\"binarias\":[\"x1\",\"x2\",\"x3\"]"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(SI_NO);
        assertThat(r.fuente()).isEqualTo("gemini");
        assertThat(r.modelo().path("datos").path("binarias").size()).isEqualTo(3);
    }
    @Test void enterasBastanCuandoElTextoNoEsBinario() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        String texto = SI_NO.replace("(decisión de sí o no)", "").replace("se acepta completo o se rechaza", "se fabrica en unidades completas");
        when(proveedor.extraer("groq", texto)).thenReturn(pl(",\"enteras\":[\"x1\",\"x2\",\"x3\"]"));
        assertThat(new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(texto).estado()).isEqualTo("listo");
    }
    static final String CAFE = "Una cafetería vende Frappuccinos y Lattes. Cada Frappuccino genera una utilidad de $50 y requiere 4 onzas de jarabe y 2 de café; cada Latte genera $30 y requiere 3 onzas de jarabe y 1 de café. El inventario diario está limitado a 120 onzas de jarabe y 50 de café. ¿Cuántos de cada uno maximizan la utilidad?";
    @Test void laPalabraInventarioSolaNoActivaElParserDeInventariosNiSusPreguntas() {
        var r = new IoParserLocal().interpretar(CAFE);
        assertThat(r.preguntas()).noneMatch(p -> p.contains("demanda anual") || p.contains("pedido"));
    }
    @Test void conFuentesCaidasElServidorResuelveLoQueEntiende() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer(anyString(), eq(CAFE))).thenThrow(new IllegalStateException("429"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).resolver(CAFE);
        assertThat(r.interpretacion().fuente()).isEqualTo("local");
        assertThat(z(r)).isCloseTo(1350, within(1e-9)); // (15, 20): 4x1+3x2=120 y 2x1+x2=50
    }
    @Test void conFuentesCaidasNoSeMuestranPreguntasDeUnParserQueNoEntendio() throws Exception {
        String texto = "Una cooperativa quiere repartir sus turnos de la mejor manera posible entre sus socios durante la temporada alta.";
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer(anyString(), eq(texto))).thenThrow(new IllegalStateException("429"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(texto);
        assertThat(r.estado()).isEqualTo("incompleto");
        assertThat(r.preguntas()).hasSize(1).allMatch(p -> p.contains("saturado") && !p.contains("demanda"));
    }
    @Test void unMismoEnunciadoNoVuelveAConsultarLaIa() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq"));
        when(proveedor.extraer("groq", SI_NO)).thenReturn(pl(",\"binarias\":[\"x1\",\"x2\",\"x3\"]"));
        var servicio = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator());
        assertThat(servicio.interpretar(SI_NO).estado()).isEqualTo("listo");
        assertThat(servicio.interpretar("  " + SI_NO.toUpperCase() + " ").estado()).isEqualTo("listo");
        verify(proveedor, times(1)).extraer(anyString(), anyString());
    }
    @Test void siUnProveedorDevuelveUnModeloQueNoPasaElContratoSeProbaraLaSiguienteFuente() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        var malo = (com.fasterxml.jackson.databind.node.ObjectNode) pl(",\"binarias\":[\"x1\",\"x2\",\"x3\"]");
        ((com.fasterxml.jackson.databind.node.ObjectNode) malo.get("modelo")).set("evidencias", new ObjectMapper().readTree("[{\"campo\":\"datos\",\"texto\":\"cifra 77 inventada\"}]"));
        when(proveedor.extraer("groq", SI_NO)).thenReturn(malo);
        when(proveedor.extraer("gemini", SI_NO)).thenReturn(pl(",\"binarias\":[\"x1\",\"x2\",\"x3\"]"));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(SI_NO);
        assertThat(r.estado()).isEqualTo("listo"); assertThat(r.fuente()).isEqualTo("gemini");
    }
}
