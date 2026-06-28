package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.routine.MicroLessonRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineRequest;
import pe.edu.upeu.academia_api.dto.routine.RoutineResponse;
import pe.edu.upeu.academia_api.entity.MicroLesson;
import pe.edu.upeu.academia_api.entity.Routine;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.RoutineRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.RoutineService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoutineServiceImpl implements RoutineService {

    private final RoutineRepository routineRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoutineResponse> findAll(UUID userId) {
        return routineRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public RoutineResponse create(RoutineRequest request, UUID userId) {
        Routine routine = Routine.builder()
                .title(request.getTitle())
                .schedule(request.getSchedule())
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .build();
        return toResponse(routineRepository.save(routine));
    }

    @Override
    @Transactional
    public RoutineResponse update(UUID id, RoutineRequest request) {
        Routine routine = find(id);
        routine.setTitle(request.getTitle());
        if (request.getSchedule() != null) routine.setSchedule(request.getSchedule());
        return toResponse(routineRepository.save(routine));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        routineRepository.deleteById(id);
    }

    @Override
    @Transactional
    public RoutineResponse addMicroLesson(UUID routineId, MicroLessonRequest request) {
        Routine routine = find(routineId);
        MicroLesson ml = MicroLesson.builder()
                .routine(routine)
                .title(request.getTitle())
                .contentLatex(request.getContentLatex())
                .lessonOrder(request.getLessonOrder() != null ? request.getLessonOrder() : routine.getMicroLessons().size())
                .build();
        routine.getMicroLessons().add(ml);
        return toResponse(routineRepository.save(routine));
    }

    private Routine find(UUID id) {
        return routineRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rutina no encontrada"));
    }

    private RoutineResponse toResponse(Routine r) {
        return RoutineResponse.builder()
                .id(r.getId()).title(r.getTitle()).schedule(r.getSchedule())
                .microLessons(r.getMicroLessons().stream().map(ml ->
                        RoutineResponse.MicroLessonRef.builder()
                                .id(ml.getId()).title(ml.getTitle())
                                .contentLatex(ml.getContentLatex())
                                .lessonOrder(ml.getLessonOrder())
                                .build()).toList())
                .build();
    }
}
