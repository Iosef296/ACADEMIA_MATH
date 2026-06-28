package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Graph;

import java.util.List;
import java.util.UUID;

public interface GraphRepository extends JpaRepository<Graph, UUID> {
    List<Graph> findByTopicId(UUID topicId);
    List<Graph> findByExerciseId(UUID exerciseId);
}
