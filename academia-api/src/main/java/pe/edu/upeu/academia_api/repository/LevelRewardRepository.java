package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.LevelReward;

import java.util.List;

public interface LevelRewardRepository extends JpaRepository<LevelReward, Long> {
    List<LevelReward> findByActiveTrueOrderByLevelAsc();
    List<LevelReward> findByLevelAndActiveTrue(int level);
}
