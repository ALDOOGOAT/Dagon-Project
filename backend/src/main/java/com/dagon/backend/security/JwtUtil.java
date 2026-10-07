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
        byte[] secreto = jwtSecret == null ? new byte[0] : jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secreto.length < 32) {
            throw new IllegalStateException(
                    "Falta DAGON_JWT_SECRET (dagon.jwt.secret) o mide menos de 32 bytes. "
                            + "Defínela en backend/.env o en las variables del servidor; no tiene valor por defecto.");
        }
        signingKey = Keys.hmacShaKeyFor(secreto);
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
