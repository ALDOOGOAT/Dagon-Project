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

    private final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public String obtenerRespuestaClawbot(String mensajeUsuario, List<Map<String, String>> historial) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = API_URL + "?key=" + apiKey;

            // EL PROMPT MAESTRO (Pedagogía + Arte ASCII)
            String promptSistema = "Eres Clawbot, un tutor experto en bases de datos PostgreSQL para la plataforma Dagon. " +
                    "TUS REGLAS ESTRICTAS: " +
                    "1. NUNCA des el código SQL completo ni la respuesta directa. " +
                    "2. Usa el Método Socrático: haz preguntas para que el alumno descubra su propio error. " +
                    "3. Eres altamente visual: Usa arte ASCII (dibujos con símbolos del teclado) para representar diagramas de tablas, JOINs o conceptos de forma creativa. " +
                    "4. Usa analogías de la vida real o videojuegos. " +
                    "5. Si el alumno te saluda o hace una prueba, responde con tu personalidad de robot tutor entusiasta.";

            List<Map<String, Object>> contents = new ArrayList<>();

            // 1. Inyectamos la personalidad en secreto al inicio de la memoria
            Map<String, Object> sysUser = new HashMap<>();
            sysUser.put("role", "user");
            sysUser.put("parts", Collections.singletonList(Map.of("text", promptSistema)));
            contents.add(sysUser);

            Map<String, Object> sysModel = new HashMap<>();
            sysModel.put("role", "model");
            sysModel.put("parts", Collections.singletonList(Map.of("text", "Entendido. Actuaré como Clawbot siguiendo estrictamente esas reglas.")));
            contents.add(sysModel);

            // 2. Cargamos la memoria anterior (si existe)
            if (historial != null) {
                for (Map<String, String> msg : historial) {
                    // Evitamos cargar el mensaje de saludo inicial automático para no confundirlo
                    if(msg.get("content").contains("Soy Clawbot, tu tutor")) continue;

                    Map<String, Object> item = new HashMap<>();
                    item.put("role", msg.get("role").equals("assistant") ? "model" : "user");
                    item.put("parts", Collections.singletonList(Map.of("text", msg.get("content"))));
                    contents.add(item);
                }
            }

            // 3. Agregamos el mensaje actual
            Map<String, Object> currentMsg = new HashMap<>();
            currentMsg.put("role", "user");
            currentMsg.put("parts", Collections.singletonList(Map.of("text", mensajeUsuario)));
            contents.add(currentMsg);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> respParts = (List<Map<String, Object>>) content.get("parts");
                    if (!respParts.isEmpty()) {
                        return (String) respParts.get(0).get("text");
                    }
                }
            }
            return "Mis circuitos están procesando demasiada información. ¿Puedes intentar preguntar de otra forma?";

        } catch (Exception e) {
            System.out.println("Error de IA: " + e.getMessage());
            return "Lo siento, mi enlace con el núcleo está inactivo.";
        }
    }
}