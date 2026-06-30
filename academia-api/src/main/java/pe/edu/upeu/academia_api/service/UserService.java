package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.auth.UserDTO;
import pe.edu.upeu.academia_api.dto.user.AvatarRequest;
import pe.edu.upeu.academia_api.dto.user.UpdateUserRequest;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserDTO getMe(UUID userId);
    UserDTO updateMe(UUID userId, UpdateUserRequest request);
    void updateAvatar(UUID userId, AvatarRequest request);
    List<UserDTO> findAll();
    List<UserDTO> search(String query);
    UserDTO updateRole(UUID id, String role);
    void delete(UUID id);
    void setLevel(UUID id, int level);
}
