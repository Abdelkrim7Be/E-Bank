package com.bellagnech.customer.controllers;

import com.bellagnech.customer.dtos.AuthResponse;
import com.bellagnech.customer.dtos.LoginRequest;
import com.bellagnech.customer.dtos.ProfileUpdateRequest;
import com.bellagnech.customer.dtos.RegisterRequest;
import com.bellagnech.customer.dtos.UserProfileDTO;
import com.bellagnech.customer.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for username: {}", request.getUsername());
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, null, null, null, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for username: {}", request.getUsername());
        try {
            AuthResponse response = authService.authenticate(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(new AuthResponse(null, null, null, null, "Invalid username or password"));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        log.info("Profile requested for user: {}", username);
        UserProfileDTO profile = authService.getCurrentUserProfile(username);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        String username = authentication.getName();
        log.info("Update profile request for user: {}", username);
        UserProfileDTO profile = authService.updateCurrentUserProfile(username, request);
        return ResponseEntity.ok(profile);
    }
}
