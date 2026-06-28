package pe.edu.upeu.academia_api.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProgressResponse {
    private UUID id;
    private UUID topicId;
    private String topicName;
    private Integer xp;
    private Integer level;
    private Integer exercisesSolved;
    private Integer errorCount;
    private Integer timeSpent;
    private LocalDateTime updatedAt;
}
