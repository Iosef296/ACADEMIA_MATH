package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.DailyMission;
import pe.edu.upeu.academia_api.repository.DailyMissionRepository;

import java.util.List;

@RestController
@RequestMapping("/missions")
@RequiredArgsConstructor
public class MissionController {

    private final DailyMissionRepository repo;

    @GetMapping
    public ResponseEntity<List<DailyMission>> findActive() {
        return ResponseEntity.ok(repo.findByActiveTrueOrderByMissionTypeAscTargetValueAsc());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DailyMission>> findAll() {
        return ResponseEntity.ok(repo.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailyMission> create(@RequestBody DailyMission mission) {
        mission.setId(null);
        mission.setActive(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(mission));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailyMission> toggle(@PathVariable Long id) {
        DailyMission m = repo.findById(id).orElseThrow();
        m.setActive(!m.isActive());
        return ResponseEntity.ok(repo.save(m));
    }
}
