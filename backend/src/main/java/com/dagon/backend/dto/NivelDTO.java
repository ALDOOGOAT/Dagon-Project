package com.dagon.backend.dto;

public class NivelDTO {
    // Estas son las etiquetas exactas en inglés que React está buscando
    private Integer id;
    private String name;
    private String description;
    private boolean locked;

    // --- GETTERS Y SETTERS ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }
}