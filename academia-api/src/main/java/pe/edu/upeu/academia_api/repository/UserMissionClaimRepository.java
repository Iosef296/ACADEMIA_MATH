package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.UserMissionClaim;

import java.util.List;
import java.util.UUID;

public interface UserMissionClaimRepository extends JpaRepository<UserMissionClaim, Long> {
    List<UserMissionClaim> findByUserId(UUID userId);
    boolean existsByUserIdAndMissionId(UUID userId, Long missionId);
}
