package com.dagon.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // La "Firma del Director". Con esta llave secreta se sellan los pasaportes.
    // Si un hacker intenta crear un pasaporte falso, no podrá porque no tiene esta llave.
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // Tiempo de vida del pasaporte: 24 horas (en milisegundos)
    private static final long EXPIRATION_TIME = 86400000;

    // 1. FABRICAR EL PASAPORTE (Cuando el usuario hace Login correctamente)
    public String generarToken(String idUsuario) {
        return Jwts.builder()
                .setSubject(idUsuario) // El dueño del pasaporte (UUID)
                .setIssuedAt(new Date()) // Fecha de emisión
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // Fecha de caducidad
                .signWith(SECRET_KEY) // Sello de seguridad
                .compact();
    }

    // 2. LEER EL PASAPORTE (Saber de quién es el ID que viene adentro)
    public String extraerUsuarioId(String token) {
        return getClaims(token).getSubject();
    }

    // 3. VALIDAR PASAPORTE (Revisar si es falso o si ya caducó)
    public boolean validarToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false; // Si falla, es un pasaporte falso o expirado
        }
    }

    // Herramienta interna para abrir el pasaporte
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}