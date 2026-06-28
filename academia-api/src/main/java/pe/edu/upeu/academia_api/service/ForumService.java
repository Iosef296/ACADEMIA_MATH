package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;

import java.util.List;
import java.util.UUID;

public interface ForumService {
    List<ForumPostResponse> findAll(String topicId, String exerciseId);
    ForumPostResponse findById(UUID id);
    ForumPostResponse create(ForumPostRequest request, UUID userId);
    void delete(UUID id);
}
