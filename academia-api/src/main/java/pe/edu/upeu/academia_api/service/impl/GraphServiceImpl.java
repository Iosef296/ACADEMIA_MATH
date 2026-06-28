package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.entity.Graph;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.ExerciseRepository;
import pe.edu.upeu.academia_api.repository.GraphRepository;
import pe.edu.upeu.academia_api.repository.TopicRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.GraphService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GraphServiceImpl implements GraphService {

    private final GraphRepository graphRepository;
    private final TopicRepository topicRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Graph> findAll(String topicId, String exerciseId) {
        if (topicId != null) return graphRepository.findByTopicId(UUID.fromString(topicId));
        if (exerciseId != null) return graphRepository.findByExerciseId(UUID.fromString(exerciseId));
        return graphRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Graph findById(UUID id) {
        return find(id);
    }

    @Override
    @Transactional
    public Graph create(Map<String, Object> request, UUID creatorId) {
        Graph.GraphBuilder builder = Graph.builder()
                .title((String) request.getOrDefault("title", "Gráfica"))
                .config(request.containsKey("config") ? request.get("config").toString() : null);
        if (creatorId != null) userRepository.findById(creatorId).ifPresent(builder::createdBy);
        if (request.containsKey("topicId")) {
            topicRepository.findById(UUID.fromString((String) request.get("topicId")))
                    .ifPresent(builder::topic);
        }
        if (request.containsKey("exerciseId")) {
            exerciseRepository.findById(UUID.fromString((String) request.get("exerciseId")))
                    .ifPresent(builder::exercise);
        }
        return graphRepository.save(builder.build());
    }

    @Override
    @Transactional
    public Graph update(UUID id, Map<String, Object> request) {
        Graph graph = find(id);
        if (request.containsKey("title")) graph.setTitle((String) request.get("title"));
        if (request.containsKey("config")) graph.setConfig(request.get("config").toString());
        return graphRepository.save(graph);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        graphRepository.deleteById(id);
    }

    private Graph find(UUID id) {
        return graphRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Gráfica no encontrada"));
    }
}
