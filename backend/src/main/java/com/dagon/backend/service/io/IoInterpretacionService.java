package com.dagon.backend.service.io;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class IoInterpretacionService {
    private static final Logger LOGGER = LoggerFactory.getLogger(IoInterpretacionService.class);
    private final IoParserLocal parser;
    private final IoProveedorClient proveedor;
    private final IoModeloValidator validator;
    public IoInterpretacionService(IoParserLocal parser, IoProveedorClient proveedor, IoModeloValidator validator) {
        this.parser = parser; this.proveedor = proveedor; this.validator = validator;
    }
    public IoInterpretacion interpretar(String enunciado) {
        IoInterpretacion local = parser.interpretar(enunciado);
        if ("listo".equals(local.estado())) {
            local = validator.validar(local, enunciado);
            if ("listo".equals(local.estado())) return local;
        }
        boolean integralidadOmitida = false;
        for (String fuente : proveedor.fuentesDisponibles()) {
            try {
                IoInterpretacion resultado = validator.desdeProveedor(proveedor.extraer(fuente, enunciado), fuente, enunciado);
                // Guarda determinista: el texto pide enteros/sí-no y el modelo continuo lo ignora -> otra fuente.
                if ("listo".equals(resultado.estado()) && IoParserLocal.exigeEnteros(enunciado) && omiteIntegralidad(resultado)) {
                    integralidadOmitida = true;
                    LOGGER.warn("Modelado IO: proveedor={} categoria=integralidad_omitida status=0", fuente);
                    continue;
                }
                if ("listo".equals(resultado.estado()) || "incompleto".equals(resultado.estado())) return resultado;
            } catch (Exception error) {
                String categoria = error instanceof IoProveedorClient.ErrorProveedor p ? p.categoria
                        : error instanceof java.util.concurrent.TimeoutException || error instanceof java.net.http.HttpTimeoutException ? "timeout"
                        : error instanceof com.fasterxml.jackson.core.JsonProcessingException ? "json_invalido"
                        : error instanceof IllegalArgumentException ? "contrato_invalido" : "transporte";
                int status = error instanceof IoProveedorClient.ErrorProveedor p ? p.status : 0;
                LOGGER.warn("Modelado IO: proveedor={} categoria={} status={}", fuente, categoria, status);
            }
        }
        if (integralidadOmitida) return IoInterpretacion.incompleto("El modelo extraído ignora que las decisiones son enteras o de sí/no.",
                List.of("El enunciado indica unidades completas o decisiones de sí/no. Declara en el modelo qué variables son enteras o binarias (por ejemplo \"x1, x2 binarias\") y vuelve a analizar."));
        var advertencias = new ArrayList<>(local.advertencias());
        advertencias.add("El reconocimiento local tiene alcance limitado. Si faltan datos o no se reconoce la redacción, completa el modelo manualmente.");
        return new IoInterpretacion(local.estado(), "local", local.resumen(), null, local.preguntas(), advertencias, local.supuestos());
    }
    /** PL sin ninguna declaración de variables enteras o binarias (ni lista ni línea "x1, x2 enteras"). */
    private static boolean omiteIntegralidad(IoInterpretacion r) {
        var modelo = r.modelo();
        if (modelo == null || !"pl".equals(modelo.path("tipo").asText())) return false;
        var datos = modelo.path("datos");
        if (datos.path("enteras").size() > 0 || datos.path("binarias").size() > 0) return false;
        for (var restriccion : datos.path("restricciones")) if (IoModeloValidator.DECLARACION.matcher(restriccion.asText()).matches()) return false;
        return true;
    }
}
