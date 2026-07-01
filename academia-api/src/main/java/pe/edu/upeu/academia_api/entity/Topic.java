package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "topics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Topic parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Topic> children = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "topic_prerequisites",
            joinColumns = @JoinColumn(name = "topic_id"),
            inverseJoinColumns = @JoinColumn(name = "prerequisite_id"))
    @Builder.Default
    private List<Topic> prerequisites = new ArrayList<>();

    @Column(name = "topic_order")
    @Builder.Default
    private Integer topicOrder = 0;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "unlock_condition", columnDefinition = "text")
    private String unlockCondition;

    @Column(name = "estimated_minutes")
    @Builder.Default
    private Integer estimatedMinutes = 0;

    @Column(name = "difficulty", length = 20)
    @Builder.Default
    private String difficulty = "basico";
}
