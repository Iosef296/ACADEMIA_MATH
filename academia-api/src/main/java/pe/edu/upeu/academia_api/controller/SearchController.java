package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.repository.ExerciseRepository;
import pe.edu.upeu.academia_api.repository.TopicRepository;
import pe.edu.upeu.academia_api.repository.QuestionBankRepository;

import java.util.*;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final TopicRepository topicRepository;
    private final ExerciseRepository exerciseRepository;
    private final QuestionBankRepository questionBankRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(Map.of("topics", List.of(), "exercises", List.of(), "questions", List.of()));
        }
        String query = q.trim();

        List<Map<String, Object>> topics = topicRepository.search(query).stream()
                .limit(10)
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("name", t.getName());
                    m.put("description", t.getDescription());
                    m.put("type", "topic");
                    return m;
                }).toList();

        List<Map<String, Object>> exercises = exerciseRepository.findAll().stream()
                .filter(e -> (e.getTitle() != null && e.getTitle().toLowerCase().contains(query.toLowerCase()))
                        || (e.getContentLatex() != null && e.getContentLatex().toLowerCase().contains(query.toLowerCase())))
                .limit(10)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", e.getId());
                    m.put("title", e.getTitle());
                    m.put("difficulty", e.getDifficulty().name().toLowerCase());
                    m.put("topic", e.getTopic() != null ? Map.of("id", e.getTopic().getId(), "name", e.getTopic().getName()) : Map.of());
                    m.put("type", "exercise");
                    return m;
                }).toList();

        List<Map<String, Object>> questions = questionBankRepository.search(query).stream()
                .limit(10)
                .map(q2 -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", q2.getId());
                    m.put("contentLatex", q2.getContentLatex());
                    m.put("difficulty", q2.getDifficulty().name().toLowerCase());
                    m.put("type", "question");
                    return m;
                }).toList();

        return ResponseEntity.ok(Map.of("topics", topics, "exercises", exercises, "questions", questions));
    }
}
