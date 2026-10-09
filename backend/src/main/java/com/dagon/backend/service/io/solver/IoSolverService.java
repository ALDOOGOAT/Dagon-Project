package com.dagon.backend.service.io.solver;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/** Resuelve en el servidor, con métodos deterministas, cualquier modelo que haya pasado IoModeloValidator. */
@Service
public class IoSolverService {
    // ponytail: tope global de solves simultáneos por instancia; un pool dedicado si algún día hay varias réplicas con cargas distintas.
    private final Semaphore permisos = new Semaphore(Math.max(2, Runtime.getRuntime().availableProcessors()));

    public IoSolucion resolver(JsonNode modelo) {
        boolean adquirido;
        try { adquirido = permisos.tryAcquire(5, TimeUnit.SECONDS); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); adquirido = false; }
        if (!adquirido) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "El servidor está resolviendo muchos problemas a la vez; vuelve a intentarlo en unos segundos.");
        try { return despachar(modelo); } finally { permisos.release(); }
    }

    private static IoSolucion despachar(JsonNode modelo) {
        if (modelo == null || !modelo.isObject()) throw new IllegalArgumentException("Falta el modelo matemático.");
        String tipo = modelo.path("tipo").asText(), metodo = modelo.path("metodo").asText();
        JsonNode datos = modelo.path("datos");
        if (!datos.isObject()) throw new IllegalArgumentException("Faltan los datos del modelo.");
        return switch (tipo) {
            case "pl" -> metodo.equals("branch_bound") ? EnteroSolver.resolver(metodo, datos) : SimplexSolver.resolver(metodo, datos);
            case "cuadratica" -> CuadraticaSolver.resolver(metodo, datos);
            case "transporte" -> TransporteSolver.resolver(metodo, datos);
            case "asignacion" -> AsignacionSolver.resolver(metodo, datos);
            case "redes" -> RedesSolver.resolver(metodo, datos);
            case "grafos" -> GrafosSolver.resolver(metodo, datos);
            case "inventarios" -> InventarioSolver.resolver(metodo, datos);
            case "colas" -> ColasSolver.resolver(metodo, datos);
            case "markov" -> MarkovSolver.resolver(metodo, datos);
            case "noLineal" -> NoLinealSolver.resolver(metodo, datos);
            case "decisiones" -> DecisionesSolver.resolver(metodo, datos);
            case "juegos" -> JuegosSolver.resolver(metodo, datos);
            default -> throw new IllegalArgumentException("Tipo de modelo no soportado: " + tipo);
        };
    }

    /** Un modelo que matemáticamente no tiene óptimo suele delatar un dato mal extraído del enunciado. */
    public static boolean sospechoso(IoSolucion s) {
        return s == null || "infactible".equals(s.estado()) || "no_acotado".equals(s.estado());
    }
}
