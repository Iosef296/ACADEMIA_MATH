package pe.edu.upeu.academia_api.dto.routine;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MicroLessonRequest {
    @NotBlank
    private String title;
    private String contentLatex;
    private Integer lessonOrder;
}
