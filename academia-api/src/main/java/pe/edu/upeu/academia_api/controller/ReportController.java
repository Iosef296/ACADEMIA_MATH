package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.UserRole;
import pe.edu.upeu.academia_api.repository.*;

import java.util.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final UserRepository userRepository;
    private final ExerciseAttemptRepository exerciseAttemptRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final StudentProgressRepository studentProgressRepository;
    private final ExerciseRepository exerciseRepository;
    private final TopicRepository topicRepository;

    @GetMapping("/my-stats")
    public ResponseEntity<Map<String, Object>> myStats(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        long totalAttempts = exerciseAttemptRepository.countByUserId(userId);
        long correctAttempts = exerciseAttemptRepository.countCorrectByUserId(userId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalExercisesAttempted", totalAttempts);
        stats.put("correctExercises", correctAttempts);
        stats.put("accuracyRate", totalAttempts > 0 ? (double) correctAttempts / totalAttempts * 100 : 0);

        List<Map<String, Object>> progressByTopic = studentProgressRepository.findByUserId(userId)
                .stream().map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topicId", p.getTopic() != null ? p.getTopic().getId() : null);
                    m.put("topicName", p.getTopic() != null ? p.getTopic().getName() : null);
                    m.put("xp", p.getXp());
                    m.put("level", p.getLevel());
                    m.put("exercisesSolved", p.getExercisesSolved());
                    m.put("errorCount", p.getErrorCount());
                    m.put("timeSpentMinutes", p.getTimeSpent() / 60);
                    double errorRate = p.getExercisesSolved() > 0
                            ? (double) p.getErrorCount() / p.getExercisesSolved() * 100 : 0;
                    m.put("errorRate", Math.round(errorRate * 10.0) / 10.0);
                    return m;
                }).toList();
        stats.put("progressByTopic", progressByTopic);

        List<Map<String, Object>> examHistory = examAttemptRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream().limit(10).map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("examId", a.getExam() != null ? a.getExam().getId() : null);
                    m.put("examTitle", a.getExam() != null ? a.getExam().getTitle() : null);
                    m.put("score", a.getScore());
                    m.put("startedAt", a.getStartedAt());
                    m.put("submittedAt", a.getSubmittedAt());
                    return m;
                }).toList();
        stats.put("recentExams", examHistory);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/weakest-topics")
    public ResponseEntity<List<Map<String, Object>>> weakestTopics(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<Map<String, Object>> weak = studentProgressRepository.findByUserId(userId)
                .stream()
                .filter(p -> p.getExercisesSolved() > 0)
                .sorted((a, b) -> {
                    double rateA = (double) a.getErrorCount() / a.getExercisesSolved();
                    double rateB = (double) b.getErrorCount() / b.getExercisesSolved();
                    return Double.compare(rateB, rateA);
                })
                .limit(5)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topicId", p.getTopic() != null ? p.getTopic().getId() : null);
                    m.put("topicName", p.getTopic() != null ? p.getTopic().getName() : null);
                    m.put("errorCount", p.getErrorCount());
                    m.put("exercisesSolved", p.getExercisesSolved());
                    m.put("errorRate", Math.round((double) p.getErrorCount() / p.getExercisesSolved() * 1000.0) / 10.0);
                    return m;
                }).toList();
        return ResponseEntity.ok(weak);
    }

    @GetMapping("/platform")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> platformStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", userRepository.countStudents());
        stats.put("totalTeachers", userRepository.countTeachers());
        stats.put("totalExercises", exerciseRepository.count());
        stats.put("totalTopics", topicRepository.count());
        stats.put("totalExamAttempts", examAttemptRepository.count());
        stats.put("completedExamAttempts", examAttemptRepository.countCompleted());

        List<Map<String, Object>> topExerciseErrors = studentProgressRepository.findAll()
                .stream()
                .filter(p -> p.getErrorCount() > 0)
                .sorted(Comparator.comparingInt(p -> -p.getErrorCount()))
                .limit(10)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topicName", p.getTopic() != null ? p.getTopic().getName() : null);
                    m.put("totalErrors", p.getErrorCount());
                    return m;
                }).toList();
        stats.put("topErrorTopics", topExerciseErrors);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Map<String, Object>> studentReport(@PathVariable UUID id) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("userId", id);

        long totalAttempts = exerciseAttemptRepository.countByUserId(id);
        long correctAttempts = exerciseAttemptRepository.countCorrectByUserId(id);
        report.put("totalExercisesAttempted", totalAttempts);
        report.put("correctExercises", correctAttempts);
        report.put("accuracyRate", totalAttempts > 0 ? Math.round((double) correctAttempts / totalAttempts * 1000.0) / 10.0 : 0);

        report.put("progressByTopic", studentProgressRepository.findByUserId(id)
                .stream().map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topicName", p.getTopic() != null ? p.getTopic().getName() : null);
                    m.put("xp", p.getXp());
                    m.put("level", p.getLevel());
                    m.put("exercisesSolved", p.getExercisesSolved());
                    m.put("errorCount", p.getErrorCount());
                    return m;
                }).toList());

        return ResponseEntity.ok(report);
    }
}
