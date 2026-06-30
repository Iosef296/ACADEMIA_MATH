package pe.edu.upeu.academia_api.dto.exercise;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExerciseVariableRequest {
    @NotBlank
    private String varName;
    private Double minVal;
    private Double maxVal;
    private Double stepVal;
    private String constraintType;
    private String constraintValue;
    private Boolean integerOnly;
}
