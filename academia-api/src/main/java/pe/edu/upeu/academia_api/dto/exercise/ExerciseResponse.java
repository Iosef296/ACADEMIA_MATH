package pe.edu.upeu.academia_api.dto.exercise;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExerciseResponse {
    private UUID id;
    private String title;
    private String contentLatex;
    private String difficulty;
    private Boolean isParametric;
    private Boolean needsGraph;
    private String graphType;
    private TopicRef topic;
    private List<StepRef> steps;
    private List<VariableRef> variables;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopicRef {
        private UUID id;
        private String name;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StepRef {
        private UUID id;
        private Integer stepOrder;
        private String contentLatex;
        private String hint;
        private String warning;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VariableRef {
        private UUID id;
        private String varName;
        private Double minVal;
        private Double maxVal;
        private Double stepVal;
    }
}
