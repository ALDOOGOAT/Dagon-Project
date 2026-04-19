package com.dagon.backend.service;

import com.dagon.backend.model.Usuario;
import com.dagon.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- FUNCION 1: REGISTRO ---
    public Usuario registrarUsuario(Usuario nuevoUsuario) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(nuevoUsuario.getEmail());
        if (usuarioExistente.isPresent()) {
            throw new RuntimeException("Error: Este correo ya está registrado en Dagon.");
        }
        if (nuevoUsuario.getActivo() == null) {
            nuevoUsuario.setActivo(true);
        }
        return usuarioRepository.save(nuevoUsuario);
    }

    // --- FUNCION 2: LOGIN ---
    public Usuario iniciarSesion(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isPresent()) {
            Usuario usuarioBaseDatos = usuarioOpt.get();
            if (usuarioBaseDatos.getPasswordHash().equals(password)) {
                return usuarioBaseDatos;
            }
        }
        throw new RuntimeException("Correo o contraseña incorrectos.");
    }

    // --- FUNCION 3: REGISTRAR PRACTICA (RACHAS) ---
    public void registrarPracticaDiaria(String usuarioId) {
        // Por ahora solo imprimimos en consola.
        // Más adelante pondremos el UPDATE para la BD.
        System.out.println("✅ Práctica diaria registrada para el usuario con ID: " + usuarioId);
    }
}