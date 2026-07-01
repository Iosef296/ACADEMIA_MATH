package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "forum_reactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(ForumReaction.PK.class)
public class ForumReaction {

    @Id
    @Column(name = "post_id")
    private UUID postId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(nullable = false, length = 16)
    private String emoji;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PK implements Serializable {
        private UUID postId;
        private UUID userId;
        private String emoji;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(postId, pk.postId)
                && Objects.equals(userId, pk.userId)
                && Objects.equals(emoji, pk.emoji);
        }

        @Override
        public int hashCode() {
            return Objects.hash(postId, userId, emoji);
        }
    }
}
