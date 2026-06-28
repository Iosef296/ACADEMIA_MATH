package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.routine.MicroLessonRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineResponse;

import java.util.List;
import java.util.UUID;

public interface RoutineService {
    List<RoutineResponse> findAll(UUID userId);
    RoutineResponse create(RoutineRequest request, UUID userId);
    RoutineResponse update(UUID id, RoutineRequest request);
    void delete(UUID id);
    RoutineResponse addMicroLesson(UUID routineId, MicroLessonRequest request);
}
