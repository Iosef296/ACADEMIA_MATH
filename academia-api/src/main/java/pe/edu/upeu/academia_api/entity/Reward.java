package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "rewards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "cost_xp")
    @Builder.Default
    private Integer costXp = 50;

    @Column(name = "reward_type")
    @Builder.Default
    private String rewardType = "AVATAR_ITEM";
}
