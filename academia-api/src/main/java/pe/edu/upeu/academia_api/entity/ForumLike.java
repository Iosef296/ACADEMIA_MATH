package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "forum_likes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(ForumLike.PK.class)
public class ForumLike {

    @Id
    @Column(name = "post_id")
    private UUID postId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PK implements Serializable {
        private UUID postId;
        private UUID userId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(postId, pk.postId) && Objects.equals(userId, pk.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(postId, userId);
        }
    }
}
