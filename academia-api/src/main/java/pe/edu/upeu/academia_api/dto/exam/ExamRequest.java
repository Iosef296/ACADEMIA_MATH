package pe.edu.upeu.academia_api.dto.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ExamRequest {
    @NotBlank
    private String title;
    @NotNull
    private UUID topicId;
    private Integer durationMinutes;
    private Boolean isAdaptive;
    private Boolean lockScreen;
    private Boolean shuffleQuestions;
    private Double passingScore;
    private String examType;
    private String scheduledAt;
    private String scheduledUntil;
}
