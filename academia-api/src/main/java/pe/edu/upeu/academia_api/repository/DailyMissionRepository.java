package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.DailyMission;

import java.util.List;

public interface DailyMissionRepository extends JpaRepository<DailyMission, Long> {
    List<DailyMission> findByActiveTrueOrderByMissionTypeAscTargetValueAsc();
}
