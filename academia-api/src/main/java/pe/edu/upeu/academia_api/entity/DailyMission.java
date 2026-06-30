package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "daily_missions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String emoji;

    @Column(name = "mission_type", nullable = false)
    private String missionType;

    @Column(name = "target_value", nullable = false)
    private int targetValue;

    @Column(name = "reward_xp", nullable = false)
    private int rewardXp = 10;

    @Column(nullable = false)
    private boolean active = true;
}
