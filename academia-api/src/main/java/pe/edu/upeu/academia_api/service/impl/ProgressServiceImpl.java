package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.progress.ProgressResponse;
import pe.edu.upeu.academia_api.dto.progress.StreakResponse;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.entity.StudentProfile;
import pe.edu.upeu.academia_api.entity.StudentProgress;
import pe.edu.upeu.academia_api.entity.Topic;
import pe.edu.upeu.academia_api.entity.User;
import pe.edu.upeu.academia_api.repository.StudentProfileRepository;
import pe.edu.upeu.academia_api.repository.StudentProgressRepository;
import pe.edu.upeu.academia_api.repository.TopicRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.ProgressService;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final StudentProgressRepository progressRepository;
    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> findAll(UUID userId) {
        return progressRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getErrors(UUID userId) {
        return progressRepository
                .findByUserIdAndErrorCountGreaterThanOrderByErrorCountDesc(userId, 0)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StreakResponse getStreak(UUID userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Perfil no encontrado"));
        return StreakResponse.builder()
                .current(profile.getStreakCurrent())
                .max(profile.getStreakMax())
                .lastActive(profile.getStreakLastActive())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressResponse getByTopic(UUID userId, UUID topicId) {
        return progressRepository.findByUserIdAndTopicId(userId, topicId)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Progreso no encontrado para el tema indicado"));
    }

    @Override
    @Transactional
    public void recordExercise(UUID userId, UUID topicId, boolean isCorrect, int timeSpent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tema no encontrado"));

        StudentProgress progress = progressRepository.findByUserIdAndTopicId(userId, topicId)
                .orElse(StudentProgress.builder().user(user).topic(topic).build());

        progress.setExercisesSolved(progress.getExercisesSolved() + 1);
        progress.setTimeSpent(progress.getTimeSpent() + timeSpent);
        if (!isCorrect) {
            progress.setErrorCount(progress.getErrorCount() + 1);
        } else {
            int xpGain = 10;
            progress.setXp(progress.getXp() + xpGain);
            progress.setLevel(Math.max(1, progress.getXp() / 100 + 1));
        }
        progressRepository.save(progress);

        updateStreak(userId);
    }

    private void updateStreak(UUID userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            LocalDate today = LocalDate.now();
            LocalDate last = profile.getStreakLastActive();
            if (last == null || last.isBefore(today.minusDays(1))) {
                profile.setStreakCurrent(1);
            } else if (last.isBefore(today)) {
                profile.setStreakCurrent(profile.getStreakCurrent() + 1);
            }
            profile.setStreakLastActive(today);
            if (profile.getStreakCurrent() > profile.getStreakMax()) {
                profile.setStreakMax(profile.getStreakCurrent());
            }
            profileRepository.save(profile);
        });
    }

    private ProgressResponse toResponse(StudentProgress p) {
        return ProgressResponse.builder()
                .id(p.getId())
                .topicId(p.getTopic().getId())
                .topicName(p.getTopic().getName())
                .xp(p.getXp())
                .level(p.getLevel())
                .exercisesSolved(p.getExercisesSolved())
                .errorCount(p.getErrorCount())
                .timeSpent(p.getTimeSpent())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
