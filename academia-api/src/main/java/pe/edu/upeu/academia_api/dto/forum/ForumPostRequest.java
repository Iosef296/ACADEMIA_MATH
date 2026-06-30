package pe.edu.upeu.academia_api.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ForumPostRequest {
    @Size(max = 255)
    private String title;

    @NotBlank
    private String content;
    private UUID topicId;
    private UUID exerciseId;
    private UUID parentId;
}
