package pe.edu.upeu.academia_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "rankings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_label"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "week_label", nullable = false)
    private String weekLabel;

    @Builder.Default
    private Integer score = 0;
}
