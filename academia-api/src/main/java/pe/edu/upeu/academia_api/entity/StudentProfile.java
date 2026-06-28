package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "xp_total")
    @Builder.Default
    private Integer xpTotal = 0;

    @Column(name = "streak_current")
    @Builder.Default
    private Integer streakCurrent = 0;

    @Column(name = "streak_max")
    @Builder.Default
    private Integer streakMax = 0;

    @Column(name = "streak_last_active")
    private LocalDate streakLastActive;

    @Column(name = "ranking_visible")
    @Builder.Default
    private Boolean rankingVisible = true;

    @Column(name = "avatar_config", columnDefinition = "text")
    private String avatarConfig;
}
