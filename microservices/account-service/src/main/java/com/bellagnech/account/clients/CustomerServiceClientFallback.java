package com.bellagnech.account.clients;

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

    @Override
    public java.util.List<CustomerDTO> getCustomersByIds(java.util.List<Long> ids) {
        log.warn("Fallback: Customer service unavailable for {} customer ids", ids.size());
        return java.util.List.of();
    }
}

