package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.StudentAnswer;

import java.util.List;
import java.util.UUID;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, UUID> {
    List<StudentAnswer> findByAttemptId(UUID attemptId);
}
