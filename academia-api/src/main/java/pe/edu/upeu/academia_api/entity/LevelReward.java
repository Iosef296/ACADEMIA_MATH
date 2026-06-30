package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "level_rewards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LevelReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int level;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private String emoji;

    @Column(name = "bonus_xp", nullable = false)
    private int bonusXp;

    @Column(nullable = false)
    private boolean active = true;
}
