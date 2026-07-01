package pe.edu.upeu.academia_api.dto.forum;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ForumPostRequest {
    @Size(max = 255)
    private String title;

    private String content;
    private UUID topicId;
    private UUID exerciseId;
    private UUID parentId;
    private List<String> tags;
    private List<ForumStepDto> steps;
}
