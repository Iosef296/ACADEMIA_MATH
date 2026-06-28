package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.ExamAttempt;

import java.util.List;
import java.util.UUID;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {
    List<ExamAttempt> findByUserIdOrderByStartedAtDesc(UUID userId);
    List<ExamAttempt> findByExamIdAndUserId(UUID examId, UUID userId);
    List<ExamAttempt> findByExamIdOrderByScoreDesc(UUID examId);

    @Query("SELECT AVG(a.score) FROM ExamAttempt a WHERE a.exam.id = :examId AND a.score IS NOT NULL")
    Double avgScoreByExam(UUID examId);

    @Query("SELECT COUNT(a) FROM ExamAttempt a WHERE a.submittedAt IS NOT NULL")
    long countCompleted();
}
