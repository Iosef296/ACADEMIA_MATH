package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.entity.Graph;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface GraphService {
    List<Graph> findAll(String topicId, String exerciseId);
    Graph findById(UUID id);
    Graph create(Map<String, Object> request, UUID creatorId);
    Graph update(UUID id, Map<String, Object> request);
    void delete(UUID id);
}
