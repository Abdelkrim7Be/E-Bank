package com.bellagnech.reporting.clients;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class CustomerServiceClientFallback implements CustomerServiceClient {
    @Override
    public List<CustomerDTO> getAllCustomers() {
        log.warn("Fallback: Customer service unavailable");
        return Collections.emptyList();
    }
}

