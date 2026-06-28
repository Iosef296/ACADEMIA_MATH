package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetToken(String token);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%',:query,'%'))")
    List<User> searchByNameOrEmail(String query);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = pe.edu.upeu.academia_api.entity.UserRole.STUDENT")
    long countStudents();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = pe.edu.upeu.academia_api.entity.UserRole.TEACHER")
    long countTeachers();
}
