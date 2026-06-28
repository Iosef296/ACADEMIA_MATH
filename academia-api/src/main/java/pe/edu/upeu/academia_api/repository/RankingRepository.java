package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Ranking;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RankingRepository extends JpaRepository<Ranking, UUID> {
    List<Ranking> findByWeekLabelOrderByScoreDesc(String weekLabel, Pageable pageable);
    Optional<Ranking> findByUserIdAndWeekLabel(UUID userId, String weekLabel);
}
