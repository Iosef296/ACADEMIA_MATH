package pe.edu.upeu.academia_api.dto.exam;

import lombok.Data;

import java.util.UUID;

@Data
public class AnswerRequest {
    private UUID questionId;
    private String contentLatex;
    private Integer hintsUsed;
    private String difficultyRating;
    private Integer timeSpent;
}
