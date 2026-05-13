package com.dagon.backend.service;

import com.dagon.backend.model.Usuario;
import com.dagon.backend.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    private static final Logger logger = LoggerFactory.getLogger(UsuarioService.class);

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
    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public void registrarPracticaDiaria(String usuarioId) {
        try {
            java.time.LocalDate hoy = java.time.LocalDate.now();

            String sqlUltimaPractica = "SELECT ultima_practica FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
            java.sql.Date ultimaPractica = jdbcTemplate.queryForObject(sqlUltimaPractica, java.sql.Date.class, usuarioId);

            if (ultimaPractica == null) {
                String updateSql = "UPDATE lms_core.usuarios SET racha_actual = 1, mejor_racha = 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(updateSql, hoy.toString(), usuarioId);
                return;
            }

            java.time.LocalDate ultFecha = ultimaPractica.toLocalDate();

            if (ultFecha.equals(hoy)) {
                return;
            } else if (ultFecha.equals(hoy.minusDays(1))) {
                String sqlUpdate = "UPDATE lms_core.usuarios SET racha_actual = racha_actual + 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(sqlUpdate, hoy.toString(), usuarioId);

                String sqlCheck = "SELECT racha_actual FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
                int rachaActual = jdbcTemplate.queryForObject(sqlCheck, Integer.class, usuarioId);

                String sqlMejor = "UPDATE lms_core.usuarios SET mejor_racha = ? WHERE id_usuario = ?::uuid AND mejor_racha < ?";
                jdbcTemplate.update(sqlMejor, rachaActual, usuarioId, rachaActual);
            } else {
                String updateSql = "UPDATE lms_core.usuarios SET racha_actual = 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(updateSql, hoy.toString(), usuarioId);
            }

            logger.debug("Practica diaria registrada para el usuario con ID: {}", usuarioId);
        } catch (Exception e) {
            logger.warn("Error al registrar practica diaria: {}", e.getMessage());
        }
    }
}
