package pe.edu.upeu.academia_api.dto.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChallengeResponse {
    private UUID id;
    private String title;
    private String description;
    private Integer rewardXp;
    private LocalDate startDate;
    private LocalDate endDate;
}
