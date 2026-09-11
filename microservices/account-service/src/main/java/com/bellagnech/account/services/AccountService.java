package com.bellagnech.account.services;
import java.math.BigDecimal;

import com.bellagnech.account.clients.CustomerServiceClient;
import com.bellagnech.account.dtos.*;
import com.bellagnech.account.entities.BankAccount;
import com.bellagnech.account.entities.CurrentAccount;
import com.bellagnech.account.entities.SavingAccount;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.events.AccountBalanceUpdatedEvent;
import com.bellagnech.account.events.AccountCreatedEvent;
import com.bellagnech.account.events.AccountStatusChangedEvent;
import com.bellagnech.account.exceptions.BankAccountNotFoundException;
import com.bellagnech.account.exceptions.CustomerNotFoundException;
import com.bellagnech.account.messaging.AccountEventProducer;
import com.bellagnech.account.repositories.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import feign.FeignException;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final BankAccountRepository bankAccountRepository;
    private final CustomerServiceClient customerServiceClient;
    private final AccountEventProducer eventProducer;

    @Transactional
    public CurrentBankAccountDTO saveCurrentBankAccount(BigDecimal initialBalance, BigDecimal overDraft, Long customerId)
            throws CustomerNotFoundException {
        log.info("Creating current account for customer ID: {} with balance: {} and overdraft: {}",
                customerId, initialBalance, overDraft);
        try {
            customerServiceClient.getCustomer(customerId);
        } catch (FeignException.NotFound notFound) {
            throw new CustomerNotFoundException("Customer not found with ID: " + customerId);
        } catch (Exception e) {
            log.warn("Could not strictly validate customer {}: {}. Proceeding with account creation.",
                    customerId, e.getMessage());
        }
        CurrentAccount account = new CurrentAccount();
        account.setId(UUID.randomUUID().toString());
        account.setBalance(initialBalance);
        account.setOverDraft(overDraft);
        account.setCustomerId(customerId);
        account.setStatus(AccountStatus.CREATED);

        CurrentAccount saved = bankAccountRepository.save(account);
        publishAccountCreatedEvent(saved.getId(), customerId, "CurrentAccount", initialBalance, "CREATED");
        return toCurrentDTO(saved);
    }

    @Transactional
    public SavingBankAccountDTO saveSavingBankAccount(BigDecimal initialBalance, double interestRate, Long customerId)
            throws CustomerNotFoundException {
        log.info("Creating saving account for customer ID: {} with balance: {} and interest rate: {}",
                customerId, initialBalance, interestRate);
        try {
            customerServiceClient.getCustomer(customerId);
        } catch (FeignException.NotFound notFound) {
            throw new CustomerNotFoundException("Customer not found with ID: " + customerId);
        } catch (Exception e) {
            log.warn("Could not strictly validate customer {} for saving account: {}. Proceeding.",
                    customerId, e.getMessage());
        }

        SavingAccount account = new SavingAccount();
        account.setId(UUID.randomUUID().toString());
        account.setBalance(initialBalance);
        account.setInterestRate(interestRate);
        account.setCustomerId(customerId);
        account.setStatus(AccountStatus.CREATED);

        SavingAccount saved = bankAccountRepository.save(account);
        publishAccountCreatedEvent(saved.getId(), customerId, "SavingAccount", initialBalance, "CREATED");
        return toSavingDTO(saved);
    }

    public BankAccountDTO getBankAccount(String accountId) throws BankAccountNotFoundException {
        log.info("Retrieving account with ID: {}", accountId);
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new BankAccountNotFoundException("Account not found with ID: " + accountId));
        BankAccountDTO dto = toDTO(account);
        enrichWithCustomer(dto);
        return dto;
    }

    public List<BankAccountDTO> bankAccountList() {
        log.info("Retrieving all accounts");
        List<BankAccountDTO> list = bankAccountRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        enrichWithCustomerNames(list);
        return list;
    }

    public List<BankAccountDTO> getCustomerAccounts(Long customerId) {
        log.info("Retrieving accounts for customer ID: {}", customerId);
        List<BankAccountDTO> list = bankAccountRepository.findByCustomerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        enrichWithCustomerNames(list);
        return list;
    }

    public Map<String, Object> getAccountStats() {
        log.info("Calculating global account statistics");
        List<BankAccount> accounts = bankAccountRepository.findAll();

        int totalAccounts = accounts.size();
        BigDecimal totalBalance = accounts.stream().map(BankAccount::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> accountsByType = accounts.stream()
                .collect(Collectors.groupingBy(
                        acc -> acc.getClass().getSimpleName(),
                        Collectors.counting()
                ));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAccounts", totalAccounts);
        stats.put("totalBalance", totalBalance);
        stats.put("averageBalance", totalAccounts == 0 ? BigDecimal.ZERO : totalBalance.divide(BigDecimal.valueOf(totalAccounts), 2, java.math.RoundingMode.HALF_EVEN));
        stats.put("accountsByType", accountsByType);
        return stats;
    }

    public List<Map<String, Object>> getAccountsForSelection(boolean onlyActive) {
        log.info("Loading accounts for selection dropdown, onlyActive={}", onlyActive);
        List<BankAccount> accounts = bankAccountRepository.findAll();
        return accounts.stream()
                .filter(acc -> !onlyActive || acc.getStatus() == AccountStatus.ACTIVATED)
                .map(acc -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", acc.getId());
                    dto.put("balance", acc.getBalance());
                    dto.put("status", acc.getStatus());
                    dto.put("customerId", acc.getCustomerId());
                    dto.put("type", acc.getClass().getSimpleName());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private void enrichWithCustomer(BankAccountDTO dto) {
        if (dto == null || dto.getCustomerId() == null) return;
        try {
            CustomerServiceClient.CustomerDTO c = customerServiceClient.getCustomer(dto.getCustomerId());
            if (c != null) {
                dto.setCustomerName(c.name);
                dto.setCustomerEmail(c.email);
            }
        } catch (Exception e) {
            log.debug("Could not resolve customer {}: {}", dto.getCustomerId(), e.getMessage());
        }
    }

    private void enrichWithCustomerNames(List<BankAccountDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;
        Map<Long, CustomerServiceClient.CustomerDTO> cache = new HashMap<>();
        for (BankAccountDTO dto : dtos) {
            if (dto.getCustomerId() == null) continue;
            CustomerServiceClient.CustomerDTO c = cache.get(dto.getCustomerId());
            if (c == null) {
                try {
                    c = customerServiceClient.getCustomer(dto.getCustomerId());
                    if (c != null) cache.put(dto.getCustomerId(), c);
                } catch (Exception e) {
                    log.debug("Could not resolve customer {}: {}", dto.getCustomerId(), e.getMessage());
                }
            }
            if (c != null) {
                dto.setCustomerName(c.name);
                dto.setCustomerEmail(c.email);
            }
        }
    }

    @Transactional
    public void updateAccountStatus(String accountId, AccountStatus status) throws BankAccountNotFoundException {
        log.info("Updating account {} status to {}", accountId, status);
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new BankAccountNotFoundException("Account not found with ID: " + accountId));
        String previousStatus = account.getStatus() != null ? account.getStatus().name() : "UNKNOWN";
        account.setStatus(status);
        bankAccountRepository.save(account);

        try {
            AccountStatusChangedEvent event = AccountStatusChangedEvent.builder()
                    .eventType("ACCOUNT_STATUS_CHANGED")
                    .aggregateId(accountId)
                    .accountId(accountId)
                    .customerId(account.getCustomerId())
                    .previousStatus(previousStatus)
                    .newStatus(status.name())
                    .build();
            eventProducer.publishAccountStatusChanged(event);
        } catch (Exception e) {
            throw new IllegalStateException("Could not persist domain event", e);
        }
    }

    @Transactional
    public void updateBalance(String accountId, BigDecimal newBalance) throws BankAccountNotFoundException {
        log.info("Updating account {} balance to {}", accountId, newBalance);
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new BankAccountNotFoundException("Account not found with ID: " + accountId));

        BigDecimal previousBalance = account.getBalance();
        account.setBalance(newBalance);
        bankAccountRepository.save(account);

        try {
            AccountBalanceUpdatedEvent event = AccountBalanceUpdatedEvent.builder()
                    .eventType("BALANCE_UPDATED")
                    .aggregateId(accountId)
                    .accountId(accountId)
                    .previousBalance(previousBalance)
                    .newBalance(newBalance)
                    .reason("Balance update")
                    .initiatedBy("system")
                    .build();
            eventProducer.publishBalanceUpdated(event);
        } catch (Exception e) {
            throw new IllegalStateException("Could not persist domain event", e);
        }
    }

    private void publishAccountCreatedEvent(String accountId, Long customerId, String accountType, BigDecimal initialBalance, String status) {
        String customerEmail = null;
        String customerName = null;
        try {
            var c = customerServiceClient.getCustomer(customerId);
            if (c != null) {
                customerEmail = c.email;
                customerName = c.name;
            }
        } catch (Exception e) {
            log.debug("Could not resolve customer for event: {}", e.getMessage());
        }
        AccountCreatedEvent event = AccountCreatedEvent.builder()
                .eventType("ACCOUNT_CREATED")
                .aggregateId(accountId)
                .accountId(accountId)
                .customerId(customerId)
                .accountType(accountType)
                .initialBalance(initialBalance)
                .status(status)
                .customerEmail(customerEmail)
                .customerName(customerName)
                .build();
        eventProducer.publishAccountCreated(event);
    }

    private BankAccountDTO toDTO(BankAccount account) {
        BankAccountDTO dto = new BankAccountDTO();
        dto.setId(account.getId());
        dto.setBalance(account.getBalance());
        dto.setCreateDate(account.getCreateDate());
        dto.setStatus(account.getStatus());
        dto.setCustomerId(account.getCustomerId());
        dto.setType(account.getClass().getSimpleName());
        if (account instanceof CurrentAccount current) {
            dto.setOverDraft(current.getOverDraft());
        }
        if (account instanceof SavingAccount saving) {
            dto.setInterestRate(saving.getInterestRate());
        }
        return dto;
    }

    private CurrentBankAccountDTO toCurrentDTO(CurrentAccount account) {
        CurrentBankAccountDTO dto = new CurrentBankAccountDTO();
        dto.setId(account.getId());
        dto.setBalance(account.getBalance());
        dto.setCreateDate(account.getCreateDate());
        dto.setStatus(account.getStatus());
        dto.setCustomerId(account.getCustomerId());
        dto.setType("CurrentAccount");
        dto.setOverDraft(account.getOverDraft());
        return dto;
    }

    private SavingBankAccountDTO toSavingDTO(SavingAccount account) {
        SavingBankAccountDTO dto = new SavingBankAccountDTO();
        dto.setId(account.getId());
        dto.setBalance(account.getBalance());
        dto.setCreateDate(account.getCreateDate());
        dto.setStatus(account.getStatus());
        dto.setCustomerId(account.getCustomerId());
        dto.setType("SavingAccount");
        dto.setInterestRate(account.getInterestRate());
        return dto;
    }
}

