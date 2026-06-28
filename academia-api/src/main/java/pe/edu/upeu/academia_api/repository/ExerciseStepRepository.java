package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.ExerciseStep;

import java.util.List;
import java.util.UUID;

public interface ExerciseStepRepository extends JpaRepository<ExerciseStep, UUID> {
    List<ExerciseStep> findByExerciseIdOrderByStepOrderAsc(UUID exerciseId);
}
