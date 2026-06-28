package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "micro_lessons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MicroLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routine_id", nullable = false)
    private Routine routine;

    @Column(nullable = false)
    private String title;

    @Column(name = "content_latex", columnDefinition = "text")
    private String contentLatex;

    @Column(name = "lesson_order")
    @Builder.Default
    private Integer lessonOrder = 0;
}
