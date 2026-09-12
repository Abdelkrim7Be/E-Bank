package com.bellagnech.reporting.clients;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class AccountServiceClientFallback implements AccountServiceClient {
    @Override
    public List<AccountDTO> getAllAccounts() {
        log.warn("Fallback: Account service unavailable");
        return Collections.emptyList();
    }
    
    @Override
    public List<AccountDTO> getCustomerAccounts(Long customerId) {
        log.warn("Fallback: Account service unavailable for customer ID: {}", customerId);
        return Collections.emptyList();
    }
}

