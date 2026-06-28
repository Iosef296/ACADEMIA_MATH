package pe.edu.upeu.academia_api.dto.forum;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ForumPostRequest {
    @NotBlank
    private String content;
    private UUID topicId;
    private UUID exerciseId;
    private UUID parentId;
}
