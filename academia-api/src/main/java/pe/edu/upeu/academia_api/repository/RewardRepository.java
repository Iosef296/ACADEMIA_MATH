package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Reward;

import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {
}
