package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.live.LiveSessionRequest;
import pe.edu.upeu.academia_api.dto.live.LiveSessionResponse;
import pe.edu.upeu.academia_api.service.LiveService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/live")
@RequiredArgsConstructor
public class LiveController {

    private final LiveService liveService;

    @GetMapping
    public ResponseEntity<List<LiveSessionResponse>> findAll() {
        return ResponseEntity.ok(liveService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LiveSessionResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(liveService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<LiveSessionResponse> create(
            @Valid @RequestBody LiveSessionRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(liveService.create(request, UUID.fromString(auth.getName())));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status requerido"));
        }
        return ResponseEntity.ok(liveService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        liveService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
