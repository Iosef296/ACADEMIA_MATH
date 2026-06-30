package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.auth.UserDTO;
import pe.edu.upeu.academia_api.dto.user.AvatarRequest;
import pe.edu.upeu.academia_api.dto.user.UpdateUserRequest;
import pe.edu.upeu.academia_api.entity.User;
import pe.edu.upeu.academia_api.entity.UserRole;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.StudentProfileRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.service.UserService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDTO getMe(UUID userId) {
        return toDTO(findUser(userId));
    }

    @Override
    @Transactional
    public UserDTO updateMe(UUID userId, UpdateUserRequest request) {
        User user = findUser(userId);
        user.setName(request.getName());
        return toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public void updateAvatar(UUID userId, AvatarRequest request) {
        var profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Perfil no encontrado"));
        profile.setAvatarConfig(request.getAvatarConfig());
        profileRepository.save(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> findAll() {
        return userRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> search(String query) {
        return userRepository.searchByNameOrEmail(query).stream().map(this::toDTO).toList();
    }

    @Override
    @Transactional
    public UserDTO updateRole(UUID id, String role) {
        User user = findUser(id);
        try {
            user.setRole(UserRole.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Rol inválido: " + role);
        }
        return toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void setLevel(UUID id, int level) {
        User user = findUser(id);
        user.setManualXp(Math.max(0, 50 * level * (level - 1)));
        userRepository.save(user);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .emailVerified(user.getEmailVerified())
                .avatarUrl(user.getAvatarUrl())
                .lastAccessAt(user.getLastAccessAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
