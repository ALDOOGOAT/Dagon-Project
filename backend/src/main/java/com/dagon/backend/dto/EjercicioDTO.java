package com.dagon.backend.dto;

import java.util.List;
import java.util.Map;

public class EjercicioDTO {
    private Integer id;
    private String title;
    private String description;
    private String type;
    private String starterCode;
    private String hint;
    private Integer orden;
    private Integer idModulo;
    private Integer difficulty;
    private Integer xpReward;
    private Integer timeLimitSeconds;
    private String concept;
    private List<String> wordBank;
    private Map<String, Object> pedagogia;
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

    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }

    public Integer getIdModulo() { return idModulo; }
    public void setIdModulo(Integer idModulo) { this.idModulo = idModulo; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

    public String getConcept() { return concept; }
    public void setConcept(String concept) { this.concept = concept; }

    public List<String> getWordBank() { return wordBank; }
    public void setWordBank(List<String> wordBank) { this.wordBank = wordBank; }

    public Map<String, Object> getPedagogia() { return pedagogia; }
    public void setPedagogia(Map<String, Object> pedagogia) { this.pedagogia = pedagogia; }
}
