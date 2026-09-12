package com.bellagnech.transaction.clients;
import java.math.BigDecimal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class AccountServiceClientFallback implements AccountServiceClient {
    public java.util.List<AccountDTO> getCustomerAccounts(Long customerId) { throw new IllegalStateException("Account service unavailable"); }
    public java.util.List<AccountDTO> getAccountsByIds(java.util.List<String> ids) { throw new IllegalStateException("Account service unavailable"); }
    @Override
    public BalanceReceipt applyOperation(String type, Map<String, Object> command) {
        throw new IllegalStateException("Account service unavailable; operation was not confirmed");
    }

    @Override
    public AccountDTO getAccount(String id) {
        log.warn("Fallback: Account service unavailable for account ID: {}", id);
        return null;
    }

    @Override
    public Map<String, Object> getAccountBalance(String id) {
        log.warn("Fallback: Account service unavailable for balance check, account ID: {}", id);
        return Map.of("error", "Service unavailable");
    }

    @Override
    public void updateBalance(String id, Map<String, BigDecimal> balanceUpdate) {
        throw new IllegalStateException("Account service unavailable; balance update was not confirmed");
    }
}

