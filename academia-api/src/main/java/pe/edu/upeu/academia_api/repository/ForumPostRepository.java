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

    @Query("""
        select p from ForumPost p
        where p.parent is null
          and (:topicId is null or p.topic.id = :topicId)
          and (:exerciseId is null or p.exercise.id = :exerciseId)
          and (:onlyUnanswered = false or size(p.replies) = 0)
          and (:onlySolved = false or p.acceptedReply is not null)
        """)
    Page<ForumPost> findFiltered(
            @Param("topicId") UUID topicId,
            @Param("exerciseId") UUID exerciseId,
            @Param("onlyUnanswered") boolean onlyUnanswered,
            @Param("onlySolved") boolean onlySolved,
            Pageable pageable);

    @Query("""
        select p from ForumPost p
        where p.parent is null
          and (:topicId is null or p.topic.id = :topicId)
          and (:exerciseId is null or p.exercise.id = :exerciseId)
        order by (select count(l) from ForumLike l where l.postId = p.id) desc, p.createdAt desc
        """)
    Page<ForumPost> findOrderByLikes(
            @Param("topicId") UUID topicId,
            @Param("exerciseId") UUID exerciseId,
            Pageable pageable);

    @Query("""
        select count(p) from ForumPost p
        where p.parent is null and size(p.replies) = 0
        """)
    long countUnanswered();

    @Query("""
        select t.name, count(p) as c
        from ForumPost p join p.tags t
        where p.parent is null
        group by t.name
        order by c desc
        """)
    List<Object[]> topTagsRaw(Pageable pageable);
}
