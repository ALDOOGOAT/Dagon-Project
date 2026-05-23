package com.dagon.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ResponseTimingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ResponseTimingFilter.class);

    @Value("${dagon.observability.slow-request-ms:750}")
    private long slowRequestMs;

    @Value("${dagon.observability.response-time-header:true}")
    private boolean responseTimeHeaderEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - start) / 1_000_000;
            if (responseTimeHeaderEnabled) {
                response.setHeader("X-Dagon-Response-Time-Ms", String.valueOf(durationMs));
            }

            if (durationMs >= slowRequestMs && request.getRequestURI().startsWith("/api/")) {
                logger.warn("Peticion lenta {} {} -> {} ms (status {})",
                        request.getMethod(),
                        request.getRequestURI(),
                        durationMs,
                        response.getStatus());
            }
        }
    }
}
