package com.dagon.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${dagon.jwt.secret:}")
    private String jwtSecret;

    @Value("${dagon.jwt.expiration-ms:86400000}")
    private long expirationTimeMs;

    @Value("${dagon.jwt.issuer:dagon-backend}")
    private String issuer;

    @Value("${dagon.jwt.audience:dagon-frontend}")
    private String audience;

    private Key signingKey;

    @PostConstruct
    void init() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("Configura dagon.jwt.secret con al menos 32 caracteres.");
        }
        signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generarToken(String idUsuario) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(idUsuario)
                .setIssuer(issuer)
                .setAudience(audience)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationTimeMs))
                .signWith(signingKey)
                .compact();
    }

    public String extraerUsuarioId(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validarToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
