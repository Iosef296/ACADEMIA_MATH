package pe.edu.upeu.academia_api.dto.topic;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("parent_id")
    private UUID parentId;

    @JsonProperty("topic_order")
    private Integer topicOrder;

    @JsonProperty("is_locked")
    private Boolean isLocked;

    @JsonProperty("estimated_minutes")
    private Integer estimatedMinutes;

    private String difficulty;

    private List<TopicResponse> children;

    @JsonProperty("prerequisite_ids")
    private List<UUID> prerequisiteIds;
}
