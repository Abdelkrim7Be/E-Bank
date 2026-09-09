package com.bellagnech.transaction.controllers;

import com.bellagnech.transaction.dtos.AccountOperationDTO;
import com.bellagnech.transaction.dtos.TransactionRequest;
import com.bellagnech.transaction.dtos.TransferRequest;
import com.bellagnech.transaction.exceptions.AccountNotFoundException;
import com.bellagnech.transaction.exceptions.BalanceNotSufficientException;
import com.bellagnech.transaction.services.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;
    private final com.bellagnech.transaction.clients.AccountServiceClient accounts;
    private void admin() { com.bellagnech.transaction.security.ApiIdentity.current().requireAdmin(); }
    private void owner(String accountId) {
        var account = accounts.getAccount(accountId);
        if (account == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY);
        com.bellagnech.transaction.security.ApiIdentity.current().requireOwner(account.customerId);
    }
    private final com.bellagnech.transaction.repositories.AccountOperationRepository operationRepository;

    @GetMapping("/statistics/accounts")
    public java.util.Map<String, Long> getAccountCounts() {
        admin();
        return operationRepository.countByAccount().stream().collect(java.util.stream.Collectors.toMap(
                com.bellagnech.transaction.repositories.AccountOperationRepository.AccountCount::getAccountId,
                com.bellagnech.transaction.repositories.AccountOperationRepository.AccountCount::getTotal));
    }

    @GetMapping("/statistics/types")
    public java.util.List<com.bellagnech.transaction.repositories.AccountOperationRepository.TypeSummary> getTypeSummary(
            @RequestParam(defaultValue = "30") int days) {
        admin();
        if (days < 1 || days > 3650) throw new IllegalArgumentException("Days must be between 1 and 3650");
        return operationRepository.summarizeSince(java.util.Date.from(java.time.Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS)));
    }

    @PostMapping("/credit")
    public ResponseEntity<?> credit(@RequestHeader(value = "Idempotency-Key", required = false) String key,
            @Valid @RequestBody TransactionRequest request) {
        owner(request.getAccountId());
        return ResponseEntity.ok(transactionService.execute(key(key), "CREDIT", request.getAccountId(), null, request.getAmount(), request.getDescription()));
    }

    @PostMapping("/debit")
    public ResponseEntity<?> debit(@RequestHeader(value = "Idempotency-Key", required = false) String key,
            @Valid @RequestBody TransactionRequest request) {
        owner(request.getAccountId());
        return ResponseEntity.ok(transactionService.execute(key(key), "DEBIT", request.getAccountId(), null, request.getAmount(), request.getDescription()));
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestHeader(value = "Idempotency-Key", required = false) String key,
            @Valid @RequestBody TransferRequest request) {
        owner(request.getSourceAccountId());
        return ResponseEntity.ok(transactionService.execute(key(key), "TRANSFER", request.getSourceAccountId(), request.getDestinationAccountId(), request.getAmount(), "Transfer"));
    }

    private String key(String key) { return key == null ? java.util.UUID.randomUUID().toString() : key; }

    @GetMapping("/customer/history")
    public Page<com.bellagnech.transaction.entities.AccountOperation> customerHistory(
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
            @RequestParam(required=false) String accountId, @RequestParam(required=false) String type) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("Invalid page size");
        var identity = com.bellagnech.transaction.security.ApiIdentity.current();
        if (identity.customerId() == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        var owned = accounts.getCustomerAccounts(identity.customerId()).stream().map(a -> a.id).toList();
        if (accountId != null && !accountId.isBlank()) {
            if (!owned.contains(accountId)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
            owned = java.util.List.of(accountId);
        }
        com.bellagnech.transaction.enums.OperationType operationType = null;
        if (type != null && !type.isBlank()) operationType = com.bellagnech.transaction.enums.OperationType.valueOf(
            "DEPOSIT".equals(type) ? "CREDIT" : "WITHDRAWAL".equals(type) ? "DEBIT" : type);
        return owned.isEmpty() ? Page.empty() : operationRepository.customerHistory(owned,operationType,org.springframework.data.domain.PageRequest.of(page,size));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<AccountOperationDTO>> getAccountTransactions(@PathVariable String accountId) {
        owner(accountId);
        log.info("Retrieving transactions for account {}", accountId);
        return ResponseEntity.ok(transactionService.getAccountHistory(accountId));
    }

    @GetMapping("/account/{accountId}/history")
    public ResponseEntity<Page<AccountOperationDTO>> getAccountHistoryPaginated(
            @PathVariable String accountId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        owner(accountId);
        log.info("Retrieving paginated transactions for account {} (page: {}, size: {})", accountId, page, size);
        return ResponseEntity.ok(transactionService.getAccountHistoryPaginated(accountId, page, size));
    }

    @GetMapping
    public ResponseEntity<Page<AccountOperationDTO>> getAllTransactions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        admin();
        log.info("Retrieving paginated list of all transactions (page: {}, size: {})", page, size);
        return ResponseEntity.ok(transactionService.getAllTransactionsPaginated(page, size));
    }
}

