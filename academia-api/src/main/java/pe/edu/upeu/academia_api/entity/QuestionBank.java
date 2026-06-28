package pe.edu.upeu.academia_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "question_bank")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","children","prerequisites","parent"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "content_latex", columnDefinition = "text", nullable = false)
    private String contentLatex;

    @Column(name = "question_type", nullable = false)
    @Builder.Default
    private String questionType = "multiple_choice";

    @Column(name = "option_a", columnDefinition = "text")
    private String optionA;

    @Column(name = "option_b", columnDefinition = "text")
    private String optionB;

    @Column(name = "option_c", columnDefinition = "text")
    private String optionC;

    @Column(name = "option_d", columnDefinition = "text")
    private String optionD;

    @Column(name = "correct_answer")
    private String correctAnswer;

    @Column(name = "explanation", columnDefinition = "text")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExerciseDifficulty difficulty = ExerciseDifficulty.BASIC;

    @Column(name = "tags")
    private String tags;

    @Column(name = "times_used")
    @Builder.Default
    private Integer timesUsed = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
