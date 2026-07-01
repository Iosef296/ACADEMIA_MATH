package pe.edu.upeu.academia_api.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForumStepDto {
    private int order;
    private String title;
    private String content;
}
