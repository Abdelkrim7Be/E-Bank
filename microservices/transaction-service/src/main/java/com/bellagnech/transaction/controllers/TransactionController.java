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
    private final com.bellagnech.transaction.repositories.AccountOperationRepository operationRepository;

    @GetMapping("/statistics/accounts")
    public java.util.Map<String, Long> getAccountCounts() {
        return operationRepository.countByAccount().stream().collect(java.util.stream.Collectors.toMap(
                com.bellagnech.transaction.repositories.AccountOperationRepository.AccountCount::getAccountId,
                com.bellagnech.transaction.repositories.AccountOperationRepository.AccountCount::getTotal));
    }

    @GetMapping("/statistics/types")
    public java.util.List<com.bellagnech.transaction.repositories.AccountOperationRepository.TypeSummary> getTypeSummary(
            @RequestParam(defaultValue = "30") int days) {
        if (days < 1 || days > 3650) throw new IllegalArgumentException("Days must be between 1 and 3650");
        return operationRepository.summarizeSince(java.util.Date.from(java.time.Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS)));
    }

    @PostMapping("/credit")
    public ResponseEntity<Void> credit(@Valid @RequestBody TransactionRequest request) 
            throws AccountNotFoundException {
        log.info("Credit request for account {}: amount {}", request.getAccountId(), request.getAmount());
        transactionService.credit(request.getAccountId(), request.getAmount(), request.getDescription());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/debit")
    public ResponseEntity<Void> debit(@Valid @RequestBody TransactionRequest request) 
            throws AccountNotFoundException, BalanceNotSufficientException {
        log.info("Debit request for account {}: amount {}", request.getAccountId(), request.getAmount());
        transactionService.debit(request.getAccountId(), request.getAmount(), request.getDescription());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transfer(@Valid @RequestBody TransferRequest request)
            throws AccountNotFoundException, BalanceNotSufficientException {
        log.info("Transfer request: {} from {} to {}", 
                request.getAmount(), request.getSourceAccountId(), request.getDestinationAccountId());
        transactionService.transfer(
                request.getSourceAccountId(), 
                request.getDestinationAccountId(), 
                request.getAmount());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<AccountOperationDTO>> getAccountTransactions(@PathVariable String accountId) {
        log.info("Retrieving transactions for account {}", accountId);
        return ResponseEntity.ok(transactionService.getAccountHistory(accountId));
    }

    @GetMapping("/account/{accountId}/history")
    public ResponseEntity<Page<AccountOperationDTO>> getAccountHistoryPaginated(
            @PathVariable String accountId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Retrieving paginated transactions for account {} (page: {}, size: {})", accountId, page, size);
        return ResponseEntity.ok(transactionService.getAccountHistoryPaginated(accountId, page, size));
    }

    @GetMapping
    public ResponseEntity<Page<AccountOperationDTO>> getAllTransactions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Retrieving paginated list of all transactions (page: {}, size: {})", page, size);
        return ResponseEntity.ok(transactionService.getAllTransactionsPaginated(page, size));
    }
}

