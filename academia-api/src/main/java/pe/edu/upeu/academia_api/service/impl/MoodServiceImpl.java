package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.mood.MoodRequest;
import pe.edu.upeu.academia_api.dto.mood.MoodResponse;
import pe.edu.upeu.academia_api.entity.Mood;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.MoodRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.MoodService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MoodServiceImpl implements MoodService {

    private final MoodRepository moodRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public MoodResponse create(MoodRequest request, UUID userId) {
        Mood mood = Mood.builder()
                .mood(request.getMood())
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .build();
        return toResponse(moodRepository.save(mood));
    }

    @Override
    @Transactional(readOnly = true)
    public MoodResponse getToday(UUID userId) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return moodRepository.findFirstByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, startOfDay)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "No se encontró estado de ánimo hoy"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MoodResponse> getHistory(UUID userId) {
        return moodRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    private MoodResponse toResponse(Mood m) {
        return MoodResponse.builder()
                .id(m.getId()).mood(m.getMood()).createdAt(m.getCreatedAt())
                .build();
    }
}
