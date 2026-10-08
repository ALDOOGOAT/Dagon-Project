package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class IoInterpretacionServiceTest {
    @Test void ejemploLocalNoConsumeProveedor() {
        var proveedor = mock(IoProveedorClient.class);
        var service = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator());
        assertThat(service.interpretar(IoParserLocalTest.PL).estado()).isEqualTo("listo");
        verifyNoInteractions(proveedor);
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
        assertThat(r.fuente()).isEqualTo("local"); assertThat(r.estado()).isEqualTo("no_soportado");
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
    @Test void siNingunaFuenteDeclaraIntegralidadPideAclararEnLugarDeDarUnNumeroErroneo() throws Exception {
        var proveedor = mock(IoProveedorClient.class); when(proveedor.fuentesDisponibles()).thenReturn(List.of("groq", "gemini"));
        when(proveedor.extraer(anyString(), eq(SI_NO))).thenReturn(pl(""));
        var r = new IoInterpretacionService(new IoParserLocal(), proveedor, new IoModeloValidator()).interpretar(SI_NO);
        assertThat(r.estado()).isEqualTo("incompleto"); assertThat(r.modelo()).isNull();
        assertThat(r.preguntas().get(0)).contains("binarias");
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
}
