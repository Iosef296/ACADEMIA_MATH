package pe.edu.upeu.academia_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.auth.UserDTO;
import pe.edu.upeu.academia_api.dto.user.AvatarRequest;
import pe.edu.upeu.academia_api.dto.user.UpdateUserRequest;
import pe.edu.upeu.academia_api.service.UserService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMe(Authentication auth) {
        return ResponseEntity.ok(userService.getMe(UUID.fromString(auth.getName())));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMe(@Valid @RequestBody UpdateUserRequest request, Authentication auth) {
        return ResponseEntity.ok(userService.updateMe(UUID.fromString(auth.getName()), request));
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<Void> updateAvatar(@RequestBody AvatarRequest request, Authentication auth) {
        userService.updateAvatar(UUID.fromString(auth.getName()), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> findAll(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(userService.search(q));
        }
        return ResponseEntity.ok(userService.findAll());
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateRole(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateRole(id, body.get("role")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
