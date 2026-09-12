package com.bellagnech.transaction.clients;
import java.math.BigDecimal;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(
    name = "account-service",
    fallback = AccountServiceClientFallback.class
)
public interface AccountServiceClient {

    @GetMapping("/api/accounts/{id}")
    AccountDTO getAccount(@PathVariable String id);

    @GetMapping("/api/accounts/{id}/balance")
    Map<String, Object> getAccountBalance(@PathVariable String id);

    @PutMapping("/api/accounts/{id}/balance")
    void updateBalance(@PathVariable String id, @RequestBody Map<String, BigDecimal> balanceUpdate);

    @org.springframework.web.bind.annotation.PostMapping("/api/accounts/operations/{type}")
    BalanceReceipt applyOperation(@PathVariable("type") String type, @RequestBody Map<String, Object> command);

    @GetMapping("/api/accounts/customer/{customerId}")
    java.util.List<AccountDTO> getCustomerAccounts(@PathVariable Long customerId);

    @GetMapping("/api/accounts/by-ids")
    java.util.List<AccountDTO> getAccountsByIds(@org.springframework.web.bind.annotation.RequestParam java.util.List<String> ids);

    class AccountDTO {
        public String id;
        public BigDecimal balance;
        public String status;
        public Long customerId;
        public String type;
        public String customerName;
    }

    /** Mirrors account-service's BalanceReceipt; firstApplication is true only for the racer that actually mutated balances. */
    class BalanceReceipt {
        public String operationId;
        public java.time.Instant completedAt;
        public boolean firstApplication;
    }
}

