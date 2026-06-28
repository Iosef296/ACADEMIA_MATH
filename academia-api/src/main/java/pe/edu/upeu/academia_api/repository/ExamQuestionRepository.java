package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.ExamQuestion;

import java.util.List;
import java.util.UUID;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, UUID> {
    List<ExamQuestion> findByExamIdOrderByQuestionOrderAsc(UUID examId);
}
