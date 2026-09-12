package com.bellagnech.customer.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "transaction-service")
public interface TransactionServiceClient {

    @GetMapping("/api/transactions/account/{accountId}")
    List<TransactionDTO> getAccountTransactions(@PathVariable String accountId);

    @GetMapping("/api/transactions/customer/history")
    java.util.Map<String,Object> getCustomerHistory(@org.springframework.web.bind.annotation.RequestParam("page") int page,
        @org.springframework.web.bind.annotation.RequestParam("size") int size,
        @org.springframework.web.bind.annotation.RequestParam("accountId") String accountId,
        @org.springframework.web.bind.annotation.RequestParam("type") String type);

    class TransactionDTO {
        private String id;
        private java.util.Date operationDate;
        private Double amount;
        private String type;
        private String description;
        private String bankAccountId;
        private String performedBy;
        private String customerName;
        private String requestId;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public java.util.Date getOperationDate() {
            return operationDate;
        }

        public void setOperationDate(java.util.Date operationDate) {
            this.operationDate = operationDate;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getBankAccountId() {
            return bankAccountId;
        }

        public void setBankAccountId(String bankAccountId) {
            this.bankAccountId = bankAccountId;
        }

        public String getPerformedBy() {
            return performedBy;
        }

        public void setPerformedBy(String performedBy) {
            this.performedBy = performedBy;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getRequestId() {
            return requestId;
        }

        public void setRequestId(String requestId) {
            this.requestId = requestId;
        }
    }
}

