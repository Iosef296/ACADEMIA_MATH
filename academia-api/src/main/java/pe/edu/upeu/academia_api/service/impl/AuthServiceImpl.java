package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.auth.*;
import pe.edu.upeu.academia_api.entity.StudentProfile;
import pe.edu.upeu.academia_api.entity.User;
import pe.edu.upeu.academia_api.entity.UserRole;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.StudentProfileRepository;
import pe.edu.upeu.academia_api.repository.UserRepository;
import pe.edu.upeu.academia_api.security.JwtUtil;
import pe.edu.upeu.academia_api.service.AuthService;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT, "Email ya registrado");
        }

        UserRole role = UserRole.STUDENT;
        if (request.getRole() != null) {
            try { role = UserRole.valueOf(request.getRole().toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .verificationToken(verificationToken)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        StudentProfile profile = StudentProfile.builder().user(user).build();
        profileRepository.save(profile);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Cuenta bloqueada temporalmente. Intenta en " + LOCK_MINUTES + " minutos.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = (user.getLoginAttempts() == null ? 0 : user.getLoginAttempts()) + 1;
            user.setLoginAttempts(attempts);
            if (attempts >= MAX_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
                user.setLoginAttempts(0);
            }
            userRepository.save(user);
            throw new AppException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastAccessAt(LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshRequest request) {
        String token = request.getRefreshToken();
        if (!jwtUtil.isTokenValid(token) || !jwtUtil.isRefreshToken(token)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token inválido");
        }
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
        });
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Token inválido"));
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Token expirado");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Token inválido"));
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String access = jwtUtil.generateAccessToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getId().toString());
        return AuthResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .user(toUserDTO(user))
                .build();
    }

    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .emailVerified(user.getEmailVerified())
                .lastAccessAt(user.getLastAccessAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
