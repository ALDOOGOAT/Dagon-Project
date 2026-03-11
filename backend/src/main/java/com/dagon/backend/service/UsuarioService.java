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

    // --- FUNCION 2: LOGIN (¡NUEVO!) ---
    public Usuario iniciarSesion(String email, String password) {
        // 1. Buscamos si existe alguien con ese correo
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        // 2. Si existe, verificamos que la contraseña coincida
        if (usuarioOpt.isPresent()) {
            Usuario usuarioBaseDatos = usuarioOpt.get();
            if (usuarioBaseDatos.getPasswordHash().equals(password)) {
                return usuarioBaseDatos; // ¡Contraseña correcta, lo dejamos pasar!
            }
        }

        // 3. Si el correo no existe o la contraseña está mal, lanzamos un error
        throw new RuntimeException("Correo o contraseña incorrectos.");
    }
}