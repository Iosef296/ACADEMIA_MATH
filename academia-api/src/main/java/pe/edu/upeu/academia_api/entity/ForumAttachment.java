package pe.edu.upeu.academia_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "forum_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private ForumPost post;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "attachment_type")
    @Builder.Default
    private String attachmentType = "IMAGE";
}
