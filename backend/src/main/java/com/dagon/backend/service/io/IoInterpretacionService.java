package com.dagon.backend.service.io;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
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
        for (String fuente : proveedor.fuentesDisponibles()) {
            try {
                IoInterpretacion resultado = validator.desdeProveedor(proveedor.extraer(fuente, enunciado), fuente, enunciado);
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
        var advertencias = new ArrayList<>(local.advertencias());
        advertencias.add("El reconocimiento local tiene alcance limitado. Si faltan datos o no se reconoce la redacción, completa el modelo manualmente.");
        return new IoInterpretacion(local.estado(), "local", local.resumen(), null, local.preguntas(), advertencias, local.supuestos());
    }
}
