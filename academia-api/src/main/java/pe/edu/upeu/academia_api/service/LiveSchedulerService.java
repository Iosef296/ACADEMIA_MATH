package pe.edu.upeu.academia_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.entity.LiveSession;
import pe.edu.upeu.academia_api.repository.LiveSessionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveSchedulerService {

    private final LiveSessionRepository liveSessionRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void activateScheduledSessions() {
        List<LiveSession> due = liveSessionRepository.findScheduledSessionsDue(LocalDateTime.now());
        if (due.isEmpty()) return;

        for (LiveSession session : due) {
            session.setStatus("ACTIVE");
            log.info("Sesión activada automáticamente: {} ({})", session.getTitle(), session.getId());
        }
        liveSessionRepository.saveAll(due);
    }
}
