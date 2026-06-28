package pe.edu.upeu.academia_api.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StreakResponse {
    private Integer current;
    private Integer max;
    private LocalDate lastActive;
}
