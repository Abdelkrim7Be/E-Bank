package com.bellagnech.transaction.clients;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomerServiceClientFallback implements CustomerServiceClient {
    @Override
    public CustomerDTO getCustomer(Long id) {
        log.warn("Fallback: Customer service unavailable for customer ID: {}", id);
        return null;
    }
}

