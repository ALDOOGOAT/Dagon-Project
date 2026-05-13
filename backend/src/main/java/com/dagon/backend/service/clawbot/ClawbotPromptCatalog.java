package com.dagon.backend.service.clawbot;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

@Component
public class ClawbotPromptCatalog {

    private static final Logger logger = LoggerFactory.getLogger(ClawbotPromptCatalog.class);

    private static final String DEFAULT_CHAT_PROMPT = """
            Eres Clawbot, tutor socratico de SQL. Explica con claridad, no des respuestas completas de ejercicios evaluados y usa ejemplos analogos con huecos.
            """;

    private static final String DEFAULT_ANALYSIS_PROMPT = """
            Eres Clawbot, tutor socratico de SQL dentro de un ejercicio. Ayuda sin revelar la solucion real. Usa ERROR, CONCEPTO, PISTA, MINIEJEMPLO y CIERRE.
            """;

    private String systemChatPrompt = DEFAULT_CHAT_PROMPT;
    private String systemAnalysisPrompt = DEFAULT_ANALYSIS_PROMPT;
    private final Properties moduleContexts = new Properties();
    private final Properties errorPrompts = new Properties();

    @PostConstruct
    public void cargarRecursos() {
        systemChatPrompt = readText("clawbot/prompts/system-chat.md", DEFAULT_CHAT_PROMPT);
        systemAnalysisPrompt = readText("clawbot/prompts/system-analysis.md", DEFAULT_ANALYSIS_PROMPT);
        loadProperties("clawbot/module-contexts.properties", moduleContexts);
        loadProperties("clawbot/error-prompts.properties", errorPrompts);
    }

    public String systemChatPrompt() {
        return systemChatPrompt;
    }

    public String systemAnalysisPrompt() {
        return systemAnalysisPrompt;
    }

    public String moduleContext(int moduleId, String exerciseTitle) {
        String base = moduleContexts.getProperty(String.valueOf(moduleId), moduleContexts.getProperty("default", "SQL general."));
        if (exerciseTitle == null || exerciseTitle.isBlank()) {
            return "Modulo " + moduleId + ": " + base;
        }
        return "Modulo " + moduleId + ": " + base + " Ejercicio actual: " + exerciseTitle;
    }

    public String errorGuidance(String errorType) {
        return errorPrompts.getProperty(errorType, errorPrompts.getProperty("generic", "Guia al alumno paso a paso sin dar la solucion."));
    }

    private String readText(String path, String fallback) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return fallback;
            }
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8).trim();
        } catch (Exception e) {
            logger.warn("No se pudo cargar recurso de Clawbot {}: {}", path, e.getMessage());
            return fallback;
        }
    }

    private void loadProperties(String path, Properties target) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return;
            }
            try (InputStreamReader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                target.load(reader);
            }
        } catch (Exception e) {
            logger.warn("No se pudo cargar configuracion de Clawbot {}: {}", path, e.getMessage());
        }
    }
}
