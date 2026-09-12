package com.bellagnech.account.services;
import com.bellagnech.account.entities.BankAccount;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.repositories.BankAccountRepository;
import com.bellagnech.account.events.AccountBalanceUpdatedEvent;
import com.bellagnech.account.messaging.AccountEventProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BalanceOperationService {
    private final BankAccountRepository repository;
    private final AccountEventProducer events;
    private final com.bellagnech.account.repositories.BalanceReceiptRepository receipts;

    @Transactional
    public com.bellagnech.account.entities.BalanceReceipt apply(String operationId, String type, String accountId, String destinationId, BigDecimal amount) {
        if (operationId == null || !operationId.matches("[A-Za-z0-9_-]{8,100}")) invalid("A valid operation ID is required");
        if (amount == null || amount.signum() <= 0 || amount.compareTo(new BigDecimal("999999999999999.99")) > 0) invalid("Invalid amount");
        try { amount = amount.setScale(2, RoundingMode.UNNECESSARY); }
        catch (ArithmeticException e) { invalid("Amount must have at most two decimal places"); }
        boolean transfer = "TRANSFER".equals(type);
        if (!transfer && !"CREDIT".equals(type) && !"DEBIT".equals(type)) invalid("Unknown operation");
        if (accountId == null || accountId.isBlank()) invalid("Account is required");
        if (transfer && (destinationId == null || destinationId.isBlank() || accountId.equals(destinationId))) invalid("Choose a different destination account");
        String fingerprint = type + "|" + accountId + "|" + destinationId + "|" + amount.toPlainString();
        var existing = receipts.findById(operationId);
        if (existing.isPresent()) return replay(existing.get(), fingerprint);
        var locked = new HashMap<String,BankAccount>();
        // Every transfer acquires its locks in the same order to avoid opposing-transfer deadlocks.
        Stream.of(accountId, transfer ? destinationId : accountId).distinct().sorted().forEach(id -> {
            var account = repository.findForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Account not found"));
            locked.put(id, account);
        });
        // Recheck after the account locks: a concurrent retry may have just committed.
        existing = receipts.findById(operationId);
        if (existing.isPresent()) return replay(existing.get(), fingerprint);
        for (var account : locked.values()) {
            if (account.getStatus() != AccountStatus.ACTIVATED) invalid("Account is not active");
        }
        var source = locked.get(accountId);
        BigDecimal oldSource = source.getBalance();
        BigDecimal newSource = "CREDIT".equals(type) ? oldSource.add(amount) : oldSource.subtract(amount);
        if (newSource.signum() < 0) invalid("Insufficient balance");
        source.setBalance(newSource);
        if (transfer) {
            var destination = locked.get(destinationId);
            BigDecimal oldDestination = destination.getBalance();
            destination.setBalance(oldDestination.add(amount));
            publish(destination, oldDestination, "TRANSFER");
        }
        publish(source, oldSource, type);
        var saved = receipts.save(new com.bellagnech.account.entities.BalanceReceipt(operationId, fingerprint,
            source.getBalance(), transfer ? locked.get(destinationId).getBalance() : null, java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS), false));
        saved.setFirstApplication(true);
        return saved;
    }
    private com.bellagnech.account.entities.BalanceReceipt replay(com.bellagnech.account.entities.BalanceReceipt receipt, String fingerprint) {
        if (!receipt.getRequestFingerprint().equals(fingerprint))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Operation ID already used for a different request");
        receipt.setFirstApplication(false);
        return receipt;
    }
    private void publish(BankAccount account, BigDecimal previous, String reason) {
        events.publishBalanceUpdated(AccountBalanceUpdatedEvent.builder()
            .eventType("BALANCE_UPDATED").aggregateId(account.getId()).accountId(account.getId())
            .previousBalance(previous).newBalance(account.getBalance()).reason(reason).initiatedBy("system").build());
    }
    private void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
