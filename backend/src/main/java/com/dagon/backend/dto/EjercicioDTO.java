package com.dagon.backend.dto;

import java.util.List;

public class EjercicioDTO {
    private Integer id;
    private String title;
    private String description;
    private String type;
    private String starterCode;
    private String hint;
    // ¡NUEVO! El banco de palabras para el Drag & Drop
    private List<String> wordBank;
    // --- GETTERS Y SETTERS ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStarterCode() { return starterCode; }
    public void setStarterCode(String starterCode) { this.starterCode = starterCode; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    // ¡NUEVOS GETTERS Y SETTERS!
    public List<String> getWordBank() { return wordBank; }
    public void setWordBank(List<String> wordBank) { this.wordBank = wordBank; }
}