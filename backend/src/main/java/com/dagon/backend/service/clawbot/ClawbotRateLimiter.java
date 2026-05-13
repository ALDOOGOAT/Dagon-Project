package com.dagon.backend.service.clawbot;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class ClawbotRateLimiter {

    private static final long WINDOW_MS = 60L * 60L * 1000L;

    @Value("${dagon.clawbot.rate-limit.chat-per-hour:35}")
    private int chatLimitPerHour;

    @Value("${dagon.clawbot.rate-limit.analysis-per-hour:60}")
    private int analysisLimitPerHour;

    private final ConcurrentHashMap<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    public int consume(String userId, String channel) {
        String safeUserId = userId == null || userId.isBlank() ? "anonimo" : userId;
        String safeChannel = channel == null || channel.isBlank() ? "chat" : channel;
        int limit = "analysis".equals(safeChannel) ? analysisLimitPerHour : chatLimitPerHour;
        long now = System.currentTimeMillis();
        String key = safeChannel + ":" + safeUserId;
        Deque<Long> bucket = buckets.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());

        synchronized (bucket) {
            while (!bucket.isEmpty() && now - bucket.peekFirst() > WINDOW_MS) {
                bucket.pollFirst();
            }
            if (bucket.size() >= limit) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Clawbot necesita una pausa. Intenta de nuevo mas tarde o repasa las pistas locales del ejercicio."
                );
            }
            bucket.addLast(now);
            return Math.max(0, limit - bucket.size());
        }
    }
}
