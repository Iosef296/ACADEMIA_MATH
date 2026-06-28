package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.notification.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<NotificationResponse> findUnread(UUID userId);
    List<NotificationResponse> findAll(UUID userId);
    void markRead(UUID notificationId);
    NotificationResponse create(UUID userId, String type, String content);
}
