package com.bellagnech.account.controllers;
import java.math.BigDecimal;

import com.bellagnech.account.dtos.*;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.exceptions.BankAccountNotFoundException;
import com.bellagnech.account.exceptions.CustomerNotFoundException;
import com.bellagnech.account.services.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;
    private com.bellagnech.account.security.ApiIdentity identity() { return com.bellagnech.account.security.ApiIdentity.current(); }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAccountStats() {
        identity().requireAdmin();
        log.info("Retrieving global account statistics");
        return ResponseEntity.ok(accountService.getAccountStats());
    }

    @GetMapping("/selection/list")
    public ResponseEntity<List<Map<String, Object>>> getAccountsForSelection() {
        log.info("Retrieving accounts for selection dropdown");
        return ResponseEntity.ok(accountService.getAccountsForSelection(false).stream().filter(a -> identity().admin() || java.util.Objects.equals(a.get("customerId"), identity().customerId())).toList());
    }

    @GetMapping("/selection/list/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveAccountsForSelection() {
        log.info("Retrieving active accounts for selection dropdown");
        return ResponseEntity.ok(accountService.getAccountsForSelection(true).stream().filter(a -> identity().admin() || java.util.Objects.equals(a.get("customerId"), identity().customerId())).toList());
    }

    @GetMapping
    public ResponseEntity<List<BankAccountDTO>> getAllAccounts() {
        identity().requireAdmin();
        log.info("Retrieving all accounts");
        return ResponseEntity.ok(accountService.bankAccountList());
    }

    @GetMapping("/by-ids")
    public ResponseEntity<List<BankAccountDTO>> getAccountsByIds(@RequestParam List<String> ids) {
        identity().requireAdmin();
        if (ids.size() > 500) throw new IllegalArgumentException("Too many ids in one batch request");
        return ResponseEntity.ok(accountService.getAccountsByIds(ids));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BankAccountDTO> getAccount(@PathVariable String id) throws BankAccountNotFoundException {
        log.info("Retrieving account with ID: {}", id);
        var account = accountService.getBankAccount(id);
        identity().requireOwner(account.getCustomerId());
        return ResponseEntity.ok(account);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<BankAccountDTO>> getCustomerAccounts(@PathVariable Long customerId) {
        log.info("Retrieving accounts for customer ID: {}", customerId);
        identity().requireOwner(customerId);
        return ResponseEntity.ok(accountService.getCustomerAccounts(customerId));
    }

    @PostMapping("/current")
    public ResponseEntity<CurrentBankAccountDTO> createCurrentAccount(
            @RequestParam BigDecimal initialBalance,
            @RequestParam BigDecimal overDraft,
            @RequestParam Long customerId) throws CustomerNotFoundException {
        identity().requireAdmin();
        log.info("Creating current account for customer ID: {}", customerId);
        CurrentBankAccountDTO account = accountService.saveCurrentBankAccount(initialBalance, overDraft, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PostMapping("/saving")
    public ResponseEntity<SavingBankAccountDTO> createSavingAccount(
            @RequestParam BigDecimal initialBalance,
            @RequestParam double interestRate,
            @RequestParam Long customerId) throws CustomerNotFoundException {
        identity().requireAdmin();
        log.info("Creating saving account for customer ID: {}", customerId);
        SavingBankAccountDTO account = accountService.saveSavingBankAccount(initialBalance, interestRate, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PostMapping
    public ResponseEntity<BankAccountDTO> createAccount(@Valid @RequestBody CreateAccountRequest request)
            throws CustomerNotFoundException {
        identity().requireOwner(request.getCustomerId());
        if (!identity().admin() && (request.getInitialBalance() == null || request.getInitialBalance().signum() != 0 ||
            (request.getOverdraft() != null && request.getOverdraft().signum() != 0))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "New customer accounts must start at zero without overdraft");
        }
        log.info("Creating {} account for customer ID: {}", request.getAccountType(), request.getCustomerId());

        BankAccountDTO account;
        if ("CURRENT".equalsIgnoreCase(request.getAccountType())) {
            CurrentBankAccountDTO currentAccount = accountService.saveCurrentBankAccount(
                request.getInitialBalance(),
                request.getOverdraft() != null ? request.getOverdraft() : BigDecimal.ZERO,
                request.getCustomerId());
            account = currentAccount;
        } else if ("SAVING".equalsIgnoreCase(request.getAccountType())) {
            SavingBankAccountDTO savingAccount = accountService.saveSavingBankAccount(
                request.getInitialBalance(),
                request.getInterestRate() != null ? request.getInterestRate() : 0.0,
                request.getCustomerId());
            account = savingAccount;
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BankAccountDTO> updateAccountStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) throws BankAccountNotFoundException {
        identity().requireAdmin();
        log.info("Updating account {} status", id);
        String statusStr = statusUpdate.get("status");
        if (statusStr != null) {
            AccountStatus status = AccountStatus.valueOf(statusStr.toUpperCase());
            accountService.updateAccountStatus(id, status);
            BankAccountDTO updatedAccount = accountService.getBankAccount(id);
            return ResponseEntity.ok(updatedAccount);
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<Map<String, Object>> getAccountBalance(@PathVariable String id)
            throws BankAccountNotFoundException {
        log.info("Retrieving balance for account ID: {}", id);
        BankAccountDTO account = accountService.getBankAccount(id);
        identity().requireOwner(account.getCustomerId());
        return ResponseEntity.ok(Map.of(
            "accountId", account.getId(),
            "balance", account.getBalance(),
            "status", account.getStatus()
        ));
    }

}
