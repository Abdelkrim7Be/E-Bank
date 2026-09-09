package com.bellagnech.account.controllers;
import com.bellagnech.account.services.BalanceOperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/accounts/operations")
@RequiredArgsConstructor
public class BalanceOperationController {
    private final BalanceOperationService service;
    private final com.bellagnech.account.repositories.BankAccountRepository accounts;
    public record Command(String operationId, String accountId, String destinationId, BigDecimal amount) {}
    @PostMapping("/{type}")
    public com.bellagnech.account.entities.BalanceReceipt apply(@PathVariable String type, @RequestBody Command command) {
        var identity = com.bellagnech.account.security.ApiIdentity.current();
        var account = accounts.findById(command.accountId()).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));
        identity.requireOwner(account.getCustomerId());
        return service.apply(command.operationId(), type.toUpperCase(java.util.Locale.ROOT), command.accountId(), command.destinationId(), command.amount());
    }
}
