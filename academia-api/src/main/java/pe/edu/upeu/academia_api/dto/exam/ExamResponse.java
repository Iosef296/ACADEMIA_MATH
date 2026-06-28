package pe.edu.upeu.academia_api.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExamResponse {
    private UUID id;
    private String title;
    private UUID topicId;
    private String topicName;
    private Integer durationMinutes;
    private Boolean isAdaptive;
    private Boolean lockScreen;
    private Boolean shuffleQuestions;
    private Double passingScore;
    private String examType;
    private String scheduledAt;
    private String scheduledUntil;
    private Integer questionCount;
    private LocalDateTime createdAt;
}
