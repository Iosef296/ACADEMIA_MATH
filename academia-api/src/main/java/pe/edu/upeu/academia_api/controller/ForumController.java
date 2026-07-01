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
            @RequestParam(required = false) String exerciseId,
            Authentication auth) {
        return ResponseEntity.ok(forumService.findAll(topicId, exerciseId, currentUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ForumPostResponse> findById(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(forumService.findById(id, currentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<ForumPostResponse> create(
            @Valid @RequestBody ForumPostRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(forumService.create(request, UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ForumPostResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody ForumPostRequest request,
            Authentication auth) {
        return ResponseEntity.ok(
                forumService.update(id, request, UUID.fromString(auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        forumService.delete(id, UUID.fromString(auth.getName()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ForumPostResponse> toggleLike(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(
                forumService.toggleLike(id, UUID.fromString(auth.getName())));
    }

    private UUID currentUserId(Authentication auth) {
        try {
            return auth != null ? UUID.fromString(auth.getName()) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
