package com.dagon.backend.controller;

import com.dagon.backend.service.io.IoInterpretacionService;
import com.dagon.backend.service.clawbot.ClawbotRateLimiter;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class IoControllerTest {
    private final IoInterpretacionService service = mock(IoInterpretacionService.class);
    private final ClawbotRateLimiter limiter = mock(ClawbotRateLimiter.class);
    private final IoController controller = new IoController(service, limiter);
    @Test void exigeAutenticacionYTamanioAntesDeProveedor() {
        assertThatThrownBy(() -> controller.interpretar(Map.of("enunciado", "Texto suficientemente largo para interpretar."), null)).isInstanceOf(ResponseStatusException.class);
        var auth = new UsernamePasswordAuthenticationToken("usuario", "token", java.util.List.of());
        for (Object texto : java.util.List.of("corto", "x".repeat(12001), 123)) assertThatThrownBy(() -> controller.interpretar(Map.of("enunciado", texto), auth)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(service, limiter);
    }
    @Test void comparteLimiteDeAnalisisPorUsuario() {
        String texto = "Enunciado suficientemente largo para interpretar.";
        var auth = new UsernamePasswordAuthenticationToken("usuario", "token", java.util.List.of());
        when(service.interpretar(texto)).thenReturn(com.dagon.backend.service.io.IoInterpretacion.incompleto("Faltan datos", java.util.List.of("¿Cuál es la demanda?")));
        controller.interpretar(Map.of("enunciado", texto), auth);
        verify(limiter).consume("usuario", "analysis"); verify(service).interpretar(texto);
    }
    @Test void jackson3SerializaModeloComoDatosDelContratoSinFlagsDeJackson2() throws Exception {
        String texto = "Demanda anual 1200 unidades y costos de pedido 50 y mantenimiento 2.";
        var modelo = new com.fasterxml.jackson.databind.ObjectMapper().readTree("{\"tipo\":\"inventarios\",\"metodo\":\"eoq\",\"variables\":[],\"datos\":{\"D\":1200,\"S\":50,\"H\":2},\"evidencias\":[]}");
        when(service.interpretar(texto)).thenReturn(new com.dagon.backend.service.io.IoInterpretacion("listo", "local", "EOQ", modelo, java.util.List.of(), java.util.List.of(), java.util.List.of()));
        var auth = new UsernamePasswordAuthenticationToken("usuario", "token", java.util.List.of());
        var mapper = tools.jackson.databind.json.JsonMapper.builder().build();
        var json = mapper.readTree(mapper.writeValueAsString(controller.interpretar(Map.of("enunciado", texto), auth)));
        assertThat(json.path("modelo").path("tipo").asString()).isEqualTo("inventarios");
        assertThat(json.path("modelo").path("datos").path("D").asInt()).isEqualTo(1200);
        assertThat(json.path("modelo").has("nodeType")).isFalse();
        when(service.interpretar(texto)).thenReturn(com.dagon.backend.service.io.IoInterpretacion.incompleto("Faltan datos", java.util.List.of("¿Cuál es H?")));
        assertThat(mapper.readTree(mapper.writeValueAsString(controller.interpretar(Map.of("enunciado", texto), auth))).path("modelo").isNull()).isTrue();
    }
}
