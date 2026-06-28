package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.notification.NotificationResponse;
import pe.edu.upeu.academia_api.entity.Notification;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.NotificationRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findUnread(UUID userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findAll(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void markRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public NotificationResponse create(UUID userId, String type, String content) {
        Notification n = Notification.builder()
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .notificationType(type)
                .content(content)
                .build();
        return toResponse(notificationRepository.save(n));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .notificationType(n.getNotificationType())
                .content(n.getContent())
                .read(n.getRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
