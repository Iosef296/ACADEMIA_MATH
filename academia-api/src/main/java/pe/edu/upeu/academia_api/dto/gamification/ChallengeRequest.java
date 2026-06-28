package pe.edu.upeu.academia_api.dto.gamification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChallengeRequest {
    @NotBlank
    private String title;
    private String description;
    private Integer rewardXp;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
}
