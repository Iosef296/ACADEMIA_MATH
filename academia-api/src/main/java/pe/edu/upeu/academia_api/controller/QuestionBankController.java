package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.ExerciseDifficulty;
import pe.edu.upeu.academia_api.entity.QuestionBank;
import pe.edu.upeu.academia_api.entity.Topic;
import pe.edu.upeu.academia_api.entity.User;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.QuestionBankRepository;
import pe.edu.upeu.academia_api.repository.TopicRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;

import java.util.*;

@RestController
@RequestMapping("/question-bank")
@RequiredArgsConstructor
public class QuestionBankController {

    private final QuestionBankRepository repository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<QuestionBank>> findAll(
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String q) {
        List<QuestionBank> result;
        if (q != null && !q.isBlank()) {
            result = repository.search(q.trim());
        } else if (topicId != null && difficulty != null) {
            result = repository.findByTopicIdAndDifficulty(topicId, ExerciseDifficulty.valueOf(difficulty.toUpperCase()));
        } else if (topicId != null) {
            result = repository.findByTopicId(topicId);
        } else if (difficulty != null) {
            result = repository.findByDifficulty(ExerciseDifficulty.valueOf(difficulty.toUpperCase()));
        } else {
            result = repository.findAll();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionBank> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(repository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Pregunta no encontrada")));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<QuestionBank> create(@RequestBody Map<String, Object> body, Authentication auth) {
        QuestionBank.QuestionBankBuilder builder = QuestionBank.builder();
        builder.contentLatex((String) body.getOrDefault("contentLatex", ""));
        builder.questionType((String) body.getOrDefault("questionType", "multiple_choice"));
        builder.optionA((String) body.get("optionA"));
        builder.optionB((String) body.get("optionB"));
        builder.optionC((String) body.get("optionC"));
        builder.optionD((String) body.get("optionD"));
        builder.correctAnswer((String) body.get("correctAnswer"));
        builder.explanation((String) body.get("explanation"));
        builder.tags((String) body.get("tags"));

        if (body.get("difficulty") != null) {
            try { builder.difficulty(ExerciseDifficulty.valueOf(body.get("difficulty").toString().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        if (body.get("topicId") != null) {
            topicRepository.findById(UUID.fromString(body.get("topicId").toString()))
                    .ifPresent(builder::topic);
        }
        userRepository.findById(UUID.fromString(auth.getName())).ifPresent(builder::createdBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(builder.build()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<QuestionBank> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        QuestionBank q = repository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Pregunta no encontrada"));
        if (body.get("contentLatex") != null) q.setContentLatex((String) body.get("contentLatex"));
        if (body.get("questionType") != null) q.setQuestionType((String) body.get("questionType"));
        if (body.get("optionA") != null) q.setOptionA((String) body.get("optionA"));
        if (body.get("optionB") != null) q.setOptionB((String) body.get("optionB"));
        if (body.get("optionC") != null) q.setOptionC((String) body.get("optionC"));
        if (body.get("optionD") != null) q.setOptionD((String) body.get("optionD"));
        if (body.get("correctAnswer") != null) q.setCorrectAnswer((String) body.get("correctAnswer"));
        if (body.get("explanation") != null) q.setExplanation((String) body.get("explanation"));
        if (body.get("tags") != null) q.setTags((String) body.get("tags"));
        if (body.get("difficulty") != null) {
            try { q.setDifficulty(ExerciseDifficulty.valueOf(body.get("difficulty").toString().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(repository.save(q));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
