package pe.edu.upeu.academia_api.dto.mood;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MoodResponse {
    private UUID id;
    private String mood;
    private LocalDateTime createdAt;
}
