package com.bellagnech.transaction.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "customer-service", 
    fallback = CustomerServiceClientFallback.class
)
public interface CustomerServiceClient {
    @GetMapping("/api/customers/{id}")
    CustomerDTO getCustomer(@PathVariable Long id);
    
    class CustomerDTO {
        public Long id;
        public String name;
        public String email;
    }
}

