package pe.edu.upeu.academia_api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.upeu.academia_api.entity.ForumPost;

import java.util.List;
import java.util.UUID;

public interface ForumPostRepository extends JpaRepository<ForumPost, UUID> {
    List<ForumPost> findByParentIsNullOrderByCreatedAtDesc();
    List<ForumPost> findByTopicIdAndParentIsNullOrderByCreatedAtDesc(UUID topicId);
    List<ForumPost> findByExerciseIdAndParentIsNullOrderByCreatedAtDesc(UUID exerciseId);

    Page<ForumPost> findByParentIsNull(Pageable pageable);
    Page<ForumPost> findByTopicIdAndParentIsNull(UUID topicId, Pageable pageable);
    Page<ForumPost> findByExerciseIdAndParentIsNull(UUID exerciseId, Pageable pageable);

    @Query("select distinct p from ForumPost p join p.tags t where p.parent is null and lower(t.name) = lower(:tag)")
    Page<ForumPost> findByTagAndParentIsNull(@Param("tag") String tag, Pageable pageable);
}
