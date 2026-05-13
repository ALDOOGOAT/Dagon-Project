package com.dagon.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class DocenteDTO {

    public record AlumnoProgresoDTO(
            UUID idUsuario,
            String nombre,
            String email,
            int xp,
            int ejerciciosCompletados,
            int totalIntentos,
            int racha,
            LocalDateTime fechaRegistro
    ) {}

    public record EjercicioFalladoDTO(
            int idEjercicio,
            String titulo,
            String modulo,
            int intentosTotales,
            int intentosFallidos,
            double tasaError
    ) {}

    public record ModuloAbandonoDTO(
            int idModulo,
            String titulo,
            int alumnosQueIniciaron,
            int alumnosQueCompletaron,
            double tasaAbandono
    ) {}

    public record TiempoModuloDTO(
            int idModulo,
            String titulo,
            double tiempoPromedioMs,
            int intentosTotales
    ) {}

    public record IntentoDetalleDTO(
            UUID idIntento,
            int idEjercicio,
            String tituloEjercicio,
            String queryEnviada,
            boolean esCorrecto,
            Double tiempoMs,
            LocalDateTime fechaIntento
    ) {}
}
