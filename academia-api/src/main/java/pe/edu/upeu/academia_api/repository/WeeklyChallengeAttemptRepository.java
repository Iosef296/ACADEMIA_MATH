package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.WeeklyChallengeAttempt;

import java.util.List;
import java.util.UUID;

public interface WeeklyChallengeAttemptRepository extends JpaRepository<WeeklyChallengeAttempt, UUID> {
    List<WeeklyChallengeAttempt> findByUserId(UUID userId);
    List<WeeklyChallengeAttempt> findByChallengeIdAndUserId(UUID challengeId, UUID userId);
}
