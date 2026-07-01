package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.upeu.academia_api.entity.ForumReaction;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ForumReactionRepository extends JpaRepository<ForumReaction, ForumReaction.PK> {
    boolean existsByPostIdAndUserIdAndEmoji(UUID postId, UUID userId, String emoji);
    void deleteByPostIdAndUserIdAndEmoji(UUID postId, UUID userId, String emoji);

    @Query("select r.emoji, count(r) from ForumReaction r where r.postId = :postId group by r.emoji")
    List<Object[]> countByEmojiForPost(@Param("postId") UUID postId);

    @Query("select r.postId, r.emoji from ForumReaction r where r.userId = :userId and r.postId in :postIds")
    List<Object[]> findMineForPosts(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);
}
