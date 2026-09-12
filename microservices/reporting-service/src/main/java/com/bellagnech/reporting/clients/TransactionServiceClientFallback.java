package com.bellagnech.reporting.clients;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class TransactionServiceClientFallback implements TransactionServiceClient {
    @Override
    public java.util.Map<String, Long> getAccountCounts() {
        throw new IllegalStateException("Transaction statistics are unavailable");
    }

    @Override
    public List<TypeSummary> getTypeSummary(int days) {
        throw new IllegalStateException("Transaction statistics are unavailable");
    }

    @Override
    public List<TransactionDTO> getAccountTransactions(String accountId) {
        log.warn("Fallback: Transaction service unavailable for account ID: {}", accountId);
        return Collections.emptyList();
    }
}

