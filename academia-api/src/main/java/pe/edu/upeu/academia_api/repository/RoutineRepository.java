package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Routine;

import java.util.List;
import java.util.UUID;

public interface RoutineRepository extends JpaRepository<Routine, UUID> {
    List<Routine> findByUserId(UUID userId);
}
