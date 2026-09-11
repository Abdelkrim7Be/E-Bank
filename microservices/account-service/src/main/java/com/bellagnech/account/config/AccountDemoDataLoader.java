package com.bellagnech.account.config;

import com.bellagnech.account.entities.BankAccount;
import com.bellagnech.account.entities.CurrentAccount;
import com.bellagnech.account.entities.SavingAccount;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.events.AccountCreatedEvent;
import com.bellagnech.account.messaging.AccountEventProducer;
import com.bellagnech.account.repositories.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountDemoDataLoader implements ApplicationRunner {
    private final BankAccountRepository accounts;
    private final AccountEventProducer events;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(ApplicationArguments args) throws Exception {
        if (accounts.count() > 0) return;
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("demo/accounts.csv").getInputStream(), StandardCharsets.UTF_8))) {
            for (String line : reader.lines().skip(1).toList()) {
                String[] row = line.split(",");
                BankAccount account;
                if (row[2].equals("CurrentAccount")) {
                    var current = new CurrentAccount();
                    current.setOverDraft(new BigDecimal(row[4]));
                    account = current;
                } else {
                    var savings = new SavingAccount();
                    savings.setInterestRate(Double.parseDouble(row[5]));
                    account = savings;
                }
                account.setId(row[0]);
                account.setCustomerId(Long.parseLong(row[1]));
                account.setBalance(new BigDecimal(row[3]));
                account.setStatus(AccountStatus.ACTIVATED);
                account.setCreatedBy("system-demo");
                accounts.save(account);
                events.publishAccountCreated(AccountCreatedEvent.builder()
                        .eventType("ACCOUNT_CREATED").accountId(account.getId()).aggregateId(account.getId())
                        .customerId(account.getCustomerId()).accountType(row[2])
                        .initialBalance(account.getBalance()).status(account.getStatus().name()).build());
            }
        }
        log.info("Seeded {} demo accounts with reconciled balances", accounts.count());
    }
}
