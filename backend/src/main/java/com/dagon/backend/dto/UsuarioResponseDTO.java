package com.dagon.backend.dto;

import com.dagon.backend.model.Usuario;

import java.time.LocalDateTime;
import java.util.UUID;

public class UsuarioResponseDTO {

    private UUID idUsuario;
    private String nombre;
    private String email;
    private Integer idRol;
    private Boolean activo;
    private LocalDateTime fechaRegistro;
    private String fotoUrl;

    public UsuarioResponseDTO() {
    }

    public UsuarioResponseDTO(UUID idUsuario, String nombre, String email, Integer idRol, Boolean activo,
                              LocalDateTime fechaRegistro, String fotoUrl) {
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.email = email;
        this.idRol = idRol;
        this.activo = activo;
        this.fechaRegistro = fechaRegistro;
        this.fotoUrl = fotoUrl;
    }

    public static UsuarioResponseDTO from(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getIdRol(),
                usuario.getActivo(),
                usuario.getFechaRegistro(),
                usuario.getFotoUrl()
        );
    }

    public UUID getIdUsuario() {
        return idUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEmail() {
        return email;
    }

    public Integer getIdRol() {
        return idRol;
    }

    public Boolean getActivo() {
        return activo;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }
}
