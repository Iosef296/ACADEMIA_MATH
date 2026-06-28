package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.Graph;
import pe.edu.upeu.academia_api.service.GraphService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/graphs")
@RequiredArgsConstructor
public class GraphController {

    private final GraphService graphService;

    @GetMapping
    public ResponseEntity<List<Graph>> findAll(
            @RequestParam(required = false) String topicId,
            @RequestParam(required = false) String exerciseId) {
        return ResponseEntity.ok(graphService.findAll(topicId, exerciseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Graph> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(graphService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Graph> create(@RequestBody Map<String, Object> request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(graphService.create(request, UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Graph> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(graphService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        graphService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
