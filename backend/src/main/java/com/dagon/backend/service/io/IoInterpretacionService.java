package com.dagon.backend.service.io;

import com.dagon.backend.service.clawbot.ClawbotCacheService;
import com.dagon.backend.service.io.solver.IoSolverService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Enunciado → modelo → solución. La IA es solo el primer intento de modelado: el servidor resuelve su modelo
 * con métodos deterministas y lo descarta si no se puede resolver o no tiene óptimo; después prueba otra fuente
 * y, si ninguna sirve, interpreta y resuelve el enunciado por su cuenta (IoParserLocal + IoSolverService).
 * Los modelos ya resueltos se guardan en memoria y en lms_core.clawbot_cache, y se revalidan al leerlos.
 */
@Service
public class IoInterpretacionService {
    private static final Logger LOGGER = LoggerFactory.getLogger(IoInterpretacionService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private final IoParserLocal parser;
    private final IoProveedorClient proveedor;
    private final IoModeloValidator validator;
    private final IoSolverService solver;
    private final ClawbotCacheService persistente;
    // Un mismo enunciado (p. ej. el ejemplo de la clase) no vuelve a gastar tokens de IA: caché LRU en memoria.
    private final Map<String, IoInterpretacion> cache = Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, IoInterpretacion> e) { return size() > 300; }
    });

    public IoInterpretacionService(IoParserLocal parser, IoProveedorClient proveedor, IoModeloValidator validator) {
        this(parser, proveedor, validator, new IoSolverService(), null);
    }
    @Autowired
    public IoInterpretacionService(IoParserLocal parser, IoProveedorClient proveedor, IoModeloValidator validator,
                                   IoSolverService solver, ClawbotCacheService persistente) {
        this.parser = parser; this.proveedor = proveedor; this.validator = validator; this.solver = solver; this.persistente = persistente;
    }

    public IoInterpretacion interpretar(String enunciado) { return resolver(enunciado).interpretacion(); }

    public IoResultado resolver(String enunciado) {
        IoInterpretacion local = parser.interpretar(enunciado);
        if (listo(local)) local = validator.validar(local, enunciado);
        IoResultado deterministico = listo(local) ? resolverModelo(local) : null;
        // El usuario escribió el modelo en JSON: no hay nada que interpretar con IA.
        if (deterministico != null && deterministico.solucion() != null && enunciado.contains("{")) return deterministico;
        String clave = IoParserLocal.normalizar(enunciado).replaceAll("\\s+", " ").trim();
        IoResultado guardado = desdeCache(clave, enunciado);
        if (guardado != null) return contrastar(guardado, deterministico);
        boolean integralidadOmitida = false, proveedorFallo = false;
        IoInterpretacion rechazoPorContrato = null, pideDatos = null;
        IoResultado sinOptimo = null;
        for (String fuente : proveedor.fuentesDisponibles()) {
            try {
                var bruto = proveedor.extraer(fuente, enunciado);
                IoInterpretacion resultado = validator.desdeProveedor(bruto, fuente, enunciado);
                // El proveedor dijo "listo" pero su modelo no pasó el contrato (cita, símbolos…): probar otra fuente.
                if ("incompleto".equals(resultado.estado()) && "listo".equals(bruto.path("estado").asText())) {
                    rechazoPorContrato = resultado;
                    LOGGER.warn("Modelado IO: proveedor={} categoria=contrato_invalido status=0", fuente);
                    continue;
                }
                // Guarda determinista: el texto pide enteros/sí-no y el modelo continuo lo ignora -> otra fuente.
                if (listo(resultado) && omiteIntegralidad(resultado, enunciado)) {
                    integralidadOmitida = true;
                    LOGGER.warn("Modelado IO: proveedor={} categoria=integralidad_omitida status=0", fuente);
                    continue;
                }
                if (listo(resultado)) {
                    IoResultado r = resolverModelo(resultado);
                    if (r.solucion() == null) {
                        rechazoPorContrato = IoInterpretacion.incompleto("El modelo extraído no se puede resolver.", List.of(r.errorSolucion()));
                        LOGGER.warn("Modelado IO: proveedor={} categoria=modelo_irresoluble status=0", fuente);
                        continue;
                    }
                    // Sin óptimo suele ser un dato mal leído: se conserva por si el problema realmente lo es.
                    if (IoSolverService.sospechoso(r.solucion())) {
                        if (sinOptimo == null) sinOptimo = r;
                        LOGGER.warn("Modelado IO: proveedor={} categoria=sin_optimo status=0", fuente);
                        continue;
                    }
                    IoResultado contrastado = contrastar(r, deterministico);
                    // Si el servidor leyó otras cifras, el modelo de la IA no se comparte 30 días desde la BD.
                    guardar(clave, r.interpretacion(), contrastado == r);
                    return contrastado;
                }
                if ("incompleto".equals(resultado.estado())) { pideDatos = resultado; break; }
                if (pideDatos == null) pideDatos = resultado;
            } catch (Exception error) {
                String categoria = error instanceof IoProveedorClient.ErrorProveedor p ? p.categoria
                        : error instanceof java.util.concurrent.TimeoutException || error instanceof java.net.http.HttpTimeoutException ? "timeout"
                        : error instanceof com.fasterxml.jackson.core.JsonProcessingException ? "json_invalido"
                        : error instanceof IllegalArgumentException ? "contrato_invalido" : "transporte";
                int status = error instanceof IoProveedorClient.ErrorProveedor p ? p.status : 0;
                proveedorFallo = true;
                LOGGER.warn("Modelado IO: proveedor={} categoria={} status={}", fuente, categoria, status);
            }
        }
        // Respaldo del servidor: su propia interpretación, resuelta y con óptimo.
        if (deterministico != null && deterministico.solucion() != null && !IoSolverService.sospechoso(deterministico.solucion())) {
            // Con la IA caída (cuota, timeout) el respaldo solo se recuerda en memoria: la IA volverá a intentarlo tras un reinicio.
            guardar(clave, deterministico.interpretacion(), !proveedorFallo);
            return deterministico;
        }
        if (sinOptimo != null) return conAdvertencia(sinOptimo, "El modelo no tiene solución óptima (" + sinOptimo.solucion().estado().replace('_', ' ')
                + "). Si el problema debería tenerla, revisa los coeficientes, los sentidos (≤, ≥) y los lados derechos.");
        if (deterministico != null) return deterministico;
        if (pideDatos != null) return IoResultado.sinSolucion(pideDatos);
        if (rechazoPorContrato != null && !integralidadOmitida) return IoResultado.sinSolucion(rechazoPorContrato);
        if (integralidadOmitida) return IoResultado.sinSolucion(IoInterpretacion.incompleto("El modelo extraído ignora que las decisiones son enteras o de sí/no.",
                List.of("El enunciado indica unidades completas o decisiones de sí/no. Declara en el modelo qué variables son enteras o binarias (por ejemplo \"x1, x2 binarias\") y vuelve a analizar.")));
        if (proveedorFallo && !listo(local)) {
            // El análisis con IA no se pudo hacer (cuota o servicio ocupado): no se muestran preguntas de un parser que no entendió el texto.
            return IoResultado.sinSolucion(IoInterpretacion.incompleto("El análisis automático está ocupado en este momento.",
                    List.of("El servicio de análisis con IA está saturado y el reconocimiento del servidor no identificó el modelo. Espera unos segundos y vuelve a pulsar \"Analizar y resolver\", o escribe los datos como tabla.")));
        }
        var advertencias = new ArrayList<>(local.advertencias());
        advertencias.add("El reconocimiento local tiene alcance limitado. Si faltan datos o no se reconoce la redacción, completa el modelo manualmente.");
        return IoResultado.sinSolucion(new IoInterpretacion(local.estado(), "local", local.resumen(), null, local.preguntas(), advertencias, local.supuestos()));
    }

    /** Modelo ya escrito (p. ej. editado a mano): mismas guardas del contrato y solución del servidor. */
    public IoResultado resolverModelo(JsonNode modelo) {
        if (modelo == null || !modelo.isObject()) throw new IllegalArgumentException("Falta el modelo matemático.");
        var copia = ((com.fasterxml.jackson.databind.node.ObjectNode) modelo).deepCopy();
        if (!copia.has("variables")) copia.set("variables", JSON.createArrayNode());
        // Sin enunciado no hay citas que comprobar: los propios datos sustentan el modelo.
        String datos = copia.path("datos").toString();
        copia.set("evidencias", JSON.valueToTree(List.of(Map.of("campo", "datos", "texto", datos))));
        IoInterpretacion validada = validator.validar(new IoInterpretacion("listo", "local", "Modelo proporcionado por el usuario.", copia, List.of(), List.of(), List.of()), datos);
        return listo(validada) ? resolverModelo(validada) : IoResultado.sinSolucion(validada);
    }

    private IoResultado resolverModelo(IoInterpretacion i) {
        try {
            return new IoResultado(i, solver.resolver(i.modelo()), null);
        } catch (IllegalArgumentException | ArithmeticException e) {
            return new IoResultado(i, null, e.getMessage());
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            LOGGER.error("Solver IO falló con un modelo válido: tipo={} metodo={}", i.modelo().path("tipo").asText(), i.modelo().path("metodo").asText(), e);
            return new IoResultado(i, null, "El servidor no pudo resolver este modelo.");
        }
    }

    private IoResultado desdeCache(String clave, String enunciado) {
        IoInterpretacion guardada = cache.get(clave);
        if (guardada == null && persistente != null) guardada = persistente.buscar(persistente.clave("io_modelo", clave)).map(s -> leer(s, enunciado)).orElse(null);
        if (!listo(guardada)) return null;
        IoResultado r = resolverModelo(guardada);
        if (r.solucion() == null || IoSolverService.sospechoso(r.solucion())) return null;
        cache.put(clave, guardada);
        return r;
    }

    /** Lo leído de la BD se vuelve a pasar por el validador: una fila alterada no sale sin las guardas del contrato. */
    private IoInterpretacion leer(String json, String enunciado) {
        try {
            JsonNode n = JSON.readTree(json);
            var i = validator.validar(new IoInterpretacion("listo", n.path("fuente").asText("local"), n.path("resumen").asText(), n.get("modelo"),
                    List.of(), textos(n.path("advertencias")), textos(n.path("supuestos"))), enunciado);
            return listo(i) ? new IoInterpretacion(i.estado(), i.fuente(), i.resumen(), i.modelo(), i.preguntas(), List.copyOf(new LinkedHashSet<>(i.advertencias())), i.supuestos()) : null;
        } catch (Exception e) { return null; }
    }

    private void guardar(String clave, IoInterpretacion i, boolean persistir) {
        cache.put(clave, i);
        if (persistente == null || !persistir) return;
        try {
            persistente.guardar(persistente.clave("io_modelo", clave), JSON.writeValueAsString(Map.of("fuente", i.fuente(), "resumen", i.resumen(),
                    "modelo", i.modelo(), "advertencias", i.advertencias(), "supuestos", i.supuestos())), i.fuente());
        } catch (Exception e) { LOGGER.warn("Modelado IO: no se pudo guardar en caché persistente ({})", e.getMessage()); }
    }

    /** Si el intérprete del servidor leyó el mismo enunciado y llega a otra cifra, se avisa en lugar de callarlo. */
    private static IoResultado contrastar(IoResultado ia, IoResultado det) {
        if (det == null || det.solucion() == null || !ia.solucion().tipo().equals(det.solucion().tipo())) return ia;
        List<Double> a = cifras(ia.solucion()), b = cifras(det.solucion());
        boolean iguales = a.size() == b.size();
        for (int i = 0; iguales && i < a.size(); i++)
            iguales = Math.abs(a.get(i) - b.get(i)) <= 1e-6 * Math.max(1, Math.max(Math.abs(a.get(i)), Math.abs(b.get(i))));
        if (iguales) return ia;
        return conAdvertencia(ia, "El intérprete del servidor leyó el enunciado de otra forma y obtiene otro resultado (" + a + " frente a " + b
                + "). Revisa los coeficientes del modelo antes de usar el resultado.");
    }

    /** Huella numérica de una solución: Z si existe (PL, cuadrática); si no, todas sus métricas numéricas. */
    private static List<Double> cifras(com.dagon.backend.service.io.solver.IoSolucion s) {
        if (s.resultado() != null && s.resultado().get("z") instanceof Number z) return List.of(z.doubleValue());
        var lista = new ArrayList<Double>();
        for (var m : s.metricas()) if (m.valor() instanceof Number n) lista.add(n.doubleValue());
        return lista;
    }

    private static IoResultado conAdvertencia(IoResultado r, String advertencia) {
        var i = r.interpretacion();
        var advertencias = new ArrayList<>(i.advertencias()); advertencias.add(advertencia);
        return new IoResultado(new IoInterpretacion(i.estado(), i.fuente(), i.resumen(), i.modelo(), i.preguntas(), advertencias, i.supuestos()), r.solucion(), r.errorSolucion());
    }

    private static boolean listo(IoInterpretacion i) { return i != null && "listo".equals(i.estado()); }
    private static List<String> textos(JsonNode n) { var l = new ArrayList<String>(); if (n.isArray()) n.forEach(t -> l.add(t.asText())); return l; }

    /**
     * PL que no declara la integralidad que el texto exige. Si el texto es de sí/no (binario) se exige
     * declarar binarias: "enteras" a secas permitiría usar un proyecto más de una vez.
     */
    private static boolean omiteIntegralidad(IoInterpretacion r, String enunciado) {
        var modelo = r.modelo();
        if (modelo == null || !"pl".equals(modelo.path("tipo").asText())) return false;
        boolean binario = IoParserLocal.exigeBinarias(enunciado);
        if (!binario && !IoParserLocal.exigeEnteros(enunciado)) return false;
        var datos = modelo.path("datos");
        if (datos.path("binarias").size() > 0) return false;
        if (!binario && datos.path("enteras").size() > 0) return false;
        for (var restriccion : datos.path("restricciones")) {
            var m = IoModeloValidator.DECLARACION.matcher(restriccion.asText());
            if (m.matches() && (!binario || m.group(2).toLowerCase().matches("binari.*|bin|∈.*"))) return false;
        }
        return true;
    }
}
