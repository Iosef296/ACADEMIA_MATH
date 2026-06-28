package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.StudyGoal;

import java.util.List;
import java.util.UUID;

public interface StudyGoalRepository extends JpaRepository<StudyGoal, UUID> {
    List<StudyGoal> findByUserIdAndIsActiveTrue(UUID userId);
    List<StudyGoal> findByUserId(UUID userId);
}
