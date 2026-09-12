package com.bellagnech.reporting.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "account-service", fallback = AccountServiceClientFallback.class)
public interface AccountServiceClient {
    @GetMapping("/api/accounts")
    List<AccountDTO> getAllAccounts();
    
    @GetMapping("/api/accounts/customer/{customerId}")
    List<AccountDTO> getCustomerAccounts(@PathVariable Long customerId);
    
    class AccountDTO {
        public String id;
        public Double balance;
        public String status;
        public Long customerId;
        public String type;
        public java.util.Date createDate;
    }
}

