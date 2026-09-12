package com.bellagnech.transaction.services;
import java.math.BigDecimal;

import com.bellagnech.transaction.clients.AccountServiceClient;
import com.bellagnech.transaction.clients.CustomerServiceClient;
import com.bellagnech.transaction.dtos.AccountOperationDTO;
import com.bellagnech.transaction.entities.AccountOperation;
import com.bellagnech.transaction.enums.OperationType;
import com.bellagnech.transaction.exceptions.AccountNotFoundException;
import com.bellagnech.transaction.exceptions.BalanceNotSufficientException;
import com.bellagnech.transaction.messaging.TransactionEvent;
import com.bellagnech.transaction.messaging.TransactionEventProducer;
import com.bellagnech.transaction.repositories.AccountOperationRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final AccountOperationRepository operationRepository;
    private final AccountServiceClient accountServiceClient;
    private final CustomerServiceClient customerServiceClient;
    private final TransactionEventProducer transactionEventProducer;

    private final OperationJournal journal;

    public com.bellagnech.transaction.entities.OperationRequest execute(String key, String type, String accountId,
            String destinationId, BigDecimal amount, String description) {
        // Under heavy concurrency a racer's insert can collide with another racer's still-uncommitted row;
        // retry (with backoff, to avoid a thundering herd) until the winner's transaction is visible.
        for (int attempt = 1; ; attempt++) {
            try { journal.prepare(key, type, accountId, destinationId, amount, description); break; }
            catch (org.springframework.dao.DataIntegrityViolationException duplicate) {
                retryOrGiveUp(duplicate, attempt);
            }
        }
        // Same reasoning: the unique constraint on (requestId, type, bankAccountId) can reject our leg
        // insert before the winning racer's transaction is visible as COMPLETED; retry until it is.
        for (int attempt = 1; ; attempt++) {
            try { return journal.complete(key); }
            catch (org.springframework.dao.DataIntegrityViolationException duplicate) {
                retryOrGiveUp(duplicate, attempt);
            }
        }
    }

    private static void retryOrGiveUp(org.springframework.dao.DataIntegrityViolationException conflict, int attempt) {
        if (attempt >= 20) throw conflict;
        try { Thread.sleep(Math.min(attempt * 5L, 50L)); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw conflict; }
    }

    public List<AccountOperationDTO> getAccountHistory(String accountId) {
        log.info("Retrieving transaction history for account {}", accountId);
        List<AccountOperationDTO> list = operationRepository.findByBankAccountIdOrderByOperationDateDescIdDesc(accountId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        enrichWithCustomerNames(list);
        return list;
    }

    public Page<AccountOperationDTO> getAccountHistoryPaginated(String accountId, int page, int size) {
        log.info("Retrieving paginated transaction history for account {} (page: {}, size: {})", accountId, page, size);
        Pageable pageable = validatedPage(page, size);
        Page<AccountOperationDTO> result = operationRepository.findByBankAccountIdOrderByOperationDateDescIdDesc(accountId, pageable)
                .map(this::toDTO);
        enrichWithCustomerNames(result.getContent());
        return result;
    }

    public Page<AccountOperationDTO> getAllTransactionsPaginated(int page, int size) {
        log.info("Retrieving paginated list of all transactions (page: {}, size: {})", page, size);
        Pageable pageable = validatedPage(page, size);
        Page<AccountOperationDTO> result = operationRepository.findAllByOrderByOperationDateDescIdDesc(pageable)
                .map(this::toDTO);
        enrichWithCustomerNames(result.getContent());
        return result;
    }

    private Pageable validatedPage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Page must be nonnegative and size between 1 and 100");
        }
        return PageRequest.of(page, size);
    }

    /** Resolve and set customerName for each DTO from account-service (batched to avoid N+1 Feign calls). */
    private void enrichWithCustomerNames(List<AccountOperationDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;
        List<String> accountIds = dtos.stream().map(AccountOperationDTO::getBankAccountId)
                .filter(id -> id != null && !id.isBlank()).distinct().toList();
        if (accountIds.isEmpty()) return;
        Map<String, String> cache = new ConcurrentHashMap<>();
        List<AccountServiceClient.AccountDTO> accounts = null;
        if (accountIds.size() > 1) {
            try { accounts = accountServiceClient.getAccountsByIds(accountIds); }
            catch (Exception e) { log.debug("Could not batch-resolve {} accounts: {}", accountIds.size(), e.getMessage()); }
        }
        if (accounts != null) {
            for (AccountServiceClient.AccountDTO account : accounts) resolveCustomerName(account, cache);
        } else {
            for (String accountId : accountIds) {
                try { resolveCustomerName(accountServiceClient.getAccount(accountId), cache); }
                catch (Exception e) { log.debug("Could not resolve customer name for account {}: {}", accountId, e.getMessage()); }
            }
        }
        for (AccountOperationDTO dto : dtos) {
            String name = cache.get(dto.getBankAccountId());
            dto.setCustomerName(name != null && !name.isEmpty() ? name : dto.getPerformedBy());
        }
    }

    private void resolveCustomerName(AccountServiceClient.AccountDTO account, Map<String, String> cache) {
        if (account == null || account.id == null) return;
        String name = account.customerName;
        if ((name == null || name.isBlank()) && account.customerId != null) {
            try {
                CustomerServiceClient.CustomerDTO customer = customerServiceClient.getCustomer(account.customerId);
                name = customer != null ? customer.name : null;
            } catch (Exception e) {
                log.debug("Could not resolve customer {} for account {}: {}", account.customerId, account.id, e.getMessage());
            }
        }
        cache.put(account.id, name != null ? name : "");
    }

    private void saveTransferLeg(String accountId, BigDecimal amount, OperationType type, String description) {
        AccountOperation operation = new AccountOperation();
        operation.setBankAccountId(accountId); operation.setAmount(amount);
        operation.setType(type); operation.setDescription(description);
        operationRepository.save(operation);
        publishTransactionEvent(type.name(), accountId, amount, description);
    }

    private void publishTransactionEvent(String type, String accountId, BigDecimal amount, String description) {
        TransactionEvent event = TransactionEvent.builder()
            .type(type).accountId(accountId).amount(amount).description(description).build();
        transactionEventProducer.sendTransactionEvent(accountId, event);
    }

    private AccountOperationDTO toDTO(AccountOperation operation) {
        AccountOperationDTO dto = new AccountOperationDTO();
        dto.setId(operation.getId());
        dto.setOperationDate(operation.getOperationDate());
        dto.setAmount(operation.getAmount());
        dto.setDescription(operation.getDescription());
        dto.setType(operation.getType());
        dto.setBankAccountId(operation.getBankAccountId());
        dto.setPerformedBy(operation.getPerformedBy());
        dto.setRequestId(operation.getRequestId());
        return dto;
    }
}

