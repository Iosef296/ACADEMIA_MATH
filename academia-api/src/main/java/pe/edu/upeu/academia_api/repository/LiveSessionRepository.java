package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.academia_api.entity.LiveSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LiveSessionRepository extends JpaRepository<LiveSession, UUID> {
    List<LiveSession> findByStatusOrderByStartTimeAsc(String status);
    List<LiveSession> findByTeacherIdOrderByStartTimeDesc(UUID teacherId);
    List<LiveSession> findAllByOrderByStatusAscStartTimeDesc();

    @Query("SELECT s FROM LiveSession s WHERE s.status = 'SCHEDULED' AND s.startTime <= :now")
    List<LiveSession> findScheduledSessionsDue(LocalDateTime now);
}
