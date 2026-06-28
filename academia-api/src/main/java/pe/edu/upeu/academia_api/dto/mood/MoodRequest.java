package pe.edu.upeu.academia_api.dto.mood;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MoodRequest {
    @NotBlank
    private String mood;
}
