package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.entity.ForumLike;
import pe.edu.upeu.academia_api.entity.ForumPost;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.ForumService;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {

    private final ForumPostRepository forumPostRepository;
    private final ForumLikeRepository forumLikeRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ExerciseRepository exerciseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ForumPostResponse> findAll(String topicId, String exerciseId, UUID currentUserId) {
        List<ForumPost> posts;
        if (topicId != null) {
            posts = forumPostRepository.findByTopicIdAndParentIsNullOrderByCreatedAtDesc(UUID.fromString(topicId));
        } else if (exerciseId != null) {
            posts = forumPostRepository.findByExerciseIdAndParentIsNullOrderByCreatedAtDesc(UUID.fromString(exerciseId));
        } else {
            posts = forumPostRepository.findByParentIsNullOrderByCreatedAtDesc();
        }
        Set<UUID> liked = likedIds(currentUserId, collectIds(posts));
        return posts.stream().map(p -> toResponse(p, liked)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ForumPostResponse findById(UUID id, UUID currentUserId) {
        ForumPost post = find(id);
        Set<UUID> liked = likedIds(currentUserId, collectIds(List.of(post)));
        return toResponse(post, liked);
    }

    @Override
    @Transactional
    public ForumPostResponse create(ForumPostRequest request, UUID userId) {
        ForumPost post = ForumPost.builder()
                .title(request.getTitle())
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
        return toResponse(forumPostRepository.save(post), Set.of());
    }

    @Override
    @Transactional
    public ForumPostResponse update(UUID id, ForumPostRequest request, UUID userId) {
        ForumPost post = find(id);
        if (post.getUser() == null || !post.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Solo el autor puede editar este post");
        }
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        ForumPost saved = forumPostRepository.save(post);
        Set<UUID> liked = likedIds(userId, collectIds(List.of(saved)));
        return toResponse(saved, liked);
    }

    @Override
    @Transactional
    public void delete(UUID id, UUID userId) {
        ForumPost post = find(id);
        if (post.getUser() == null || !post.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Solo el autor puede eliminar este post");
        }
        forumPostRepository.delete(post);
    }

    @Override
    @Transactional
    public ForumPostResponse toggleLike(UUID postId, UUID userId) {
        ForumPost post = find(postId);
        if (forumLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            forumLikeRepository.deleteByPostIdAndUserId(postId, userId);
        } else {
            forumLikeRepository.save(ForumLike.builder().postId(postId).userId(userId).build());
        }
        Set<UUID> liked = likedIds(userId, collectIds(List.of(post)));
        return toResponse(post, liked);
    }

    private ForumPost find(UUID id) {
        return forumPostRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Post no encontrado"));
    }

    private Set<UUID> collectIds(List<ForumPost> posts) {
        Set<UUID> ids = new HashSet<>();
        for (ForumPost p : posts) collectIdsRec(p, ids);
        return ids;
    }

    private void collectIdsRec(ForumPost p, Set<UUID> ids) {
        if (p == null || p.getId() == null) return;
        ids.add(p.getId());
        if (p.getReplies() != null) {
            for (ForumPost r : p.getReplies()) collectIdsRec(r, ids);
        }
    }

    private Set<UUID> likedIds(UUID userId, Set<UUID> postIds) {
        if (userId == null || postIds.isEmpty()) return Set.of();
        return new HashSet<>(forumLikeRepository.findLikedPostIds(userId, postIds));
    }

    private ForumPostResponse toResponse(ForumPost p, Set<UUID> liked) {
        return ForumPostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .content(p.getContent())
                .author(ForumPostResponse.AuthorRef.builder()
                        .id(p.getUser() != null ? p.getUser().getId() : null)
                        .name(p.getUser() != null ? p.getUser().getName() : "Anónimo")
                        .build())
                .topicId(p.getTopic() != null ? p.getTopic().getId() : null)
                .exerciseId(p.getExercise() != null ? p.getExercise().getId() : null)
                .parentId(p.getParent() != null ? p.getParent().getId() : null)
                .replies(p.getReplies() != null
                        ? p.getReplies().stream().map(r -> toResponse(r, liked)).toList()
                        : List.of())
                .likeCount(p.getId() != null ? forumLikeRepository.countByPostId(p.getId()) : 0L)
                .likedByMe(p.getId() != null && liked.contains(p.getId()))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
