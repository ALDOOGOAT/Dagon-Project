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
}
