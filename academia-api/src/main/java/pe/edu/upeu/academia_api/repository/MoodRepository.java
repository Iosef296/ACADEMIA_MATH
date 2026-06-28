package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Mood;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MoodRepository extends JpaRepository<Mood, UUID> {
    List<Mood> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Mood> findFirstByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);
}
