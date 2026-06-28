package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.mood.MoodRequest;
import pe.edu.upeu.academia_api.dto.mood.MoodResponse;

import java.util.List;
import java.util.UUID;

public interface MoodService {
    MoodResponse create(MoodRequest request, UUID userId);
    MoodResponse getToday(UUID userId);
    List<MoodResponse> getHistory(UUID userId);
}
