package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.exam.AnswerRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ExamService {
    List<ExamResponse> findAll(String topicId);
    ExamResponse findById(UUID id);
    ExamResponse create(ExamRequest request, UUID creatorId);
    ExamResponse update(UUID id, ExamRequest request);
    void delete(UUID id);
    Map<String, Object> startAttempt(UUID examId, UUID userId);
    Map<String, Object> submitAttempt(UUID attemptId, List<AnswerRequest> answers, UUID userId);
    Map<String, Object> getResults(UUID attemptId);
}
