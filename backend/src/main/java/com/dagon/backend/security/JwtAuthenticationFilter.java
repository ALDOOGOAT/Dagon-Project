package com.dagon.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Map<Integer, String> ROLES = Map.of(
            1, "ROLE_ALUMNO",
            2, "ROLE_DOCENTE",
            3, "ROLE_ADMIN"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String usuarioId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                if (jwtUtil.validarToken(token)) {
                    usuarioId = jwtUtil.extraerUsuarioId(token);
                }
            } catch (Exception e) {
                logger.debug("Token invalido o expirado");
            }
        }

        if (usuarioId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            List<GrantedAuthority> authorities = cargarAuthorities(usuarioId);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    usuarioId, null, authorities);
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> cargarAuthorities(String usuarioId) {
        try {
            Integer idRol = jdbcTemplate.queryForObject(
                    "SELECT id_rol FROM lms_core.usuarios WHERE id_usuario = ?::uuid",
                    Integer.class, usuarioId);
            String roleName = ROLES.getOrDefault(idRol, "ROLE_ALUMNO");
            return List.of(new SimpleGrantedAuthority(roleName));
        } catch (Exception e) {
            logger.debug("No se pudo cargar rol para usuario {}: {}", usuarioId, e.getMessage());
            return List.of(new SimpleGrantedAuthority("ROLE_ALUMNO"));
        }
    }
}
