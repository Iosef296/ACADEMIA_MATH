package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "weekly_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "reward_xp")
    @Builder.Default
    private Integer rewardXp = 100;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
