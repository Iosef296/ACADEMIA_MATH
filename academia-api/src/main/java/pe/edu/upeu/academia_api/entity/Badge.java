package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "badges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(columnDefinition = "text")
    private String condition;
}
