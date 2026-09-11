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
        try { journal.prepare(key, type, accountId, destinationId, amount, description); }
        catch (org.springframework.dao.DataIntegrityViolationException duplicate) {
            journal.prepare(key, type, accountId, destinationId, amount, description);
        }
        return journal.complete(key);
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

    /** Resolve and set customerName for each DTO from account-service (cached per request to avoid N+1). */
    private void enrichWithCustomerNames(List<AccountOperationDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;
        Map<String, String> cache = new ConcurrentHashMap<>();
        for (AccountOperationDTO dto : dtos) {
            String accountId = dto.getBankAccountId();
            if (accountId == null || accountId.isBlank()) continue;
            String name = cache.get(accountId);
            if (name == null) {
                try {
                    AccountServiceClient.AccountDTO account = accountServiceClient.getAccount(accountId);
                    if (account != null) {
                        name = (account.customerName != null && !account.customerName.isBlank())
                                ? account.customerName
                                : null;
                        if (name == null && account.customerId != null) {
                            try {
                                CustomerServiceClient.CustomerDTO customer = customerServiceClient.getCustomer(account.customerId);
                                name = customer != null && customer.name != null && !customer.name.isBlank()
                                        ? customer.name
                                        : dto.getPerformedBy();
                            } catch (Exception e) {
                                log.debug("Could not resolve customer {} for account {}: {}", account.customerId, accountId, e.getMessage());
                                name = dto.getPerformedBy();
                            }
                        }
                        if (name == null) name = dto.getPerformedBy();
                    } else {
                        name = dto.getPerformedBy();
                    }
                } catch (Exception e) {
                    log.debug("Could not resolve customer name for account {}: {}", accountId, e.getMessage());
                    name = dto.getPerformedBy();
                }
                cache.put(accountId, name != null ? name : "");
            }
            dto.setCustomerName(name != null && !name.isEmpty() ? name : dto.getPerformedBy());
        }
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
        return dto;
    }
}

