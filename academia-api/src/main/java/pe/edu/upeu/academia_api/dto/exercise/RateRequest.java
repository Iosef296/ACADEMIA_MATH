package pe.edu.upeu.academia_api.dto.exercise;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class RateRequest {
    @NotBlank
    private String exerciseId;
    @NotBlank
    private String rating;
    private Integer hintsUsed;
    private Integer timeSpent;
    private java.util.Map<String, Double> variableValues;
}
