package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.exam.AnswerRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamResponse;
import pe.edu.upeu.academia_api.entity.*;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.ExamService;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final StudentAnswerRepository answerRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final ExamQuestionRepository questionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> findAll(String topicId) {
        List<Exam> exams = topicId != null
                ? examRepository.findByTopicId(UUID.fromString(topicId))
                : examRepository.findAll();
        return exams.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse findById(UUID id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public ExamResponse create(ExamRequest request, UUID creatorId) {
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tema no encontrado"));
        Exam exam = Exam.builder()
                .title(request.getTitle())
                .topic(topic)
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60)
                .isAdaptive(request.getIsAdaptive() != null ? request.getIsAdaptive() : false)
                .lockScreen(request.getLockScreen() != null ? request.getLockScreen() : false)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 60.0)
                .examType(request.getExamType() != null ? request.getExamType() : "practice")
                .build();
        if (request.getScheduledAt() != null) {
            try { exam.setScheduledAt(LocalDateTime.parse(request.getScheduledAt())); }
            catch (Exception ignored) {}
        }
        if (request.getScheduledUntil() != null) {
            try { exam.setScheduledUntil(LocalDateTime.parse(request.getScheduledUntil())); }
            catch (Exception ignored) {}
        }
        if (creatorId != null) userRepository.findById(creatorId).ifPresent(exam::setCreatedBy);
        return toResponse(examRepository.save(exam));
    }

    @Override
    @Transactional
    public ExamResponse update(UUID id, ExamRequest request) {
        Exam exam = find(id);
        exam.setTitle(request.getTitle());
        if (request.getDurationMinutes() != null) exam.setDurationMinutes(request.getDurationMinutes());
        if (request.getIsAdaptive() != null) exam.setIsAdaptive(request.getIsAdaptive());
        if (request.getLockScreen() != null) exam.setLockScreen(request.getLockScreen());
        if (request.getShuffleQuestions() != null) exam.setShuffleQuestions(request.getShuffleQuestions());
        if (request.getPassingScore() != null) exam.setPassingScore(request.getPassingScore());
        if (request.getExamType() != null) exam.setExamType(request.getExamType());
        if (request.getScheduledAt() != null) {
            try { exam.setScheduledAt(LocalDateTime.parse(request.getScheduledAt())); }
            catch (Exception ignored) {}
        }
        if (request.getScheduledUntil() != null) {
            try { exam.setScheduledUntil(LocalDateTime.parse(request.getScheduledUntil())); }
            catch (Exception ignored) {}
        }
        return toResponse(examRepository.save(exam));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        examRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Map<String, Object> startAttempt(UUID examId, UUID userId) {
        Exam exam = find(examId);

        if (exam.getScheduledAt() != null && LocalDateTime.now().isBefore(exam.getScheduledAt())) {
            throw new AppException(HttpStatus.FORBIDDEN, "El examen aún no está disponible.");
        }
        if (exam.getScheduledUntil() != null && LocalDateTime.now().isAfter(exam.getScheduledUntil())) {
            throw new AppException(HttpStatus.FORBIDDEN, "El examen ya cerró.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        ExamAttempt attempt = ExamAttempt.builder().exam(exam).user(user).build();
        attempt = attemptRepository.save(attempt);
        return Map.of("attemptId", attempt.getId(), "exam", toResponse(exam));
    }

    @Override
    @Transactional
    public Map<String, Object> submitAttempt(UUID attemptId, List<AnswerRequest> answers, UUID userId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Intento no encontrado"));
        attempt.setSubmittedAt(LocalDateTime.now());

        int totalPoints = 0;
        int earnedPoints = 0;

        for (ExamQuestion question : attempt.getExam().getQuestions()) {
            totalPoints += question.getPoints() != null ? question.getPoints() : 10;
            AnswerRequest ar = answers.stream()
                    .filter(a -> a.getQuestionId().equals(question.getId()))
                    .findFirst().orElse(null);

            boolean isCorrect = false;
            String studentAnswer = "";
            if (ar != null) {
                studentAnswer = ar.getContentLatex() != null ? ar.getContentLatex() : "";
                if (question.getExercise() != null) {
                    isCorrect = !studentAnswer.isBlank();
                }
                if (isCorrect) earnedPoints += question.getPoints() != null ? question.getPoints() : 10;

                StudentAnswer ans = StudentAnswer.builder()
                        .attempt(attempt)
                        .question(question)
                        .contentLatex(studentAnswer)
                        .hintsUsed(ar.getHintsUsed() != null ? ar.getHintsUsed() : 0)
                        .difficultyRating(ar.getDifficultyRating())
                        .timeSpent(ar.getTimeSpent() != null ? ar.getTimeSpent() : 0)
                        .build();
                answerRepository.save(ans);
            }
        }

        double score = totalPoints > 0 ? (double) earnedPoints / totalPoints * 100.0 : 0.0;
        attempt.setScore(score);
        attemptRepository.save(attempt);

        boolean passed = score >= attempt.getExam().getPassingScore();
        return Map.of(
                "attemptId", attemptId,
                "score", score,
                "passed", passed,
                "totalPoints", totalPoints,
                "earnedPoints", earnedPoints,
                "submittedAt", attempt.getSubmittedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getResults(UUID attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Intento no encontrado"));
        double score = attempt.getScore() != null ? attempt.getScore() : 0.0;
        boolean passed = score >= attempt.getExam().getPassingScore();

        List<Map<String, Object>> answers = attempt.getAnswers().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("questionId", a.getQuestion().getId());
            m.put("exerciseTitle", a.getQuestion().getExercise() != null
                    ? a.getQuestion().getExercise().getTitle() : "");
            m.put("contentLatex", a.getContentLatex());
            m.put("hintsUsed", a.getHintsUsed());
            m.put("timeSpent", a.getTimeSpent());
            return m;
        }).toList();

        return Map.of(
                "attemptId", attempt.getId(),
                "examTitle", attempt.getExam().getTitle(),
                "score", score,
                "passed", passed,
                "passingScore", attempt.getExam().getPassingScore(),
                "startedAt", attempt.getStartedAt(),
                "submittedAt", attempt.getSubmittedAt() != null ? attempt.getSubmittedAt() : "",
                "answers", answers
        );
    }

    private Exam find(UUID id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Examen no encontrado"));
    }

    private ExamResponse toResponse(Exam e) {
        return ExamResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .topicId(e.getTopic().getId())
                .topicName(e.getTopic().getName())
                .durationMinutes(e.getDurationMinutes())
                .isAdaptive(e.getIsAdaptive())
                .lockScreen(e.getLockScreen())
                .shuffleQuestions(e.getShuffleQuestions())
                .passingScore(e.getPassingScore())
                .examType(e.getExamType())
                .scheduledAt(e.getScheduledAt() != null ? e.getScheduledAt().toString() : null)
                .scheduledUntil(e.getScheduledUntil() != null ? e.getScheduledUntil().toString() : null)
                .questionCount(e.getQuestions() != null ? e.getQuestions().size() : 0)
                .createdAt(e.getCreatedAt())
                .build();
    }
}
