package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "exercise_steps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "step_order")
    private Integer stepOrder;

    @Column(name = "content_latex", columnDefinition = "text", nullable = false)
    private String contentLatex;

    @Column(columnDefinition = "text")
    private String hint;

    @Column(columnDefinition = "text")
    private String warning;
}
