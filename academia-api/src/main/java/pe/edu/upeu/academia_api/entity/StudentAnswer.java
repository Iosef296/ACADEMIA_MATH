package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "student_answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private ExamQuestion question;

    @Column(name = "content_latex", columnDefinition = "text")
    private String contentLatex;

    @Column(name = "hints_used")
    @Builder.Default
    private Integer hintsUsed = 0;

    @Column(name = "difficulty_rating")
    private String difficultyRating;

    @Column(name = "time_spent")
    @Builder.Default
    private Integer timeSpent = 0;
}
