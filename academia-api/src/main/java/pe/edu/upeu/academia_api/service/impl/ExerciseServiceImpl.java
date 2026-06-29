package pe.edu.upeu.academia_api.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.exercise.*;
import pe.edu.upeu.academia_api.entity.*;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.ExerciseService;
import pe.edu.upeu.academia_api.service.ProgressService;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseServiceImpl implements ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseStepRepository stepRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final ProgressService progressService;
    private final ExerciseAttemptRepository attemptRepository;
    private final StudentProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ExerciseResponse> findAll(String topicId, String difficulty) {
        List<Exercise> exercises;
        if (topicId != null && difficulty != null) {
            exercises = exerciseRepository.findByTopicIdAndDifficulty(
                    UUID.fromString(topicId), ExerciseDifficulty.valueOf(difficulty.toUpperCase()));
        } else if (topicId != null) {
            exercises = exerciseRepository.findByTopicId(UUID.fromString(topicId));
        } else if (difficulty != null) {
            exercises = exerciseRepository.findByDifficulty(ExerciseDifficulty.valueOf(difficulty.toUpperCase()));
        } else {
            exercises = exerciseRepository.findAll();
        }
        return exercises.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExerciseResponse findById(UUID id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generate(UUID id) {
        return generateWithLevel(id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateForStudent(UUID id, UUID userId) {
        int level = profileRepository.findByUserId(userId)
                .map(p -> p.getXpTotal() / 100 + 1)
                .orElse(1);
        return generateWithLevel(id, level);
    }

    private Map<String, Object> generateWithLevel(UUID id, Integer level) {
        Exercise exercise = find(id);
        if (!exercise.getIsParametric() || exercise.getVariables().isEmpty()) {
            return Map.of("content_latex", exercise.getContentLatex(), "values", Map.of());
        }
        Map<String, Double> values = new LinkedHashMap<>();
        for (ExerciseVariable v : exercise.getVariables()) {
            double minVal = v.getMinVal() != null ? v.getMinVal() : 1;
            double maxVal = v.getMaxVal() != null ? v.getMaxVal() : 10;

            if (level != null && level > 1) {
                double scaleFactor = Math.min((level - 1) * 0.2, 1.0);
                double range = maxVal - minVal;
                minVal = minVal + range * scaleFactor * 0.3;
                maxVal = maxVal + range * scaleFactor;
            }

            double val = generateConstrained(minVal, maxVal,
                    v.getStepVal(), v.getConstraintType(), v.getConstraintValue(),
                    Boolean.TRUE.equals(v.getIntegerOnly()));
            values.put(v.getVarName(), val);
        }
        String latex = exercise.getContentLatex();
        for (Map.Entry<String, Double> e : values.entrySet()) {
            String display = e.getValue() == Math.floor(e.getValue())
                    ? String.valueOf((long) e.getValue().doubleValue())
                    : String.valueOf(e.getValue());
            latex = latex.replace("${" + e.getKey() + "}", display);
        }
        return Map.of("values", values, "content_latex", latex, "exercise", toResponse(exercise));
    }

    private double generateConstrained(double min, double max, Double step,
                                       String constraintType, String constraintValue, boolean integerOnly) {
        int maxTries = 50;
        for (int i = 0; i < maxTries; i++) {
            double val;
            if (step != null && step > 0) {
                long steps = (long) ((max - min) / step);
                val = min + (long)(Math.random() * (steps + 1)) * step;
            } else {
                val = min + Math.random() * (max - min);
            }
            if (integerOnly || (step != null && step == Math.floor(step))) {
                val = Math.round(val);
            } else {
                val = Math.round(val * 100.0) / 100.0;
            }
            if (val < min) val = min;
            if (val > max) val = max;

            if (constraintType == null || constraintType.isEmpty() || satisfiesConstraint(val, constraintType, constraintValue)) {
                return val;
            }
        }
        return findNearestValid(min, max, constraintType, constraintValue);
    }

    private double findNearestValid(double min, double max, String constraintType, String constraintValue) {
        if (constraintType == null || constraintType.isEmpty()) return Math.round(min);
        long start = (long) Math.ceil(min);
        long end = (long) Math.floor(max);
        for (long n = start; n <= end; n++) {
            if (satisfiesConstraint(n, constraintType, constraintValue)) return n;
        }
        return Math.round(min);
    }

    private boolean satisfiesConstraint(double val, String type, String value) {
        long n = (long) val;
        return switch (type.toLowerCase()) {
            case "prime" -> isPrime(n);
            case "divisible" -> value != null && n % Long.parseLong(value) == 0;
            case "not_divisible" -> value != null && n % Long.parseLong(value) != 0;
            case "even" -> n % 2 == 0;
            case "odd" -> n % 2 != 0;
            case "positive" -> val > 0;
            default -> true;
        };
    }

    private boolean isPrime(long n) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;
        for (long i = 3; i * i <= n; i += 2) if (n % i == 0) return false;
        return true;
    }

    @Override
    @Transactional
    public Map<String, Object> rate(RateRequest request, UUID userId) {
        Exercise exercise = exerciseRepository.findById(UUID.fromString(request.getExerciseId()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Ejercicio no encontrado"));

        boolean isCorrect = !"no_idea".equals(request.getRating()) && !"hard".equals(request.getRating());
        progressService.recordExercise(userId, exercise.getTopic().getId(), isCorrect,
                request.getTimeSpent() != null ? request.getTimeSpent() : 0);

        String varJson = null;
        if (request.getVariableValues() != null) {
            try { varJson = objectMapper.writeValueAsString(request.getVariableValues()); }
            catch (Exception ignored) {}
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        ExerciseAttempt attempt = ExerciseAttempt.builder()
                .exercise(exercise)
                .user(user)
                .rating(request.getRating())
                .isCorrect(isCorrect)
                .timeSpent(request.getTimeSpent() != null ? request.getTimeSpent() : 0)
                .hintsUsed(request.getHintsUsed() != null ? request.getHintsUsed() : 0)
                .variableValues(varJson)
                .build();
        attemptRepository.save(attempt);

        boolean trigger = "hard".equals(request.getRating()) || "no_idea".equals(request.getRating());
        return Map.of("triggerMicroLesson", trigger);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(UUID userId) {
        return attemptRepository.findByUserIdOrderByAttemptedAtDesc(userId).stream()
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("exerciseId", a.getExercise() != null ? a.getExercise().getId() : null);
                    m.put("exerciseTitle", a.getExercise() != null ? a.getExercise().getTitle() : null);
                    m.put("rating", a.getRating());
                    m.put("isCorrect", a.getIsCorrect());
                    m.put("timeSpent", a.getTimeSpent());
                    m.put("hintsUsed", a.getHintsUsed());
                    m.put("attemptedAt", a.getAttemptedAt());
                    return m;
                }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFlashcards(UUID userId) {
        List<ExerciseAttempt> hardAttempts = attemptRepository.findByUserIdOrderByAttemptedAtDesc(userId)
                .stream()
                .filter(a -> "hard".equals(a.getRating()) || "no_idea".equals(a.getRating()))
                .toList();

        Set<UUID> seen = new HashSet<>();
        List<Map<String, Object>> flashcards = new ArrayList<>();
        for (ExerciseAttempt a : hardAttempts) {
            if (a.getExercise() == null) continue;
            if (seen.add(a.getExercise().getId())) {
                Map<String, Object> card = new LinkedHashMap<>();
                card.put("exerciseId", a.getExercise().getId());
                card.put("title", a.getExercise().getTitle());
                card.put("contentLatex", a.getExercise().getContentLatex());
                card.put("difficulty", a.getExercise().getDifficulty().name().toLowerCase());
                card.put("topic", (a.getExercise().getTopic() != null)
                        ? Map.of("id", a.getExercise().getTopic().getId(),
                                "name", a.getExercise().getTopic().getName())
                        : Map.of());
                card.put("lastRating", a.getRating());
                card.put("lastAttempt", a.getAttemptedAt());
                flashcards.add(card);
            }
        }

        if (flashcards.isEmpty()) {
            exerciseRepository.findAll(PageRequest.of(0, 10, Sort.by("createdAt").descending()))
                    .getContent().forEach(e -> {
                Map<String, Object> card = new LinkedHashMap<>();
                card.put("exerciseId", e.getId());
                card.put("title", e.getTitle());
                card.put("contentLatex", e.getContentLatex());
                card.put("difficulty", e.getDifficulty().name().toLowerCase());
                card.put("topic", e.getTopic() != null
                        ? Map.of("id", e.getTopic().getId(), "name", e.getTopic().getName())
                        : Map.of());
                card.put("lastRating", null);
                card.put("lastAttempt", null);
                flashcards.add(card);
            });
        }
        return flashcards;
    }

    @Override
    @Transactional
    public ExerciseResponse create(ExerciseRequest request, UUID creatorId) {
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tema no encontrado"));
        Exercise exercise = Exercise.builder()
                .title(request.getTitle())
                .contentLatex(request.getContentLatex())
                .topic(topic)
                .isParametric(request.getIsParametric() != null ? request.getIsParametric() : false)
                .needsGraph(request.getNeedsGraph() != null ? request.getNeedsGraph() : false)
                .graphType(request.getGraphType())
                .build();
        if (request.getDifficulty() != null) {
            exercise.setDifficulty(ExerciseDifficulty.valueOf(request.getDifficulty().toUpperCase()));
        }
        if (creatorId != null) {
            userRepository.findById(creatorId).ifPresent(exercise::setCreatedBy);
        }
        return toResponse(exerciseRepository.save(exercise));
    }

    @Override
    @Transactional
    public ExerciseResponse update(UUID id, ExerciseRequest request) {
        Exercise exercise = find(id);
        exercise.setTitle(request.getTitle());
        exercise.setContentLatex(request.getContentLatex());
        if (request.getDifficulty() != null) {
            exercise.setDifficulty(ExerciseDifficulty.valueOf(request.getDifficulty().toUpperCase()));
        }
        if (request.getIsParametric() != null) exercise.setIsParametric(request.getIsParametric());
        if (request.getNeedsGraph() != null) exercise.setNeedsGraph(request.getNeedsGraph());
        if (request.getGraphType() != null) exercise.setGraphType(request.getGraphType());
        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tema no encontrado"));
            exercise.setTopic(topic);
        }
        return toResponse(exerciseRepository.save(exercise));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        exerciseRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExerciseResponse.StepRef> getSteps(UUID id) {
        return stepRepository.findByExerciseIdOrderByStepOrderAsc(id)
                .stream().map(this::toStepRef).toList();
    }

    @Override
    @Transactional
    public ExerciseResponse.StepRef addStep(UUID id, ExerciseStepRequest request) {
        Exercise exercise = find(id);
        ExerciseStep step = ExerciseStep.builder()
                .exercise(exercise)
                .contentLatex(request.getContentLatex())
                .hint(request.getHint())
                .warning(request.getWarning())
                .stepOrder(request.getStepOrder() != null ? request.getStepOrder() : exercise.getSteps().size())
                .build();
        return toStepRef(stepRepository.save(step));
    }

    @Override
    @Transactional
    public void reorderSteps(UUID id, List<UUID> stepIds) {
        Map<UUID, ExerciseStep> stepMap = stepRepository.findAllById(stepIds)
                .stream().collect(Collectors.toMap(ExerciseStep::getId, s -> s));
        List<ExerciseStep> toUpdate = new ArrayList<>();
        for (int i = 0; i < stepIds.size(); i++) {
            ExerciseStep step = stepMap.get(stepIds.get(i));
            if (step != null) {
                step.setStepOrder(i);
                toUpdate.add(step);
            }
        }
        stepRepository.saveAll(toUpdate);
    }

    @Override
    @Transactional
    public ExerciseResponse.StepRef updateStep(UUID exerciseId, UUID stepId, ExerciseStepRequest request) {
        ExerciseStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Paso no encontrado"));
        step.setContentLatex(request.getContentLatex());
        if (request.getHint() != null) step.setHint(request.getHint());
        if (request.getWarning() != null) step.setWarning(request.getWarning());
        if (request.getStepOrder() != null) step.setStepOrder(request.getStepOrder());
        return toStepRef(stepRepository.save(step));
    }

    @Override
    @Transactional
    public void deleteStep(UUID exerciseId, UUID stepId) {
        stepRepository.deleteById(stepId);
    }

    private Exercise find(UUID id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Ejercicio no encontrado"));
    }

    private ExerciseResponse toResponse(Exercise e) {
        return ExerciseResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .contentLatex(e.getContentLatex())
                .difficulty(e.getDifficulty().name().toLowerCase())
                .isParametric(e.getIsParametric())
                .needsGraph(e.getNeedsGraph())
                .graphType(e.getGraphType())
                .topic(ExerciseResponse.TopicRef.builder()
                        .id(e.getTopic().getId())
                        .name(e.getTopic().getName())
                        .build())
                .steps(e.getSteps().stream().map(this::toStepRef).toList())
                .variables(e.getVariables().stream().map(v ->
                        ExerciseResponse.VariableRef.builder()
                                .id(v.getId()).varName(v.getVarName())
                                .minVal(v.getMinVal()).maxVal(v.getMaxVal()).stepVal(v.getStepVal())
                                .build()).toList())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private ExerciseResponse.StepRef toStepRef(ExerciseStep s) {
        return ExerciseResponse.StepRef.builder()
                .id(s.getId()).stepOrder(s.getStepOrder())
                .contentLatex(s.getContentLatex())
                .hint(s.getHint()).warning(s.getWarning())
                .build();
    }
}
