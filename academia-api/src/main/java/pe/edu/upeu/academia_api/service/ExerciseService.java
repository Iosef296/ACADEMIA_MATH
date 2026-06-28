package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.exercise.ExerciseRequest;
import pe.edu.upeu.academia_api.dto.exercise.ExerciseResponse;
import pe.edu.upeu.academia_api.dto.exercise.ExerciseStepRequest;
import pe.edu.upeu.academia_api.dto.exercise.RateRequest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ExerciseService {
    List<ExerciseResponse> findAll(String topicId, String difficulty);
    ExerciseResponse findById(UUID id);
    Map<String, Object> generate(UUID id);
    Map<String, Object> generateForStudent(UUID id, UUID userId);
    Map<String, Object> rate(RateRequest request, UUID userId);
    List<Map<String, Object>> getHistory(UUID userId);
    List<Map<String, Object>> getFlashcards(UUID userId);
    ExerciseResponse create(ExerciseRequest request, UUID creatorId);
    ExerciseResponse update(UUID id, ExerciseRequest request);
    void delete(UUID id);
    List<ExerciseResponse.StepRef> getSteps(UUID id);
    ExerciseResponse.StepRef addStep(UUID id, ExerciseStepRequest request);
    void reorderSteps(UUID id, List<UUID> stepIds);
    ExerciseResponse.StepRef updateStep(UUID exerciseId, UUID stepId, ExerciseStepRequest request);
    void deleteStep(UUID exerciseId, UUID stepId);
}
