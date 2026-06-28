package pe.edu.upeu.academia_api.dto.live;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LiveSessionRequest {
    @NotBlank
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
