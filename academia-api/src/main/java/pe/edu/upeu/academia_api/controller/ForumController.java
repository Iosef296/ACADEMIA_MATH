package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.service.ForumService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping
    public ResponseEntity<List<ForumPostResponse>> findAll(
            @RequestParam(required = false) String topicId,
            @RequestParam(required = false) String exerciseId) {
        return ResponseEntity.ok(forumService.findAll(topicId, exerciseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ForumPostResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(forumService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ForumPostResponse> create(
            @Valid @RequestBody ForumPostRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.create(request, UUID.fromString(auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        forumService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
