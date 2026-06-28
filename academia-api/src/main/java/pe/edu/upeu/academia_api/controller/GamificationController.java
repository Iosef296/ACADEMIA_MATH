package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.gamification.ChallengeRequest;
import pe.edu.upeu.academia_api.dto.gamification.ChallengeResponse;
import pe.edu.upeu.academia_api.entity.Badge;
import pe.edu.upeu.academia_api.entity.Ranking;
import pe.edu.upeu.academia_api.entity.Reward;
import pe.edu.upeu.academia_api.entity.UserBadge;
import pe.edu.upeu.academia_api.service.GamificationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/badges")
    public ResponseEntity<List<Badge>> findAllBadges() {
        return ResponseEntity.ok(gamificationService.findAllBadges());
    }

    @GetMapping("/badges/mine")
    public ResponseEntity<List<UserBadge>> findMyBadges(Authentication auth) {
        return ResponseEntity.ok(gamificationService.findMyBadges(UUID.fromString(auth.getName())));
    }

    @GetMapping("/challenges")
    public ResponseEntity<List<ChallengeResponse>> findActiveChallenges() {
        return ResponseEntity.ok(gamificationService.findActiveChallenges());
    }

    @PostMapping("/challenges")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ChallengeResponse> createChallenge(@Valid @RequestBody ChallengeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gamificationService.createChallenge(request));
    }

    @PostMapping("/challenges/{id}/submit")
    public ResponseEntity<Void> submitChallenge(@PathVariable UUID id, Authentication auth) {
        gamificationService.submitChallenge(id, UUID.fromString(auth.getName()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<Reward>> findAllRewards() {
        return ResponseEntity.ok(gamificationService.findAllRewards());
    }

    @PostMapping("/rewards/{id}/use")
    public ResponseEntity<Void> useReward(@PathVariable UUID id, Authentication auth) {
        gamificationService.useReward(id, UUID.fromString(auth.getName()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<Ranking>> getRanking() {
        return ResponseEntity.ok(gamificationService.getRanking());
    }

    @PutMapping("/ranking/visibility")
    public ResponseEntity<Void> updateVisibility(
            @RequestBody Map<String, Boolean> body, Authentication auth) {
        gamificationService.updateRankingVisibility(
                UUID.fromString(auth.getName()), body.getOrDefault("visible", true));
        return ResponseEntity.noContent().build();
    }
}
