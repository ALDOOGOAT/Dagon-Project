package com.dagon.backend.service.validation;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SandboxSqlPolicyTest {

    private final SandboxSqlPolicy policy = new SandboxSqlPolicy();

    @Test
    void soloPermiteRolSandboxEsperado() {
        policy.validarRolSandbox("app_sandbox_user");

        assertThatThrownBy(() -> policy.validarRolSandbox("postgres"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app_sandbox_user");
    }

    @Test
    void searchPathUsaUuidControlado() {
        UUID usuarioId = UUID.randomUUID();

        assertThat(policy.resolverSearchPath(usuarioId.toString()))
                .isEqualTo("sandbox_usuario_" + usuarioId);
        assertThat(policy.sentenciaSearchPath(usuarioId.toString()))
                .isEqualTo("SET search_path TO \"sandbox_usuario_" + usuarioId + "\"");
    }

    @Test
    void searchPathRechazaIdentificadoresNoUuid() {
        assertThatThrownBy(() -> policy.resolverSearchPath("abc\"; DROP SCHEMA lms_core; --"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
