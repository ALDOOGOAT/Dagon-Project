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

    public record GrupoDocenteDTO(
            Long idGrupo,
            String nombreGrupo,
            String codigoAcceso,
            String descripcion,
            boolean activo,
            LocalDateTime fechaCreacion,
            int totalAlumnos
    ) {}

    public record CrearGrupoRequest(
            String nombreGrupo,
            String descripcion
    ) {}

    public record AgregarAlumnoRequest(
            String idAlumno,
            String emailAlumno
    ) {}

    public record EvaluacionDTO(
            Long idEvaluacion,
            UUID idDocente,
            UUID idAlumno,
            Integer idCurso,
            Integer idModulo,
            double calificacion,
            String comentario,
            LocalDateTime fechaEvaluacion
    ) {}

    public record CrearEvaluacionRequest(
            String idAlumno,
            Integer idCurso,
            Integer idModulo,
            double calificacion,
            String comentario
    ) {}
    public record EjercicioDocenteDTO(
        Integer idEjercicio,
        Integer idModulo,
        String titulo,
        String enunciado,
        String queryMaestra,
        Integer dificultad,
        String formato,
        String configuracionExtra,
        Integer orden,
        String tipoMision,
        UUID creadoPor,
        String visibilidad,
        Long idGrupo,
        String nombreGrupo
) {}

    public record CalificacionEjercicioDTO(
            UUID idAlumno,
            String nombreAlumno,
            String emailAlumno,
            Integer idCurso,
            String curso,
            Integer idModulo,
            String modulo,
            Integer idEjercicio,
            String ejercicio,
            int intentos,
            boolean resuelto,
            double calificacion,
            LocalDateTime fechaResuelto
    ) {}

    public record CalificacionModuloDTO(
            UUID idAlumno,
            String nombreAlumno,
            String emailAlumno,
            Integer idCurso,
            String curso,
            Integer idModulo,
            String modulo,
            int ejerciciosTotales,
            int ejerciciosResueltos,
            double calificacion
    ) {}

    public record CalificacionCursoDTO(
            UUID idAlumno,
            String nombreAlumno,
            String emailAlumno,
            Integer idCurso,
            String curso,
            int ejerciciosTotales,
            int ejerciciosResueltos,
            double calificacion
    ) {}

public record CrearEjercicioDocenteRequest(
        Integer idModulo,
        String titulo,
        String enunciado,
        String queryMaestra,
        Integer dificultad,
        String formato,
        String configuracionExtra,
        Integer orden,
        String tipoMision,
        String visibilidad,
        Long idGrupo
) {}
}
