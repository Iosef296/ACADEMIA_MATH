package pe.edu.upeu.academia_api.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForumStatsResponse {
    private long totalPosts;
    private long unanswered;
    private List<TagCount> topTags;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TagCount {
        private String name;
        private long count;
    }
}
