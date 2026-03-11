package com.dagon.backend.model;

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
}