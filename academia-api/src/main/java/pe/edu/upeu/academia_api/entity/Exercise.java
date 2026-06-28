package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exercises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    private String title;

    @Column(name = "content_latex", columnDefinition = "text", nullable = false)
    private String contentLatex;

    @Column(name = "is_parametric")
    @Builder.Default
    private Boolean isParametric = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExerciseDifficulty difficulty = ExerciseDifficulty.BASIC;

    @Column(name = "needs_graph")
    @Builder.Default
    private Boolean needsGraph = false;

    @Column(name = "graph_type")
    private String graphType;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    @Builder.Default
    private List<ExerciseStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExerciseVariable> variables = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
