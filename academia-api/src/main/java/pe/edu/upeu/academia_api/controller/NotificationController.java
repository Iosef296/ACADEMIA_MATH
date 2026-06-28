package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.notification.NotificationResponse;
import pe.edu.upeu.academia_api.service.NotificationService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> findAll(Authentication auth) {
        return ResponseEntity.ok(notificationService.findAll(UUID.fromString(auth.getName())));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> findUnread(Authentication auth) {
        return ResponseEntity.ok(notificationService.findUnread(UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        notificationService.markRead(id);
        return ResponseEntity.noContent().build();
    }
}
