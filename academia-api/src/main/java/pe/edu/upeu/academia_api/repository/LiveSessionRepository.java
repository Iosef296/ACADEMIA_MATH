package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.LiveSession;

import java.util.List;
import java.util.UUID;

public interface LiveSessionRepository extends JpaRepository<LiveSession, UUID> {
    List<LiveSession> findByStatusOrderByStartTimeAsc(String status);
    List<LiveSession> findByTeacherIdOrderByStartTimeDesc(UUID teacherId);
    List<LiveSession> findAllByOrderByStatusAscStartTimeDesc();
}
