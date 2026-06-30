package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.DailyMission;
import pe.edu.upeu.academia_api.entity.UserMissionClaim;
import pe.edu.upeu.academia_api.repository.DailyMissionRepository;
import pe.edu.upeu.academia_api.repository.UserMissionClaimRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/missions")
@RequiredArgsConstructor
public class MissionController {

    private final DailyMissionRepository repo;
    private final UserMissionClaimRepository claimRepo;
    private final UserRepository userRepo;

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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailyMission> update(@PathVariable Long id, @RequestBody DailyMission mission) {
        DailyMission existing = repo.findById(id).orElseThrow();
        existing.setTitle(mission.getTitle());
        existing.setEmoji(mission.getEmoji());
        existing.setMissionType(mission.getMissionType());
        existing.setTargetValue(mission.getTargetValue());
        existing.setRewardXp(mission.getRewardXp());
        return ResponseEntity.ok(repo.save(existing));
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

    @PostMapping("/{id}/claim")
    public ResponseEntity<Map<String, Object>> claim(@PathVariable Long id, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        if (claimRepo.existsByUserIdAndMissionId(userId, id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya reclamada"));
        }
        DailyMission mission = repo.findById(id).orElseThrow();
        claimRepo.save(UserMissionClaim.builder()
                .userId(userId)
                .missionId(id)
                .claimedAt(LocalDateTime.now())
                .build());
        int missionXp = claimRepo.findByUserId(userId).stream()
                .mapToInt(c -> repo.findById(c.getMissionId()).map(DailyMission::getRewardXp).orElse(0))
                .sum();
        int manualXp = userRepo.findById(userId).map(u -> u.getManualXp() != null ? u.getManualXp() : 0).orElse(0);
        return ResponseEntity.ok(Map.of("bonusXp", missionXp + manualXp, "earned", mission.getRewardXp()));
    }

    @GetMapping("/claimed")
    public ResponseEntity<List<Long>> getClaimed(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<Long> ids = claimRepo.findByUserId(userId).stream()
                .map(UserMissionClaim::getMissionId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ids);
    }

    @GetMapping("/bonus-xp")
    public ResponseEntity<Map<String, Integer>> getBonusXp(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        int missionXp = claimRepo.findByUserId(userId).stream()
                .mapToInt(c -> repo.findById(c.getMissionId()).map(DailyMission::getRewardXp).orElse(0))
                .sum();
        int manualXp = userRepo.findById(userId).map(u -> u.getManualXp() != null ? u.getManualXp() : 0).orElse(0);
        return ResponseEntity.ok(Map.of("bonusXp", missionXp + manualXp));
    }
}
