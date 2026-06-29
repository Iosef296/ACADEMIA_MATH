package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.topic.TopicRequest;
import pe.edu.upeu.academia_api.dto.topic.TopicResponse;
import pe.edu.upeu.academia_api.service.TopicService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<List<TopicResponse>> findAll() {
        return ResponseEntity.ok(topicService.findAllRoots());
    }

    @GetMapping("/all")
    public ResponseEntity<List<TopicResponse>> findAllFlat() {
        return ResponseEntity.ok(topicService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(topicService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<TopicResponse> create(@Valid @RequestBody TopicRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(topicService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<TopicResponse> update(@PathVariable UUID id, @Valid @RequestBody TopicRequest request) {
        return ResponseEntity.ok(topicService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        topicService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/prerequisites")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<?> addPrerequisite(
            @PathVariable UUID id, @RequestBody Map<String, String> body) {
        String prereqIdStr = body.get("prerequisiteId");
        if (prereqIdStr == null || prereqIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "prerequisiteId requerido"));
        }
        UUID prereqId = UUID.fromString(prereqIdStr);
        return ResponseEntity.ok(topicService.addPrerequisite(id, prereqId));
    }

    @DeleteMapping("/{id}/prerequisites/{prereqId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<TopicResponse> removePrerequisite(
            @PathVariable UUID id, @PathVariable UUID prereqId) {
        return ResponseEntity.ok(topicService.removePrerequisite(id, prereqId));
    }
}
