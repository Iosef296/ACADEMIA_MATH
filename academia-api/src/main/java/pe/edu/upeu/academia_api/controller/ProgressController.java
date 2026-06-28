package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.progress.ProgressResponse;
import pe.edu.upeu.academia_api.dto.progress.StreakResponse;
import pe.edu.upeu.academia_api.service.ProgressService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping
    public ResponseEntity<List<ProgressResponse>> findAll(Authentication auth) {
        return ResponseEntity.ok(progressService.findAll(UUID.fromString(auth.getName())));
    }

    @GetMapping("/errors")
    public ResponseEntity<List<ProgressResponse>> getErrors(Authentication auth) {
        return ResponseEntity.ok(progressService.getErrors(UUID.fromString(auth.getName())));
    }

    @GetMapping("/streak")
    public ResponseEntity<StreakResponse> getStreak(Authentication auth) {
        return ResponseEntity.ok(progressService.getStreak(UUID.fromString(auth.getName())));
    }

    @GetMapping("/topics/{topicId}")
    public ResponseEntity<ProgressResponse> getByTopic(@PathVariable UUID topicId, Authentication auth) {
        return ResponseEntity.ok(progressService.getByTopic(UUID.fromString(auth.getName()), topicId));
    }
}
