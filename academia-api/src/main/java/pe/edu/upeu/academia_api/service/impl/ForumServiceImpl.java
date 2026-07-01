package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.forum.ForumPageResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumPostRequest;
import pe.edu.upeu.academia_api.dto.forum.ForumPostResponse;
import pe.edu.upeu.academia_api.dto.forum.ForumStatsResponse;
import pe.edu.upeu.academia_api.entity.ForumLike;
import pe.edu.upeu.academia_api.entity.ForumPost;
import pe.edu.upeu.academia_api.entity.ForumTag;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.ForumService;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {

    private final ForumPostRepository forumPostRepository;
    private final ForumLikeRepository forumLikeRepository;
    private final ForumTagRepository forumTagRepository;
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
    public ForumPageResponse findPage(String topicId, String exerciseId, String tag, String sort,
                                      int page, int size, UUID currentUserId) {
        int pageIdx = Math.max(page, 0);
        int pageSize = Math.max(size, 1);
        String s = sort == null ? "recent" : sort.toLowerCase();

        UUID topicUUID = topicId != null ? UUID.fromString(topicId) : null;
        UUID exerciseUUID = exerciseId != null ? UUID.fromString(exerciseId) : null;

        Page<ForumPost> result;
        if (tag != null && !tag.isBlank()) {
            Pageable pageable = PageRequest.of(pageIdx, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            result = forumPostRepository.findByTagAndParentIsNull(tag.trim(), pageable);
        } else if ("liked".equals(s)) {
            Pageable pageable = PageRequest.of(pageIdx, pageSize);
            result = forumPostRepository.findOrderByLikes(topicUUID, exerciseUUID, pageable);
        } else if ("unanswered".equals(s) || "solved".equals(s)) {
            Pageable pageable = PageRequest.of(pageIdx, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            result = forumPostRepository.findFiltered(topicUUID, exerciseUUID,
                    "unanswered".equals(s), "solved".equals(s), pageable);
        } else {
            Pageable pageable = PageRequest.of(pageIdx, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            if (topicUUID != null) result = forumPostRepository.findByTopicIdAndParentIsNull(topicUUID, pageable);
            else if (exerciseUUID != null) result = forumPostRepository.findByExerciseIdAndParentIsNull(exerciseUUID, pageable);
            else result = forumPostRepository.findByParentIsNull(pageable);
        }

        List<ForumPost> posts = result.getContent();
        Set<UUID> liked = likedIds(currentUserId, collectIds(posts));
        List<ForumPostResponse> items = posts.stream().map(p -> toResponse(p, liked)).toList();
        return ForumPageResponse.builder()
                .items(items)
                .page(result.getNumber())
                .size(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
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
        post.setTags(resolveTags(request.getTags()));
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
        if (request.getTags() != null) {
            post.getTags().clear();
            post.getTags().addAll(resolveTags(request.getTags()));
        }
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

    @Override
    @Transactional
    public ForumPostResponse acceptReply(UUID postId, UUID replyId, UUID userId) {
        ForumPost post = find(postId);
        if (post.getUser() == null || !post.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Solo el autor del post puede marcar la mejor respuesta");
        }
        ForumPost reply = find(replyId);
        if (reply.getParent() == null || !reply.getParent().getId().equals(postId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "La respuesta no pertenece a este post");
        }
        post.setAcceptedReply(reply);
        ForumPost saved = forumPostRepository.save(post);
        Set<UUID> liked = likedIds(userId, collectIds(List.of(saved)));
        return toResponse(saved, liked);
    }

    @Override
    @Transactional
    public ForumPostResponse unacceptReply(UUID postId, UUID userId) {
        ForumPost post = find(postId);
        if (post.getUser() == null || !post.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Solo el autor del post puede desmarcar la mejor respuesta");
        }
        post.setAcceptedReply(null);
        ForumPost saved = forumPostRepository.save(post);
        Set<UUID> liked = likedIds(userId, collectIds(List.of(saved)));
        return toResponse(saved, liked);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listTags() {
        return forumTagRepository.findAllByOrderByNameAsc().stream()
                .map(ForumTag::getName).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ForumStatsResponse stats() {
        long total = forumPostRepository.findByParentIsNullOrderByCreatedAtDesc().size();
        long unanswered = forumPostRepository.countUnanswered();
        List<Object[]> raw = forumPostRepository.topTagsRaw(PageRequest.of(0, 10));
        List<ForumStatsResponse.TagCount> tags = raw.stream()
                .map(row -> ForumStatsResponse.TagCount.builder()
                        .name((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .toList();
        return ForumStatsResponse.builder()
                .totalPosts(total)
                .unanswered(unanswered)
                .topTags(tags)
                .build();
    }

    private Set<ForumTag> resolveTags(List<String> names) {
        Set<ForumTag> result = new HashSet<>();
        if (names == null) return result;
        Set<String> seen = new HashSet<>();
        for (String raw : names) {
            if (raw == null) continue;
            String name = raw.trim().toLowerCase();
            if (name.isEmpty() || name.length() > 50) continue;
            if (!seen.add(name)) continue;
            ForumTag tag = forumTagRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> forumTagRepository.save(ForumTag.builder().name(name).build()));
            result.add(tag);
        }
        return result;
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
        UUID acceptedId = p.getAcceptedReply() != null ? p.getAcceptedReply().getId() : null;
        boolean isAccepted = p.getParent() != null && p.getParent().getAcceptedReply() != null
                && p.getParent().getAcceptedReply().getId() != null
                && p.getParent().getAcceptedReply().getId().equals(p.getId());
        List<ForumPostResponse> replies = p.getReplies() != null
                ? p.getReplies().stream().map(r -> toResponse(r, liked)).toList()
                : List.of();
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
                .replies(replies)
                .replyCount(replies.size())
                .acceptedReplyId(acceptedId)
                .isAccepted(isAccepted)
                .tags(p.getTags() != null
                        ? p.getTags().stream().map(ForumTag::getName).sorted().toList()
                        : List.of())
                .likeCount(p.getId() != null ? forumLikeRepository.countByPostId(p.getId()) : 0L)
                .likedByMe(p.getId() != null && liked.contains(p.getId()))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
