package com.dagon.backend.service.validation;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SandboxSqlPolicy {

    public void validarRolSandbox(String sandboxUser) {
        if (!"app_sandbox_user".equals(sandboxUser)) {
            throw new IllegalStateException("El sandbox debe ejecutarse con el rol app_sandbox_user");
        }
    }

    public String resolverSearchPath(String usuarioId) {
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            return "lms_sandbox";
        }
        UUID uuid = UUID.fromString(usuarioId);
        return "sandbox_usuario_" + uuid;
    }

    public String sentenciaSearchPath(String usuarioId) {
        return "SET search_path TO \"" + resolverSearchPath(usuarioId) + "\"";
    }
}
