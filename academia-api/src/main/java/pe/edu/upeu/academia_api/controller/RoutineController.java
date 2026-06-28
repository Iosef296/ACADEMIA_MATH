package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.routine.MicroLessonRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineResponse;
import pe.edu.upeu.academia_api.service.RoutineService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;

    @GetMapping
    public ResponseEntity<List<RoutineResponse>> findAll(Authentication auth) {
        return ResponseEntity.ok(routineService.findAll(UUID.fromString(auth.getName())));
    }

    @PostMapping
    public ResponseEntity<RoutineResponse> create(@Valid @RequestBody RoutineRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(routineService.create(request, UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoutineResponse> update(@PathVariable UUID id, @Valid @RequestBody RoutineRequest request) {
        return ResponseEntity.ok(routineService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        routineService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/micro-lessons")
    public ResponseEntity<RoutineResponse> addMicroLesson(
            @PathVariable UUID id, @Valid @RequestBody MicroLessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routineService.addMicroLesson(id, request));
    }
}
