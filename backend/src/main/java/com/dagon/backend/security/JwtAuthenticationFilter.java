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
        String identificadorUsuario = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                if (jwtUtil.validarToken(token)) {
                    identificadorUsuario = jwtUtil.extraerUsuarioId(token);
                }
            } catch (Exception e) {
                logger.debug("Token invalido o expirado");
            }
        }

        if (identificadorUsuario != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UsuarioAutenticado usuarioAutenticado = cargarUsuarioAutenticado(identificadorUsuario);
            if (usuarioAutenticado == null || usuarioAutenticado.authorities().isEmpty()) {
                filterChain.doFilter(request, response);
                return;
            }

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    usuarioAutenticado.idUsuario(), null, usuarioAutenticado.authorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }

    private UsuarioAutenticado cargarUsuarioAutenticado(String identificadorUsuario) {
        try {
            Map<String, Object> usuario = jdbcTemplate.queryForMap(
                    "SELECT id_usuario::varchar AS id_usuario, id_rol, activo " +
                            "FROM lms_core.usuarios " +
                            "WHERE id_usuario::varchar = ? OR LOWER(email) = LOWER(?)",
                    identificadorUsuario,
                    identificadorUsuario);
            Boolean activo = (Boolean) usuario.get("activo");
            if (!Boolean.TRUE.equals(activo)) {
                return null;
            }
            Object idRolRaw = usuario.get("id_rol");
            Integer idRol = idRolRaw instanceof Number ? ((Number) idRolRaw).intValue() : 1;
            String roleName = ROLES.getOrDefault(idRol, "ROLE_ALUMNO");
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(roleName));
            return new UsuarioAutenticado(usuario.get("id_usuario").toString(), authorities);
        } catch (Exception e) {
            logger.debug("No se pudo cargar rol para usuario {}: {}", identificadorUsuario, e.getMessage());
            return null;
        }
    }

    private record UsuarioAutenticado(String idUsuario, List<GrantedAuthority> authorities) {
    }
}
