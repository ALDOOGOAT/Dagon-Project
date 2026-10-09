package com.dagon.backend.service.io;

import com.dagon.backend.service.io.solver.IoSolucion;
import java.util.Map;

/** Interpretación del enunciado más la solución calculada en el servidor (o el motivo por el que no se pudo calcular). */
public record IoResultado(IoInterpretacion interpretacion, IoSolucion solucion, String errorSolucion) {
    public static IoResultado sinSolucion(IoInterpretacion interpretacion) { return new IoResultado(interpretacion, null, null); }
    public Map<String, Object> contratoHttp() {
        Map<String, Object> salida = interpretacion.contratoHttp();
        salida.put("solucion", solucion);
        salida.put("errorSolucion", errorSolucion);
        return salida;
    }
}
