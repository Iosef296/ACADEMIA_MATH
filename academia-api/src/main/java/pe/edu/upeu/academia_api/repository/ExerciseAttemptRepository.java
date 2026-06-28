package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.ExerciseAttempt;

import java.util.List;
import java.util.UUID;

public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, UUID> {
    List<ExerciseAttempt> findByUserIdOrderByAttemptedAtDesc(UUID userId);
    List<ExerciseAttempt> findByUserIdAndExerciseIdOrderByAttemptedAtDesc(UUID userId, UUID exerciseId);

    @Query("SELECT COUNT(a) FROM ExerciseAttempt a WHERE a.user.id = :userId AND a.isCorrect = true")
    long countCorrectByUserId(UUID userId);

    @Query("SELECT COUNT(a) FROM ExerciseAttempt a WHERE a.user.id = :userId")
    long countByUserId(UUID userId);
}
