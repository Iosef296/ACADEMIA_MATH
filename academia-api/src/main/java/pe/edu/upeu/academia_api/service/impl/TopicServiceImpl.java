package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.topic.TopicRequest;
import pe.edu.upeu.academia_api.dto.topic.TopicResponse;
import pe.edu.upeu.academia_api.entity.Topic;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.TopicRepository;
import pe.edu.upeu.academia_api.service.TopicService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> findAllRoots() {
        return topicRepository.findByParentIsNullOrderByTopicOrderAsc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> findAll() {
        return topicRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TopicResponse findById(UUID id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public TopicResponse create(TopicRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "El nombre del tema es requerido");
        }
        Topic topic = Topic.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .topicOrder(request.getTopicOrder() != null ? request.getTopicOrder() : 0)
                .isLocked(request.getIsLocked() != null ? request.getIsLocked() : false)
                .unlockCondition(request.getUnlockCondition())
                .estimatedMinutes(request.getEstimatedMinutes() != null ? request.getEstimatedMinutes() : 0)
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "basico")
                .build();
        if (request.getParentId() != null) {
            topic.setParent(find(request.getParentId()));
        }
        if (request.getPrerequisiteIds() != null) {
            request.getPrerequisiteIds().forEach(prereqId -> topic.getPrerequisites().add(find(prereqId)));
        }
        return toResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public TopicResponse update(UUID id, TopicRequest request) {
        Topic topic = find(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            topic.setName(request.getName());
        }
        if (request.getDescription() != null) topic.setDescription(request.getDescription());
        if (request.getImageUrl() != null) topic.setImageUrl(request.getImageUrl());
        if (request.getTopicOrder() != null) topic.setTopicOrder(request.getTopicOrder());
        if (request.getIsLocked() != null) topic.setIsLocked(request.getIsLocked());
        if (request.getUnlockCondition() != null) topic.setUnlockCondition(request.getUnlockCondition());
        if (request.getEstimatedMinutes() != null) topic.setEstimatedMinutes(request.getEstimatedMinutes());
        if (request.getDifficulty() != null) topic.setDifficulty(request.getDifficulty());
        if (request.getParentId() != null) {
            topic.setParent(find(request.getParentId()));
        } else if (request.getParentId() == null && request.getName() != null) {
            topic.setParent(null);
        }
        if (request.getPrerequisiteIds() != null) {
            topic.getPrerequisites().clear();
            request.getPrerequisiteIds().forEach(prereqId -> {
                if (!prereqId.equals(topic.getId())) {
                    topic.getPrerequisites().add(find(prereqId));
                }
            });
        }
        return toResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        topicRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TopicResponse addPrerequisite(UUID topicId, UUID prerequisiteId) {
        Topic topic = find(topicId);
        Topic prereq = find(prerequisiteId);
        if (!topic.getPrerequisites().contains(prereq)) {
            topic.getPrerequisites().add(prereq);
        }
        return toResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public TopicResponse removePrerequisite(UUID topicId, UUID prerequisiteId) {
        Topic topic = find(topicId);
        topic.getPrerequisites().removeIf(p -> p.getId().equals(prerequisiteId));
        return toResponse(topicRepository.save(topic));
    }

    private Topic find(UUID id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tema no encontrado: " + id));
    }

    private TopicResponse toResponse(Topic topic) {
        List<UUID> prereqIds = topic.getPrerequisites() != null
                ? topic.getPrerequisites().stream().map(Topic::getId).toList()
                : List.of();
        return TopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .description(topic.getDescription())
                .imageUrl(topic.getImageUrl())
                .parentId(topic.getParent() != null ? topic.getParent().getId() : null)
                .topicOrder(topic.getTopicOrder())
                .isLocked(topic.getIsLocked())
                .estimatedMinutes(topic.getEstimatedMinutes())
                .difficulty(topic.getDifficulty())
                .prerequisiteIds(prereqIds)
                .children(topic.getChildren() != null
                        ? topic.getChildren().stream().map(this::toResponse).toList()
                        : List.of())
                .build();
    }
}
