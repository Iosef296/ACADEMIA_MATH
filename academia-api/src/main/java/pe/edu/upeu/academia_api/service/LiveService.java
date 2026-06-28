package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.live.LiveSessionRequest;
import pe.edu.upeu.academia_api.dto.live.LiveSessionResponse;

import java.util.List;
import java.util.UUID;

public interface LiveService {
    List<LiveSessionResponse> findAll();
    LiveSessionResponse findById(UUID id);
    LiveSessionResponse create(LiveSessionRequest request, UUID teacherId);
    LiveSessionResponse updateStatus(UUID id, String status);
    void delete(UUID id);
}
