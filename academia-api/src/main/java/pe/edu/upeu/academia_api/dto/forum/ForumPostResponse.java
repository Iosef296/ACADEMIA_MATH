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
    private String title;
    private String content;
    private AuthorRef author;
    private UUID topicId;
    private UUID exerciseId;
    private UUID parentId;
    private List<ForumPostResponse> replies;
    private int replyCount;
    private UUID acceptedReplyId;
    private boolean isAccepted;
    private List<String> tags;
    private long likeCount;
    private boolean likedByMe;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthorRef {
        private UUID id;
        private String name;
    }
}
