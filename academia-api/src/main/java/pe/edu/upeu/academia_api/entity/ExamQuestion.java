package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "exam_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "question_order")
    @Builder.Default
    private Integer questionOrder = 0;

    @Builder.Default
    private Integer points = 10;
}
