package com.dagon.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuarios", schema = "lms_core")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_usuario", updatable = false, nullable = false)
    private UUID idUsuario;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "id_rol")
    private Integer idRol;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "metodo_auth", length = 20)
    private String metodoAuth = "local";

    @Column(name = "fecha_registro", insertable = false, updatable = false)

    private LocalDateTime fechaRegistro;

    @Transient
    private String fotoUrl;
}