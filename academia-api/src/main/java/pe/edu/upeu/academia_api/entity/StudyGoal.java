package pe.edu.upeu.academia_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "study_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private java.util.UUID userId;

    @Column(nullable = false)
    private String description;

    @Column(name = "hours_per_week")
    @Builder.Default
    private Integer hoursPerWeek = 5;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "target_score")
    private Double targetScore;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
