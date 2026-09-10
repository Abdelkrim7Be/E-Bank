package com.bellagnech.customer.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    @jakarta.validation.constraints.Size(min = 6, max = 72)
    @lombok.ToString.Exclude
    private String password;
    private Long id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String firstName;
    private String lastName;
    private boolean enabled = true;
    private String role;
    private java.util.Date createdAt;
}

