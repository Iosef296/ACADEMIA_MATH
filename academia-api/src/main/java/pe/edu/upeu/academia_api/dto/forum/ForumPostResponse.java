package pe.edu.upeu.academia_api.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForumPostResponse {
    private UUID id;
    private String content;
    private AuthorRef author;
    private UUID topicId;
    private UUID exerciseId;
    private UUID parentId;
    private List<ForumPostResponse> replies;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthorRef {
        private UUID id;
        private String name;
    }
}
