package com.dagon.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class AuthRateLimiter {

    private static final long WINDOW_MS = 15L * 60L * 1000L;
    private static final int LOGIN_LIMIT = 10;
    private static final int REGISTER_LIMIT = 5;

    private final ConcurrentHashMap<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    public void consumeLogin(String email) {
        consume("login:" + normalizar(email), LOGIN_LIMIT);
    }

    public void consumeRegistro(String email) {
        consume("registro:" + normalizar(email), REGISTER_LIMIT);
    }

    private void consume(String key, int limit) {
        long now = System.currentTimeMillis();
        Deque<Long> bucket = buckets.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());
        synchronized (bucket) {
            while (!bucket.isEmpty() && now - bucket.peekFirst() > WINDOW_MS) {
                bucket.pollFirst();
            }
            if (bucket.size() >= limit) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Demasiados intentos. Espera unos minutos antes de volver a intentar."
                );
            }
            bucket.addLast(now);
        }
    }

    private String normalizar(String email) {
        if (email == null || email.isBlank()) {
            return "desconocido";
        }
        return email.trim().toLowerCase();
    }
}
