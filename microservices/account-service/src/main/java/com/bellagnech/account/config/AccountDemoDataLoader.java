package com.bellagnech.account.config;

import com.bellagnech.account.entities.CurrentAccount;
import com.bellagnech.account.entities.SavingAccount;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.repositories.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ThreadLocalRandom;

/** Seeds demo bank accounts for kafka/default profile. */
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="app.demo.enabled", havingValue="true")
@Component
@RequiredArgsConstructor
@Slf4j

public class AccountDemoDataLoader implements ApplicationRunner {

    private final BankAccountRepository bankAccountRepository;
    private final com.bellagnech.account.messaging.AccountEventProducer events;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (bankAccountRepository.count() > 0) {
            log.info("Bank accounts already present, skipping demo seeding.");
            return;
        }

        log.info("Seeding demo bank accounts for French customers...");
        long[] customerIds = new long[50];
        for (int k = 0; k < 50; k++) {
            customerIds[k] = 1L + k; // 2, 3, ..., 51
        }

        // Create 25 current accounts with IDs ACC-CA-001 .. ACC-CA-025
        for (int i = 1; i <= 25; i++) {
            long customerId = customerIds[(i - 1) % customerIds.length];
            double balance = randomAmount(1_000, 25_000);
            double overdraft = randomAmount(500, 5_000);
            String accountId = String.format("ACC-CA-%03d", i);
            createCurrentAccount(accountId, customerId, balance, overdraft);
        }
        for (int i = 1; i <= 25; i++) {
            long customerId = customerIds[(i - 1) % customerIds.length];
            double balance = randomAmount(2_000, 30_000);
            double interestRate = 1.0 + (i % 5); // between 1% and 5%
            String accountId = String.format("SA_%03d", i);
            createSavingAccount(accountId, customerId, balance, interestRate);
        }

        long count = bankAccountRepository.count();
        log.info("Seeded {} demo bank accounts with IDs like ACC-CA-001 and SA_001.", count);
    }

    private void createCurrentAccount(String id, Long customerId, double balance, double overdraft) {
        CurrentAccount account = new CurrentAccount();
        account.setId(id);
        account.setBalance(java.math.BigDecimal.valueOf(balance));
        account.setStatus(AccountStatus.ACTIVATED);
        account.setCustomerId(customerId);
        account.setOverDraft(java.math.BigDecimal.valueOf(overdraft));
        bankAccountRepository.save(account);
        events.publishAccountCreated(com.bellagnech.account.events.AccountCreatedEvent.builder()
            .eventType("ACCOUNT_CREATED").accountId(id).aggregateId(id).customerId(customerId)
            .initialBalance(account.getBalance()).status("ACTIVATED").build());
    }

    private void createSavingAccount(String id, Long customerId, double balance, double interestRate) {
        SavingAccount account = new SavingAccount();
        account.setId(id);
        account.setBalance(java.math.BigDecimal.valueOf(balance));
        account.setStatus(AccountStatus.ACTIVATED);
        account.setCustomerId(customerId);
        account.setInterestRate(interestRate);
        bankAccountRepository.save(account);
        events.publishAccountCreated(com.bellagnech.account.events.AccountCreatedEvent.builder()
            .eventType("ACCOUNT_CREATED").accountId(id).aggregateId(id).customerId(customerId)
            .initialBalance(account.getBalance()).status("ACTIVATED").build());
    }

    private double randomAmount(double min, double max) {
        return Math.round(
                new java.util.Random(42L + (long) min + (long) max).nextDouble(min, max) * 100.0
        ) / 100.0;
    }
}

