package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.forum.ForumPageResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumStatsResponse;
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

    @GetMapping("/page")
    public ResponseEntity<ForumPageResponse> findPage(
            @RequestParam(required = false) String topicId,
            @RequestParam(required = false) String exerciseId,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(
                forumService.findPage(topicId, exerciseId, tag, sort, page, size, currentUserId(auth)));
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> listTags() {
        return ResponseEntity.ok(forumService.listTags());
    }

    @GetMapping("/stats")
    public ResponseEntity<ForumStatsResponse> stats() {
        return ResponseEntity.ok(forumService.stats());
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

    @PostMapping("/{postId}/accept/{replyId}")
    public ResponseEntity<ForumPostResponse> accept(
            @PathVariable UUID postId, @PathVariable UUID replyId, Authentication auth) {
        return ResponseEntity.ok(
                forumService.acceptReply(postId, replyId, UUID.fromString(auth.getName())));
    }

    @DeleteMapping("/{postId}/accept")
    public ResponseEntity<ForumPostResponse> unaccept(
            @PathVariable UUID postId, Authentication auth) {
        return ResponseEntity.ok(
                forumService.unacceptReply(postId, UUID.fromString(auth.getName())));
    }

    private UUID currentUserId(Authentication auth) {
        try {
            return auth != null ? UUID.fromString(auth.getName()) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
