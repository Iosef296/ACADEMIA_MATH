package pe.edu.upeu.academia_api.dto.topic;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class TopicRequest {
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

    @JsonProperty("unlock_condition")
    private String unlockCondition;

    @JsonProperty("estimated_minutes")
    private Integer estimatedMinutes;

    private String difficulty;

    @JsonProperty("prerequisite_ids")
    private List<UUID> prerequisiteIds;
}
