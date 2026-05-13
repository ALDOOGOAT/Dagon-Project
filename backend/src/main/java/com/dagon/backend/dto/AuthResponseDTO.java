package com.dagon.backend.dto;

public class AuthResponseDTO {

    private final String token;
    private final UsuarioResponseDTO user;

    public AuthResponseDTO(String token, UsuarioResponseDTO user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public UsuarioResponseDTO getUser() {
        return user;
    }
}
