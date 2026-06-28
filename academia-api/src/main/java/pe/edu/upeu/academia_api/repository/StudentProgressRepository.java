package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.StudentProgress;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, UUID> {
    List<StudentProgress> findByUserId(UUID userId);
    Optional<StudentProgress> findByUserIdAndTopicId(UUID userId, UUID topicId);
    List<StudentProgress> findByUserIdAndErrorCountGreaterThanOrderByErrorCountDesc(UUID userId, int errorCount);
}
