package com.dagon.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. El cadenero busca el pasaporte en el encabezado de la petición
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String usuarioId = null;

        // 2. Si trae pasaporte y empieza con "Bearer " (Portador)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Le quitamos la palabra "Bearer " para leer solo el código
            try {
                if (jwtUtil.validarToken(token)) {
                    usuarioId = jwtUtil.extraerUsuarioId(token); // Sacamos tu UUID del token
                }
            } catch (Exception e) {
                logger.debug("Token invalido o expirado");
            }
        }

        // 3. Si el pasaporte es real, le informamos a Spring Security que tienes permiso de entrar
        if (usuarioId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    usuarioId, null, new ArrayList<>());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // 4. Deja que la petición continúe su camino hacia los controladores
        filterChain.doFilter(request, response);
    }
}
