package com.bellagnech.customer.security;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import com.bellagnech.customer.repositories.CustomerRepository;
@Component
@RequiredArgsConstructor
public class CustomerOwnership {
    private final CustomerRepository customers;
    public boolean canRead(Long id, String username) {
        return customers.findByUser_Username(username).map(c -> c.getId().equals(id)).orElse(false);
    }
}
