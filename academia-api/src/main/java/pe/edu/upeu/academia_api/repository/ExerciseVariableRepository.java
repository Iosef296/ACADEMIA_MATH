package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.ExerciseVariable;

import java.util.List;
import java.util.UUID;

public interface ExerciseVariableRepository extends JpaRepository<ExerciseVariable, UUID> {
    List<ExerciseVariable> findByExerciseId(UUID exerciseId);
}
