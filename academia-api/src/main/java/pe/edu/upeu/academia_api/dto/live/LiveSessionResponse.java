package pe.edu.upeu.academia_api.dto.live;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LiveSessionResponse {
    private UUID id;
    private String title;
    private String course;
    private String jitsiRoomId;
    private UUID teacherId;
    private String teacherName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private LocalDateTime createdAt;
}
