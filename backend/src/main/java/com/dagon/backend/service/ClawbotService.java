package com.dagon.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class ClawbotService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // ==========================================
    // FUNCIÓN 1: LA NUEVA FASE 4 (Intervención Proactiva en Errores)
    // ==========================================
    public String obtenerAyudaSocratica(String descripcion, String queryMaestra, String queryAlumno, String errorDb, int intentos) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        // LÓGICA PEDAGÓGICA BLINDADA
        String reglaPedagogica;
        if (intentos >= 3) {
            reglaPedagogica =
                    "ESTADO DE EMERGENCIA: El alumno ha fallado " + intentos + " veces y está frustrado. " +
                            "REGLA ACTUALIZADA: Abandona las preguntas socráticas abstractas. Tienes permiso EXPRESO de darle la estructura de la consulta. " +
                            "Muestra la consulta SQL casi completa (basándote en la respuesta esperada), reemplazando las palabras clave o valores faltantes con guiones bajos (___). " +
                            "Dile algo como: '¡No te rindas! La estructura que buscas es esta: SELECT ___ FROM tabla INNER JOIN ___ ON ___ = ___;'";
        } else {
            reglaPedagogica =
                    "ESTADO NORMAL (Intento " + intentos + "): Usa el Método Socrático. " +
                            "Hazle una pregunta que lo haga pensar sobre su error lógico o de sintaxis. " +
                            "REGLA ESTRICTA: JAMÁS le des la consulta correcta ni plantillas de código en este punto.";
        }

        // Ya no hay reglas contradictorias, solo la instrucción directa
        String instruccionesClawbot =
                "Eres Clawbot, tutor virtual de BD PostgreSQL para el juego Dagon. " +
                        reglaPedagogica + " " +
                        "Explica el error de base de datos en palabras sencillas. Tu respuesta debe ser breve (máximo 3 oraciones), motivadora y con un tono geek.";

        Map<String, Object> systemInstruction = crearSystemInstruction(instruccionesClawbot);

        String contextoProblema = String.format(
                "Misión actual: %s\nRespuesta esperada: %s\nLo que escribió: %s\nError PostgreSQL: %s",
                descripcion, queryMaestra, queryAlumno, errorDb
        );

        return llamarGeminiAPI(url, systemInstruction, contextoProblema);
    }

    // ==========================================
    // FUNCIÓN 2: EL CHAT MANUAL QUE YA TENÍAS (El Chatbot Flotante)
    // ==========================================
    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        // ¡INSTRUCCIONES MÁS ESTRICTAS AQUÍ!
        String instruccionesClawbot =
                "Eres Clawbot, la mascota oficial y tutor de IA de la plataforma Dagon. " +
                        "Responde de forma concisa, amigable y un poco geek a las dudas del usuario. " +
                        "REGLA DE ORO INQUEBRANTABLE: JAMÁS, bajo ninguna circunstancia, escribas la consulta SQL completa correcta para resolver un ejercicio. " +
                        "Si te piden la respuesta o ayuda para un ejercicio, usa el método socrático para guiarlos. Hazles preguntas. " +
                        "Si están muy perdidos, puedes darles un ejemplo de la ESTRUCTURA básica usando nombres de tablas o columnas falsas, o usar guiones bajos (___) para omitir la respuesta clave.";

        Map<String, Object> systemInstruction = crearSystemInstruction(instruccionesClawbot);

        // ... (El resto del método sigue igual) ...
        // Convertimos tu historial de React a un bloque de texto para darle contexto a la IA
        StringBuilder contextoHistorial = new StringBuilder("Historial previo de la conversación:\n");
        if (historial != null && !historial.isEmpty()) {
            for (Map<String, String> msg : historial) {
                String rol = "user".equals(msg.get("role")) ? "Alumno" : "Clawbot";
                contextoHistorial.append(rol).append(": ").append(msg.get("content")).append("\n");
            }
        }
        contextoHistorial.append("\nEl Alumno dice ahora: ").append(mensajeUsuario);

        return llamarGeminiAPI(url, systemInstruction, contextoHistorial.toString());
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Para no repetir código)
    // ==========================================
    private Map<String, Object> crearSystemInstruction(String texto) {
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> sysPart = new HashMap<>();
        sysPart.put("text", texto);
        systemInstruction.put("parts", Collections.singletonList(sysPart));
        return systemInstruction;
    }

    private String llamarGeminiAPI(String url, Map<String, Object> systemInstruction, String textoUsuario) {
        Map<String, Object> userContent = new HashMap<>();
        Map<String, Object> userPart = new HashMap<>();
        userPart.put("text", textoUsuario);
        userContent.put("parts", Collections.singletonList(userPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("system_instruction", systemInstruction);
        requestBody.put("contents", Collections.singletonList(userContent));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");

            return resParts.get(0).get("text").toString();

        } catch (Exception e) {
            System.err.println("Error al conectar con Gemini: " + e.getMessage());
            return "¡Bzzt! Mis circuitos están saturados ahora mismo. Intenta nuevamente en unos segundos.";
        }
    }
}