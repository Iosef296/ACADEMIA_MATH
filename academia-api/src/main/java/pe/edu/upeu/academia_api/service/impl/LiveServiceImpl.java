package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.live.LiveSessionRequest;
import pe.edu.upeu.academia_api.dto.live.LiveSessionResponse;
import pe.edu.upeu.academia_api.entity.LiveSession;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.LiveSessionRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.LiveService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LiveServiceImpl implements LiveService {

    private final LiveSessionRepository liveSessionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LiveSessionResponse> findAll() {
        return liveSessionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LiveSessionResponse findById(UUID id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public LiveSessionResponse create(LiveSessionRequest request, UUID teacherId) {
        LiveSession session = LiveSession.builder()
                .title(request.getTitle())
                .jitsiRoomId(UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .teacher(userRepository.findById(teacherId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .build();
        return toResponse(liveSessionRepository.save(session));
    }

    @Override
    @Transactional
    public LiveSessionResponse updateStatus(UUID id, String status) {
        LiveSession session = find(id);
        session.setStatus(status);
        return toResponse(liveSessionRepository.save(session));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        liveSessionRepository.deleteById(id);
    }

    private LiveSession find(UUID id) {
        return liveSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
    }

    private LiveSessionResponse toResponse(LiveSession s) {
        return LiveSessionResponse.builder()
                .id(s.getId()).title(s.getTitle())
                .jitsiRoomId(s.getJitsiRoomId())
                .teacherName(s.getTeacher().getName())
                .startTime(s.getStartTime()).endTime(s.getEndTime())
                .status(s.getStatus()).createdAt(s.getCreatedAt())
                .build();
    }
}
