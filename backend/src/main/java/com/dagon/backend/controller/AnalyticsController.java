package com.dagon.backend.controller;

import com.dagon.backend.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Puente entre Spring Boot y el microservicio Python de MPI.
 *
 * Academico: expone GET /api/analytics/mpi. Toma el ranking ya
 * consolidado por LeaderboardService y lo reenvia al servicio mpi4py
 * configurado en dagon.mpi.url. Devuelve al frontend las metricas
 * calculadas en paralelo y un fallback estable si MPI esta offline.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private LeaderboardService leaderboardService;

    @Value("${dagon.mpi.url:http://127.0.0.1:5001}")
    private String mpiServiceUrl;

    private final RestTemplate rest = new RestTemplate(requestFactory());

    @GetMapping("/mpi")
    public ResponseEntity<Map<String, Object>> analyticsMpi() {
        List<Map<String, Object>> ranking = leaderboardService.obtenerRankingGlobal(0, null);

        Map<String, Object> payload = new HashMap<>();
        payload.put("usuarios", ranking);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            long t0 = System.currentTimeMillis();
            @SuppressWarnings("unchecked")
            Map<String, Object> respuesta = rest.postForObject(
                    mpiServiceUrl + "/analytics", entity, Map.class
            );
            long t1 = System.currentTimeMillis();

            if (respuesta == null) {
                return ResponseEntity.ok(fallback("El servicio MPI no devolvio datos", ranking.size()));
            }

            Map<String, Object> salida = baseResponse(true, "online", ranking.size());
            salida.put("resultado", respuesta);
            salida.put("proxy_ms", t1 - t0);
            return ResponseEntity.ok(salida);
        } catch (RestClientException ex) {
            return ResponseEntity.ok(fallback("No se pudo contactar el servicio MPI", ranking.size()));
        }
    }

    private Map<String, Object> fallback(String error, int rankingCount) {
        Map<String, Object> salida = baseResponse(false, "offline", rankingCount);
        salida.put("error", error);
        salida.put("hint", "En local levanta mpi_service/run_mpi.sh. En Railway configura DAGON_MPI_URL hacia el servicio MPI.");
        return salida;
    }

    private Map<String, Object> baseResponse(boolean ok, String estado, int rankingCount) {
        Map<String, Object> salida = new LinkedHashMap<>();
        salida.put("ok", ok);
        salida.put("estado", estado);
        salida.put("ranking_count", rankingCount);
        salida.put("pipeline", List.of(
                "LeaderboardService.obtenerRankingGlobal()",
                "AnalyticsController /api/analytics/mpi",
                "mpi_service/server.py",
                "mpi_service/analytics_mpi.py"
        ));
        return salida;
    }

    private static SimpleClientHttpRequestFactory requestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2500);
        factory.setReadTimeout(15000);
        return factory;
    }
}
