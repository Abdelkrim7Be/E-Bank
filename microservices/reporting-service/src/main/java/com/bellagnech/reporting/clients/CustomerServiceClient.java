package com.bellagnech.reporting.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "customer-service", fallback = CustomerServiceClientFallback.class)
public interface CustomerServiceClient {
    @GetMapping("/api/customers")
    List<CustomerDTO> getAllCustomers();
    
    class CustomerDTO {
        public Long id;
        public String name;
        public String email;
        public String phone;
        public String address;
        public java.util.Date createdDate;
    }
}

