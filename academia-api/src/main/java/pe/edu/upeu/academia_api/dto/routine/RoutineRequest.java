package pe.edu.upeu.academia_api.dto.routine;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoutineRequest {
    @NotBlank
    private String title;
    private String schedule;
}
