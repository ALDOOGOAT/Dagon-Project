package com.dagon.backend.controller;

import com.dagon.backend.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Puente entre Spring Boot y el microservicio Python de MPI.
 *
 * Academico: expone GET /api/analytics/mpi. Toma el ranking ya
 * consolidado por LeaderboardService y lo reenvia al servicio mpi4py
 * que corre en localhost:5001. Devuelve al frontend las metricas
 * calculadas en paralelo mas el tiempo de pared total.
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private LeaderboardService leaderboardService;

    @Value("${dagon.mpi.url:http://127.0.0.1:5001}")
    private String mpiServiceUrl;

    private final RestTemplate rest = new RestTemplate();

    @GetMapping("/mpi")
    public ResponseEntity<Map<String, Object>> analyticsMpi() {
        List<Map<String, Object>> ranking = leaderboardService.obtenerRankingGlobal();

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

            Map<String, Object> salida = new HashMap<>();
            salida.put("ok", true);
            salida.put("resultado", respuesta);
            salida.put("proxy_ms", t1 - t0);
            salida.put("mpi_url", mpiServiceUrl);
            return ResponseEntity.ok(salida);
        } catch (RestClientException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("ok", false);
            error.put("error", "No se pudo contactar el servicio MPI");
            error.put("detalle", ex.getMessage());
            error.put("mpi_url", mpiServiceUrl);
            error.put("hint", "Corre ./mpi_service/run_mpi.sh para levantar el servicio.");
            return ResponseEntity.status(502).body(error);
        }
    }
}
