package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.mood.MoodRequest;
import pe.edu.upeu.academia_api.dto.mood.MoodResponse;
import pe.edu.upeu.academia_api.service.MoodService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/mood")
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;

    @PostMapping
    public ResponseEntity<MoodResponse> create(@Valid @RequestBody MoodRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moodService.create(request, UUID.fromString(auth.getName())));
    }

    @GetMapping("/today")
    public ResponseEntity<MoodResponse> getToday(Authentication auth) {
        return ResponseEntity.ok(moodService.getToday(UUID.fromString(auth.getName())));
    }

    @GetMapping("/history")
    public ResponseEntity<List<MoodResponse>> getHistory(Authentication auth) {
        return ResponseEntity.ok(moodService.getHistory(UUID.fromString(auth.getName())));
    }
}
