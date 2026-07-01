package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.upeu.academia_api.entity.ForumLike;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ForumLikeRepository extends JpaRepository<ForumLike, ForumLike.PK> {
    long countByPostId(UUID postId);
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
    void deleteByPostIdAndUserId(UUID postId, UUID userId);

    @Query("select l.postId from ForumLike l where l.userId = :userId and l.postId in :postIds")
    List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);
}
