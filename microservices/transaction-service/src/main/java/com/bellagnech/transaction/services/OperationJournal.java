package com.bellagnech.transaction.services;

import com.bellagnech.transaction.entities.*;
import com.bellagnech.transaction.repositories.*;
import com.bellagnech.transaction.clients.AccountServiceClient;
import com.bellagnech.transaction.enums.OperationType;
import com.bellagnech.transaction.messaging.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OperationJournal {
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private final OperationRequestRepository requests;
    private final AccountOperationRepository history;
    private final AccountServiceClient accounts;
    private final TransactionEventProducer events;

    @Transactional
    public OperationRequest prepare(String id, String type, String accountId, String destinationId, BigDecimal amount, String description) {
        if (id == null || !id.matches("[A-Za-z0-9_-]{8,100}")) invalid("Invalid idempotency key");
        if (amount == null || amount.signum() <= 0 || amount.compareTo(new BigDecimal("999999999999999.99")) > 0) invalid("Invalid amount");
        try { amount = amount.setScale(2, RoundingMode.UNNECESSARY); }
        catch (ArithmeticException e) { invalid("Amount must have at most two decimal places"); }
        if (accountId == null || accountId.isBlank()) invalid("Account is required");
        if ("TRANSFER".equals(type) && (destinationId == null || destinationId.isBlank() || accountId.equals(destinationId))) invalid("Choose a different destination");
        if (description != null && description.length() > 1000) invalid("Description is too long");
        var old = requests.findById(id);
        if (old.isPresent()) {
            var o = old.get();
            if (!o.getType().equals(type) || !o.getAccountId().equals(accountId)
                || !Objects.equals(o.getDestinationId(), destinationId) || o.getAmount().compareTo(amount) != 0
                || !Objects.equals(o.getDescription(), description))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency key already used for another request");
            return o;
        }
        var o = new OperationRequest();
        o.setId(id); o.setType(type); o.setAccountId(accountId); o.setDestinationId(destinationId);
        o.setAmount(amount); o.setDescription(description);
        return requests.saveAndFlush(o);
    }

    // Retrying a pending request reuses the account command ID after a lost response.
    @Transactional
    public OperationRequest complete(String id) {
        var o = requests.lockById(id).orElseThrow();
        // Refresh cached state after locking to prevent concurrent completion from being repeated.
        entityManager.refresh(o);
        if ("COMPLETED".equals(o.getStatus())) return o;
        Map<String,Object> command = new HashMap<>();
        command.put("operationId", id); command.put("accountId", o.getAccountId());
        command.put("destinationId", o.getDestinationId()); command.put("amount", o.getAmount());
        accounts.applyOperation(o.getType().toLowerCase(Locale.ROOT), command);
        if ("TRANSFER".equals(o.getType())) {
            leg(o, o.getAccountId(), OperationType.DEBIT, "Transfer to " + o.getDestinationId() + transferNote(o));
            leg(o, o.getDestinationId(), OperationType.CREDIT, "Transfer from " + o.getAccountId() + transferNote(o));
        } else {
            leg(o, o.getAccountId(), OperationType.valueOf(o.getType()), o.getDescription());
        }
        o.setStatus("COMPLETED"); o.setCompletedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        return o;
    }

    private String transferNote(OperationRequest request) {
        return request.getDescription() == null || request.getDescription().isBlank() ? "" : ": " + request.getDescription();
    }

    private void leg(OperationRequest request, String account, OperationType type, String description) {
        var operation = new AccountOperation();
        operation.setBankAccountId(account); operation.setAmount(request.getAmount());
        operation.setType(type); operation.setDescription(description);
        operation.setRequestId(request.getId());
        history.save(operation);
        events.sendTransactionEvent(account, TransactionEvent.builder().type(type.name()).accountId(account)
            .amount(request.getAmount()).correlationId(request.getId()).description(description).build());
    }

    private void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
