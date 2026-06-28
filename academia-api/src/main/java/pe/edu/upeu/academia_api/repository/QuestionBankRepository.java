package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.ExerciseDifficulty;
import pe.edu.upeu.academia_api.entity.QuestionBank;

import java.util.List;
import java.util.UUID;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, UUID> {
    List<QuestionBank> findByTopicId(UUID topicId);
    List<QuestionBank> findByDifficulty(ExerciseDifficulty difficulty);
    List<QuestionBank> findByTopicIdAndDifficulty(UUID topicId, ExerciseDifficulty difficulty);

    @Query("SELECT q FROM QuestionBank q WHERE " +
           "LOWER(q.contentLatex) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(q.tags) LIKE LOWER(CONCAT('%',:query,'%'))")
    List<QuestionBank> search(String query);
}
