package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.StudyGoal;
import pe.edu.upeu.academia_api.entity.User;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.StudyGoalRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/study-goals")
@RequiredArgsConstructor
public class StudyGoalController {

    private final StudyGoalRepository repository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<StudyGoal>> findAll(Authentication auth) {
        return ResponseEntity.ok(repository.findByUserId(UUID.fromString(auth.getName())));
    }

    @PostMapping
    public ResponseEntity<StudyGoal> create(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = userRepository.findById(UUID.fromString(auth.getName()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        StudyGoal.StudyGoalBuilder builder = StudyGoal.builder().user(user);
        builder.description((String) body.getOrDefault("description", "Meta de estudio"));
        if (body.get("hoursPerWeek") != null) builder.hoursPerWeek(((Number) body.get("hoursPerWeek")).intValue());
        if (body.get("targetDate") != null) builder.targetDate(LocalDate.parse(body.get("targetDate").toString()));
        if (body.get("targetScore") != null) builder.targetScore(((Number) body.get("targetScore")).doubleValue());

        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(builder.build()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudyGoal> update(@PathVariable UUID id, @RequestBody Map<String, Object> body, Authentication auth) {
        StudyGoal goal = repository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Meta no encontrada"));
        if (goal.getUser() == null || !goal.getUser().getId().equals(UUID.fromString(auth.getName()))) {
            throw new AppException(HttpStatus.FORBIDDEN, "Sin permisos");
        }
        if (body.get("description") != null) goal.setDescription((String) body.get("description"));
        if (body.get("hoursPerWeek") != null) goal.setHoursPerWeek(((Number) body.get("hoursPerWeek")).intValue());
        if (body.get("targetDate") != null) goal.setTargetDate(LocalDate.parse(body.get("targetDate").toString()));
        if (body.get("targetScore") != null) goal.setTargetScore(((Number) body.get("targetScore")).doubleValue());
        if (body.get("isActive") != null) goal.setIsActive((Boolean) body.get("isActive"));

        return ResponseEntity.ok(repository.save(goal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        StudyGoal goal = repository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Meta no encontrada"));
        if (goal.getUser() == null || !goal.getUser().getId().equals(UUID.fromString(auth.getName()))) {
            throw new AppException(HttpStatus.FORBIDDEN, "Sin permisos");
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
