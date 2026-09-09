package com.bellagnech.transaction.services;

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

    @Transactional
    public void credit(String accountId, double amount, String description) throws AccountNotFoundException {
        log.info("Crediting account {} with amount {}", accountId, amount);
        
        AccountServiceClient.AccountDTO account = accountServiceClient.getAccount(accountId);
        if (account == null) {
            throw new AccountNotFoundException(
                "Account service temporarily unavailable or account not found: " + accountId + ". Ensure account-service is running and registered.");
        }

        double currentBalance = account.balance != null ? account.balance : 0.0;
        double newBalance = currentBalance + amount;
        updateAccountBalance(accountId, newBalance);

        AccountOperation operation = new AccountOperation();
        operation.setBankAccountId(accountId);
        operation.setAmount(amount);
        operation.setDescription(description);
        operation.setType(OperationType.CREDIT);
        operationRepository.save(operation);
        publishTransactionEvent("CREDIT", accountId, amount, description);

        log.info("Credit operation completed for account {}", accountId);
    }

    @Transactional
    public void debit(String accountId, double amount, String description) 
            throws AccountNotFoundException, BalanceNotSufficientException {
        log.info("Debiting account {} with amount {}", accountId, amount);
        
        AccountServiceClient.AccountDTO account = accountServiceClient.getAccount(accountId);
        if (account == null) {
            throw new AccountNotFoundException(
                "Account service temporarily unavailable or account not found: " + accountId + ". Ensure account-service is running and registered.");
        }

        double currentBalance = account.balance != null ? account.balance : 0.0;
        double overdraft = 0.0; // Could be fetched from account details if needed
        
        if (currentBalance + overdraft < amount) {
            throw new BalanceNotSufficientException(
                String.format("Insufficient balance. Current: %.2f, Required: %.2f", currentBalance, amount));
        }

        double newBalance = currentBalance - amount;
        updateAccountBalance(accountId, newBalance);

        AccountOperation operation = new AccountOperation();
        operation.setBankAccountId(accountId);
        operation.setAmount(amount);
        operation.setDescription(description);
        operation.setType(OperationType.DEBIT);
        operationRepository.save(operation);
        publishTransactionEvent("DEBIT", accountId, amount, description);

        log.info("Debit operation completed for account {}", accountId);
    }

    @Transactional
    public void transfer(String sourceAccountId, String destinationAccountId, Double amount)
            throws AccountNotFoundException, BalanceNotSufficientException {
        log.info("Transferring {} from account {} to account {}", amount, sourceAccountId, destinationAccountId);
        
        debit(sourceAccountId, amount, "Transfer to " + destinationAccountId);
        credit(destinationAccountId, amount, "Transfer from " + sourceAccountId);
        
        log.info("Transfer completed successfully");
    }

    public List<AccountOperationDTO> getAccountHistory(String accountId) {
        log.info("Retrieving transaction history for account {}", accountId);
        List<AccountOperationDTO> list = operationRepository.findByBankAccountIdOrderByOperationDateDesc(accountId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        enrichWithCustomerNames(list);
        return list;
    }

    public Page<AccountOperationDTO> getAccountHistoryPaginated(String accountId, int page, int size) {
        log.info("Retrieving paginated transaction history for account {} (page: {}, size: {})", accountId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<AccountOperationDTO> result = operationRepository.findByBankAccountIdOrderByOperationDateDesc(accountId, pageable)
                .map(this::toDTO);
        enrichWithCustomerNames(result.getContent());
        return result;
    }

    public Page<AccountOperationDTO> getAllTransactionsPaginated(int page, int size) {
        log.info("Retrieving paginated list of all transactions (page: {}, size: {})", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<AccountOperationDTO> result = operationRepository.findAllByOrderByOperationDateDesc(pageable)
                .map(this::toDTO);
        enrichWithCustomerNames(result.getContent());
        return result;
    }

    /**
     * Resolve and set customerName for each DTO from account-service (cached per request to avoid N+1).
     * Falls back to customer-service by customerId when account does not include customerName.
     */
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

    private void updateAccountBalance(String accountId, double newBalance) {
        try {
            Map<String, Double> balanceUpdate = Map.of("balance", newBalance);
            accountServiceClient.updateBalance(accountId, balanceUpdate);
        } catch (FeignException e) {
            log.error("Account service call failed for balance update, account {}: status={}", accountId, e.status());
            throw e; // Let GlobalExceptionHandler return 404/502 with a clear message
        } catch (Exception e) {
            log.error("Failed to update account balance for account {}: {}", accountId, e.getMessage());
            throw new RuntimeException("Failed to update account balance", e);
        }
    }

    private void publishTransactionEvent(String type, String accountId, double amount, String description) {
        try {
            TransactionEvent event = TransactionEvent.builder()
                    .type(type)
                    .accountId(accountId)
                    .amount(amount)
                    .description(description)
                    .build();
            transactionEventProducer.sendTransactionEvent(accountId, event);
        } catch (Exception e) {
            // Demo-safe behavior: do not fail core transaction flow if Kafka publish fails.
            log.warn("Failed to publish transaction event type={} for account {}: {}", type, accountId, e.getMessage());
        }
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

