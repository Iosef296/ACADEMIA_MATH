package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.StudentProfile;

import java.util.Optional;
import java.util.UUID;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    Optional<StudentProfile> findByUserId(UUID userId);
}
