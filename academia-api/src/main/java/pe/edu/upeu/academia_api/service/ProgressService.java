package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.progress.ProgressResponse;
import pe.edu.upeu.academia_api.dto.progress.StreakResponse;

import java.util.List;
import java.util.UUID;

public interface ProgressService {
    List<ProgressResponse> findAll(UUID userId);
    List<ProgressResponse> getErrors(UUID userId);
    StreakResponse getStreak(UUID userId);
    ProgressResponse getByTopic(UUID userId, UUID topicId);
    void recordExercise(UUID userId, UUID topicId, boolean isCorrect, int timeSpent);
}
