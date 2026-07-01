package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.forum.ForumPageResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumStatsResponse;

import java.util.List;
import java.util.UUID;

public interface ForumService {
    List<ForumPostResponse> findAll(String topicId, String exerciseId, UUID currentUserId);
    ForumPageResponse findPage(String topicId, String exerciseId, String tag, String sort,
                               int page, int size, UUID currentUserId);
    ForumPostResponse findById(UUID id, UUID currentUserId);
    ForumPostResponse create(ForumPostRequest request, UUID userId);
    ForumPostResponse update(UUID id, ForumPostRequest request, UUID userId);
    void delete(UUID id, UUID userId);
    ForumPostResponse toggleLike(UUID postId, UUID userId);
    ForumPostResponse toggleReaction(UUID postId, UUID userId, String emoji);
    ForumPostResponse acceptReply(UUID postId, UUID replyId, UUID userId);
    ForumPostResponse unacceptReply(UUID postId, UUID userId);
    List<String> listTags();
    ForumStatsResponse stats();
}
