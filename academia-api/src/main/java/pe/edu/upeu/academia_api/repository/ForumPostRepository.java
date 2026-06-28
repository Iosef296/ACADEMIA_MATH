package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.ForumPost;

import java.util.List;
import java.util.UUID;

public interface ForumPostRepository extends JpaRepository<ForumPost, UUID> {
    List<ForumPost> findByParentIsNullOrderByCreatedAtDesc();
    List<ForumPost> findByTopicIdAndParentIsNullOrderByCreatedAtDesc(UUID topicId);
    List<ForumPost> findByExerciseIdAndParentIsNullOrderByCreatedAtDesc(UUID exerciseId);
}
