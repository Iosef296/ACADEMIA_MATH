package pe.edu.upeu.academia_api.dto.topic;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class TopicRequest {
    @NotBlank
    private String name;
    private String description;
    private String imageUrl;
    private UUID parentId;
    private Integer topicOrder;
    private Boolean isLocked;
    private String unlockCondition;
    private Integer estimatedMinutes;
}
