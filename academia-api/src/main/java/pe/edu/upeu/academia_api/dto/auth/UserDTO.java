package pe.edu.upeu.academia_api.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDTO {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private Boolean emailVerified;
    private String avatarUrl;
    private LocalDateTime lastAccessAt;
    private LocalDateTime createdAt;
    private Integer manualXp;
}
