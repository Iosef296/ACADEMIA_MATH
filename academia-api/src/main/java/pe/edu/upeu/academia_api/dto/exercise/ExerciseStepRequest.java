package pe.edu.upeu.academia_api.dto.exercise;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExerciseStepRequest {
    @NotBlank
    private String contentLatex;
    private String hint;
    private String warning;
    private Integer stepOrder;
}
