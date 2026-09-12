package com.bellagnech.customer.dtos;

import com.bellagnech.customer.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String username;
    private String email;
    private Role role;
    private String message;
    
    public AuthResponse(String token, String username, String email, Role role) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.role = role;
        this.message = "Authentication successful";
    }
}

