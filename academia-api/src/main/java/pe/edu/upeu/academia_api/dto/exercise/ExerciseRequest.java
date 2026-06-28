package pe.edu.upeu.academia_api.dto.exercise;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ExerciseRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String contentLatex;
    @NotNull
    private UUID topicId;
    private Boolean isParametric;
    private String difficulty;
    private Boolean needsGraph;
    private String graphType;
}
