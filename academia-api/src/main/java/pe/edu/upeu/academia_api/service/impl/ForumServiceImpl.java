package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.entity.ForumPost;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.ForumService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {

    private final ForumPostRepository forumPostRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ExerciseRepository exerciseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ForumPostResponse> findAll(String topicId, String exerciseId) {
        List<ForumPost> posts;
        if (topicId != null) {
            posts = forumPostRepository.findByTopicIdAndParentIsNullOrderByCreatedAtDesc(UUID.fromString(topicId));
        } else if (exerciseId != null) {
            posts = forumPostRepository.findByExerciseIdAndParentIsNullOrderByCreatedAtDesc(UUID.fromString(exerciseId));
        } else {
            posts = forumPostRepository.findByParentIsNullOrderByCreatedAtDesc();
        }
        return posts.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ForumPostResponse findById(UUID id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public ForumPostResponse create(ForumPostRequest request, UUID userId) {
        ForumPost post = ForumPost.builder()
                .content(request.getContent())
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .build();
        if (request.getTopicId() != null) {
            topicRepository.findById(request.getTopicId()).ifPresent(post::setTopic);
        }
        if (request.getExerciseId() != null) {
            exerciseRepository.findById(request.getExerciseId()).ifPresent(post::setExercise);
        }
        if (request.getParentId() != null) {
            forumPostRepository.findById(request.getParentId()).ifPresent(post::setParent);
        }
        return toResponse(forumPostRepository.save(post));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        forumPostRepository.deleteById(id);
    }

    private ForumPost find(UUID id) {
        return forumPostRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Post no encontrado"));
    }

    private ForumPostResponse toResponse(ForumPost p) {
        return ForumPostResponse.builder()
                .id(p.getId())
                .content(p.getContent())
                .author(ForumPostResponse.AuthorRef.builder()
                        .id(p.getUser().getId())
                        .name(p.getUser().getName())
                        .build())
                .topicId(p.getTopic() != null ? p.getTopic().getId() : null)
                .exerciseId(p.getExercise() != null ? p.getExercise().getId() : null)
                .parentId(p.getParent() != null ? p.getParent().getId() : null)
                .replies(p.getReplies() != null
                        ? p.getReplies().stream().map(this::toResponse).toList()
                        : List.of())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
