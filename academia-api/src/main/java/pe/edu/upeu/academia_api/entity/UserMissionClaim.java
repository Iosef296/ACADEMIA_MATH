package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_mission_claims",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "mission_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserMissionClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Column(name = "claimed_at", nullable = false)
    private LocalDateTime claimedAt;
}
