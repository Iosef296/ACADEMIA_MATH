package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.Exercise;
import pe.edu.upeu.academia_api.entity.ExerciseDifficulty;

import java.util.List;
import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    @Query("SELECT e FROM Exercise e JOIN e.topic WHERE e.topic.id = :topicId")
    List<Exercise> findByTopicId(UUID topicId);

    @Query("SELECT e FROM Exercise e WHERE e.difficulty = :difficulty")
    List<Exercise> findByDifficulty(ExerciseDifficulty difficulty);

    @Query("SELECT e FROM Exercise e JOIN e.topic WHERE e.topic.id = :topicId AND e.difficulty = :difficulty")
    List<Exercise> findByTopicIdAndDifficulty(UUID topicId, ExerciseDifficulty difficulty);
}
