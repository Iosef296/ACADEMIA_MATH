package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Badge;

import java.util.UUID;

public interface BadgeRepository extends JpaRepository<Badge, UUID> {
}
