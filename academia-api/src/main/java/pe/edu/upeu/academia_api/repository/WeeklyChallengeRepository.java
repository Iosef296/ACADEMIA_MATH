package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.WeeklyChallenge;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface WeeklyChallengeRepository extends JpaRepository<WeeklyChallenge, UUID> {
    List<WeeklyChallenge> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}
