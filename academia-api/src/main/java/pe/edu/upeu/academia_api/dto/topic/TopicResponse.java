package pe.edu.upeu.academia_api.dto.topic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TopicResponse {
    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private UUID parentId;
    private Integer topicOrder;
    private Boolean isLocked;
    private Integer estimatedMinutes;
    private List<TopicResponse> children;
    private List<UUID> prerequisiteIds;
}
