package pe.edu.upeu.academia_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.entity.LevelReward;
import pe.edu.upeu.academia_api.repository.LevelRewardRepository;

import java.util.List;

@RestController
@RequestMapping("/level-rewards")
@RequiredArgsConstructor
public class LevelRewardController {

    private final LevelRewardRepository repo;

    @GetMapping
    public ResponseEntity<List<LevelReward>> findActive() {
        return ResponseEntity.ok(repo.findByActiveTrueOrderByLevelAsc());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LevelReward>> findAll() {
        return ResponseEntity.ok(repo.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LevelReward> create(@RequestBody LevelReward reward) {
        reward.setId(null);
        reward.setActive(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(reward));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LevelReward> update(@PathVariable Long id, @RequestBody LevelReward reward) {
        LevelReward existing = repo.findById(id).orElseThrow();
        existing.setLevel(reward.getLevel());
        existing.setTitle(reward.getTitle());
        existing.setDescription(reward.getDescription());
        existing.setEmoji(reward.getEmoji());
        existing.setBonusXp(reward.getBonusXp());
        existing.setActive(reward.isActive());
        return ResponseEntity.ok(repo.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
