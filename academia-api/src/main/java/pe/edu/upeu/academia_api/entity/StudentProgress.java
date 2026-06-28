package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Builder.Default
    private Integer xp = 0;

    @Builder.Default
    private Integer level = 1;

    @Column(name = "exercises_solved")
    @Builder.Default
    private Integer exercisesSolved = 0;

    @Column(name = "error_count")
    @Builder.Default
    private Integer errorCount = 0;

    @Column(name = "time_spent")
    @Builder.Default
    private Integer timeSpent = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
