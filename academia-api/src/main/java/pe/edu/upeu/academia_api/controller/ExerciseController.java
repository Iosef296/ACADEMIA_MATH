package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.exercise.*;
import pe.edu.upeu.academia_api.service.ExerciseService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    public ResponseEntity<List<ExerciseResponse>> findAll(
            @RequestParam(required = false) String topicId,
            @RequestParam(required = false) String difficulty) {
        return ResponseEntity.ok(exerciseService.findAll(topicId, difficulty));
    }

    @PostMapping("/rate")
    public ResponseEntity<Map<String, Object>> rate(@Valid @RequestBody RateRequest request, Authentication auth) {
        return ResponseEntity.ok(exerciseService.rate(request, UUID.fromString(auth.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(exerciseService.findById(id));
    }

    @GetMapping("/{id}/generate")
    public ResponseEntity<Map<String, Object>> generate(@PathVariable UUID id, Authentication auth) {
        if (auth != null) {
            return ResponseEntity.ok(exerciseService.generateForStudent(id, UUID.fromString(auth.getName())));
        }
        return ResponseEntity.ok(exerciseService.generate(id));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> history(Authentication auth) {
        return ResponseEntity.ok(exerciseService.getHistory(UUID.fromString(auth.getName())));
    }

    @GetMapping("/flashcards")
    public ResponseEntity<List<Map<String, Object>>> flashcards(Authentication auth) {
        return ResponseEntity.ok(exerciseService.getFlashcards(UUID.fromString(auth.getName())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExerciseResponse> create(@Valid @RequestBody ExerciseRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exerciseService.create(request, UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExerciseResponse> update(@PathVariable UUID id, @Valid @RequestBody ExerciseRequest request) {
        return ResponseEntity.ok(exerciseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        exerciseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/steps")
    public ResponseEntity<List<ExerciseResponse.StepRef>> getSteps(@PathVariable UUID id) {
        return ResponseEntity.ok(exerciseService.getSteps(id));
    }

    @PostMapping("/{id}/steps")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExerciseResponse.StepRef> addStep(
            @PathVariable UUID id, @Valid @RequestBody ExerciseStepRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exerciseService.addStep(id, request));
    }

    @PutMapping("/{id}/steps/reorder")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> reorderSteps(@PathVariable UUID id, @RequestBody List<UUID> stepIds) {
        exerciseService.reorderSteps(id, stepIds);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExerciseResponse.StepRef> updateStep(
            @PathVariable UUID id, @PathVariable UUID stepId,
            @Valid @RequestBody ExerciseStepRequest request) {
        return ResponseEntity.ok(exerciseService.updateStep(id, stepId, request));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> deleteStep(@PathVariable UUID id, @PathVariable UUID stepId) {
        exerciseService.deleteStep(id, stepId);
        return ResponseEntity.noContent().build();
    }
}
