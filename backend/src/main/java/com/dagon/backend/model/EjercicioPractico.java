package com.dagon.backend.model;

import java.util.UUID;
import jakarta.persistence.*;

@Entity
@Table(name = "ejercicios_practicos", schema = "lms_core")
public class EjercicioPractico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ejercicio")
    private Integer idEjercicio;

    @Column(name = "id_modulo")
    private Integer idModulo;

    @Column(name = "enunciado", nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(name = "query_maestra", nullable = false, columnDefinition = "TEXT")
    private String queryMaestra;

    @Column(name = "dificultad")
    private Integer dificultad;

    @Column(name = "formato")
    private String formato;

    @Column(name = "configuracion_extra", columnDefinition = "jsonb")
    private String configuracionExtra;

    @Column(name = "titulo")
    private String titulo;

    @Column(name = "orden")
    private Integer orden;

    @Column(name = "tipo_mision", length = 50)
    private String tipoMision;

    @Column(name = "creado_por")
    private UUID creadoPor;

    @Column(name = "visibilidad")
    private String visibilidad;

    @Column(name = "id_grupo")
    private Long idGrupo;
    // --- GETTERS Y SETTERS ---
    public Integer getIdEjercicio() { return idEjercicio; }
    public void setIdEjercicio(Integer idEjercicio) { this.idEjercicio = idEjercicio; }

    public Integer getIdModulo() { return idModulo; }
    public void setIdModulo(Integer idModulo) { this.idModulo = idModulo; }

    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }

    public String getQueryMaestra() { return queryMaestra; }
    public void setQueryMaestra(String queryMaestra) { this.queryMaestra = queryMaestra; }

    public Integer getDificultad() { return dificultad; }
    public void setDificultad(Integer dificultad) { this.dificultad = dificultad; }

    public String getFormato() { return formato; }
    public void setFormato(String formato) { this.formato = formato; }

    public String getConfiguracionExtra() { return configuracionExtra; }
    public void setConfiguracionExtra(String configuracionExtra) { this.configuracionExtra = configuracionExtra; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }

    public String getTipoMision() { return tipoMision; }
    public void setTipoMision(String tipoMision) { this.tipoMision = tipoMision; }

    public UUID getCreadoPor() { return creadoPor; }
    public void setCreadoPor(UUID creadoPor) { this.creadoPor = creadoPor; }

    public String getVisibilidad() { return visibilidad; }
    public void setVisibilidad(String visibilidad) { this.visibilidad = visibilidad; }

    public Long getIdGrupo() { return idGrupo; }
    public void setIdGrupo(Long idGrupo) { this.idGrupo = idGrupo; }
}
