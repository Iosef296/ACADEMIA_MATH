package pe.edu.upeu.academia_api.dto.routine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoutineResponse {
    private UUID id;
    private String title;
    private String schedule;
    private List<MicroLessonRef> microLessons;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MicroLessonRef {
        private UUID id;
        private String title;
        private String contentLatex;
        private Integer lessonOrder;
    }
}
