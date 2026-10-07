package com.dagon.backend.service.io;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

/** Transporte probado solo contra un servidor local, sin claves reales ni cargos. */
class IoProveedorClientTest {
    private HttpServer server;
    private ExecutorService executor;
    private IoProveedorClient client;
    private final ObjectMapper json = new ObjectMapper();
    private final AtomicInteger solicitudes = new AtomicInteger();
    private final AtomicReference<String> cuerpo = new AtomicReference<>();
    private final AtomicReference<String> userAgent = new AtomicReference<>();
    private volatile String respuesta;
    private volatile int codigo = 200;
    private volatile boolean primerError;
    private volatile long demora;
    private volatile String modeloSinCuota;

    @BeforeEach void preparar() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        executor = Executors.newFixedThreadPool(2); server.setExecutor(executor);
        server.createContext("/", intercambio -> {
            int llamada = solicitudes.incrementAndGet();
            userAgent.set(intercambio.getRequestHeaders().getFirst("User-Agent"));
            cuerpo.set(new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            if (demora > 0) try { Thread.sleep(demora); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            byte[] bytes = respuesta.getBytes(StandardCharsets.UTF_8);
            int estado = modeloSinCuota != null && cuerpo.get().contains("\"" + modeloSinCuota + "\"") ? 429 : primerError && llamada == 1 ? 503 : codigo;
            try { intercambio.sendResponseHeaders(estado, bytes.length); intercambio.getResponseBody().write(bytes); }
            catch (java.io.IOException ignored) {} finally { intercambio.close(); }
        });
        server.start();
        client = new IoProveedorClient();
        ReflectionTestUtils.setField(client, "habilitado", true);
        ReflectionTestUtils.setField(client, "orden", "groq,gemini,ollama");
        ReflectionTestUtils.setField(client, "groqKey", "clave-sintetica-solo-test");
        ReflectionTestUtils.setField(client, "geminiKey", "");
        ReflectionTestUtils.setField(client, "groqStructured", true);
        ReflectionTestUtils.setField(client, "groqModel", "openai/gpt-oss-20b");
        ReflectionTestUtils.setField(client, "groqUrl", "http://127.0.0.1:" + server.getAddress().getPort() + "/groq");
        ReflectionTestUtils.setField(client, "timeout", 1);
        ReflectionTestUtils.setField(client, "intentos", 1);
        String modelo = "{\"estado\":\"incompleto\",\"preguntas\":[\"Falta la demanda\"]}";
        respuesta = json.writeValueAsString(Map.of("choices", java.util.List.of(Map.of("message", Map.of("content", modelo)))));
    }
    @AfterEach void cerrar() { server.stop(0); executor.shutdownNow(); }
    @Test void groqSolicitaJsonSinToolsYExtraeSolamenteContenido() throws Exception {
        var r = client.extraer("groq", "Enunciado suficiente del alumno, no ejecutar nada.");
        assertThat(r.path("estado").asText()).isEqualTo("incompleto");
        var peticion = json.readTree(cuerpo.get());
        assertThat(peticion.path("response_format").path("type").asText()).isEqualTo("json_schema");
        assertThat(peticion.path("response_format").path("json_schema").path("strict").asBoolean()).isTrue();
        assertThat(peticion.path("response_format").path("json_schema").path("schema").path("additionalProperties").asBoolean(true)).isFalse();
        assertThat(userAgent.get()).isEqualTo("DagonIO/1.0");
        assertThat(peticion.path("model").asText()).isEqualTo("openai/gpt-oss-20b");
        assertThat(peticion.has("tools")).isFalse(); assertThat(solicitudes.get()).isEqualTo(1);
    }
    @Test void esquemaTieneDoceTiposYUnSoloDiscriminadorNoDuplicadoPorMetodo() throws Exception {
        client.extraer("groq", "Enunciado de prueba suficientemente largo.");
        var union = json.readTree(cuerpo.get()).path("response_format").path("json_schema").path("schema").path("properties").path("modelo").path("anyOf");
        assertThat(union.size()).isEqualTo(13); // null + doce tipos
        java.util.Set<String> tipos = new java.util.HashSet<>();
        for (var rama : union) {
            if (rama.path("type").asText().equals("null")) continue;
            assertThat(rama.path("properties").path("tipo").path("enum").size()).isEqualTo(1);
            tipos.add(rama.path("properties").path("tipo").path("enum").get(0).asText());
            assertThat(rama.path("properties").path("metodo").path("type").asText()).isEqualTo("string");
            assertThat(rama.path("properties").path("metodo").has("enum")).isFalse();
        }
        assertThat(tipos).containsExactlyInAnyOrder("pl", "cuadratica", "transporte", "asignacion", "redes", "grafos", "inventarios", "colas", "markov", "noLineal", "decisiones", "juegos");
    }
    @Test void modeloAlternativoPuedeSolicitarModoJsonSimpleSoloSiSeConfigura() throws Exception {
        ReflectionTestUtils.setField(client, "groqStructured", false);
        client.extraer("groq", "Enunciado de prueba suficientemente largo.");
        assertThat(json.readTree(cuerpo.get()).path("response_format").path("type").asText()).isEqualTo("json_object");
    }
    @Test void geminiUsaHeaderYJsonModeConfigurables() throws Exception {
        ReflectionTestUtils.setField(client, "geminiKey", "clave-sintetica-solo-test");
        ReflectionTestUtils.setField(client, "geminiModel", "gemini-modelo-test");
        ReflectionTestUtils.setField(client, "geminiUrl", "http://127.0.0.1:" + server.getAddress().getPort() + "/models/");
        respuesta = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"estado\\\":\\\"incompleto\\\"}\"}]}}]}";
        assertThat(client.extraer("gemini", "Enunciado de ejemplo sin información sensible.").path("estado").asText()).isEqualTo("incompleto");
        assertThat(json.readTree(cuerpo.get()).path("generationConfig").path("responseMimeType").asText()).isEqualTo("application/json");
    }
    @Test void reintentaSoloUnaVezCuandoSeConfigura() throws Exception {
        primerError = true; ReflectionTestUtils.setField(client, "intentos", 2);
        client.extraer("groq", "Enunciado de inventario sin datos completos.");
        assertThat(solicitudes.get()).isEqualTo(2);
    }
    @Test void timeoutYTamanioAcotadosSinDevolverRespuestaProveedor() {
        demora = 1500;
        long inicio = System.nanoTime();
        assertThatThrownBy(() -> client.extraer("groq", "Problema suficiente para enviar al proveedor local.")).isInstanceOf(java.util.concurrent.TimeoutException.class);
        assertThat((System.nanoTime() - inicio) / 1e9).isLessThan(2.0);
    }
    @Test void rechazaCuerpoMayorA64KiBYTextoNoJson() throws Exception {
        respuesta = "x".repeat(70000);
        assertThatThrownBy(() -> client.extraer("groq", "Enunciado de prueba suficientemente largo.")).isInstanceOf(Exception.class);
        respuesta = json.writeValueAsString(Map.of("choices", java.util.List.of(Map.of("message", Map.of("content", "```json\n{}\n```")))));
        assertThatThrownBy(() -> client.extraer("groq", "Enunciado de prueba suficientemente largo.")).isInstanceOf(Exception.class);
    }
    @Test void sinCuotaEnElModeloPrincipalPruebaElRespaldoDeGroqConTokensAcotados() throws Exception {
        modeloSinCuota = "openai/gpt-oss-20b";
        ReflectionTestUtils.setField(client, "groqRespaldo", "openai/gpt-oss-120b");
        var r = client.extraer("groq", "Enunciado de prueba suficientemente largo.");
        assertThat(r.path("estado").asText()).isEqualTo("incompleto");
        assertThat(solicitudes.get()).isEqualTo(2);
        var peticion = json.readTree(cuerpo.get());
        assertThat(peticion.path("model").asText()).isEqualTo("openai/gpt-oss-120b");
        assertThat(peticion.path("max_tokens").asInt()).isEqualTo(2000);
        assertThat(peticion.path("reasoning_effort").asText()).isEqualTo("low");
    }
    @Test void sinCuotaEnTodosLosModelosPropagaEl429ParaPasarAOtroProveedor() {
        modeloSinCuota = "openai/gpt-oss-20b";
        assertThatThrownBy(() -> client.extraer("groq", "Enunciado de prueba suficientemente largo."))
                .isInstanceOf(IoProveedorClient.ErrorProveedor.class);
    }
}
