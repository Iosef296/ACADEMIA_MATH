package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_attempts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "rating")
    private String rating;

    @Column(name = "is_correct")
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(name = "time_spent")
    @Builder.Default
    private Integer timeSpent = 0;

    @Column(name = "hints_used")
    @Builder.Default
    private Integer hintsUsed = 0;

    @Column(name = "variable_values", columnDefinition = "text")
    private String variableValues;

    @CreationTimestamp
    @Column(name = "attempted_at", updatable = false)
    private LocalDateTime attemptedAt;
}
