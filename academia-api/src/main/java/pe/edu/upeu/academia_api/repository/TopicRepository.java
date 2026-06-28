package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.Topic;

import java.util.List;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {
    List<Topic> findByParentIsNullOrderByTopicOrderAsc();

    @Query("SELECT t FROM Topic t WHERE " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%',:query,'%'))")
    List<Topic> search(String query);
}
