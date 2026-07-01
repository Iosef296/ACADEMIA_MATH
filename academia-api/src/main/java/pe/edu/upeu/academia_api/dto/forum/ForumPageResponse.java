package pe.edu.upeu.academia_api.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForumPageResponse {
    private List<ForumPostResponse> items;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
}
