package pe.edu.upeu.academia_api.service;

import pe.edu.upeu.academia_api.dto.auth.AuthResponse;
import pe.edu.upeu.academia_api.dto.auth.LoginRequest;
import pe.edu.upeu.academia_api.dto.auth.RefreshRequest;
import pe.edu.upeu.academia_api.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshRequest request);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
    void verifyEmail(String token);
}
