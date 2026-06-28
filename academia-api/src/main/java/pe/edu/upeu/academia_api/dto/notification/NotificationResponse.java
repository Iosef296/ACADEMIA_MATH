package pe.edu.upeu.academia_api.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String notificationType;
    private String content;
    private Boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
