package com.bellagnech.customer.dtos;

import com.bellagnech.customer.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private Role role;
    private String status;
    private boolean enabled;
    private String createdAt;
    private String updatedAt;
}
