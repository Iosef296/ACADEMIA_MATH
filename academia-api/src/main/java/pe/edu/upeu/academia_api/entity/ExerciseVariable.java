package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "exercise_variables")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "var_name", nullable = false)
    private String varName;

    @Column(name = "min_val")
    private Double minVal;

    @Column(name = "max_val")
    private Double maxVal;

    @Column(name = "step_val")
    private Double stepVal;

    @Column(name = "constraint_type")
    private String constraintType;

    @Column(name = "constraint_value")
    private String constraintValue;

    @Column(name = "integer_only")
    @Builder.Default
    private Boolean integerOnly = false;
}
