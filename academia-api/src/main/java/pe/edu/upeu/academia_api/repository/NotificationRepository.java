package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.Notification;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(UUID userId);
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
