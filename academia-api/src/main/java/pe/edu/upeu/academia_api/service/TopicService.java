package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.topic.TopicRequest;
import pe.edu.upeu.academia_api.dto.topic.TopicResponse;

import java.util.List;
import java.util.UUID;

public interface TopicService {
    List<TopicResponse> findAllRoots();
    List<TopicResponse> findAll();
    TopicResponse findById(UUID id);
    TopicResponse create(TopicRequest request);
    TopicResponse update(UUID id, TopicRequest request);
    void delete(UUID id);
    TopicResponse addPrerequisite(UUID topicId, UUID prerequisiteId);
    TopicResponse removePrerequisite(UUID topicId, UUID prerequisiteId);
}
