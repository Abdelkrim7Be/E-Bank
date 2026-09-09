package com.bellagnech.transaction.config;

import com.bellagnech.transaction.entities.AccountOperation;
import com.bellagnech.transaction.enums.OperationType;
import com.bellagnech.transaction.repositories.AccountOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;

/** Seeds demo account operations for kafka/default profile. */
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="app.demo.enabled", havingValue="true")
@Component
@RequiredArgsConstructor
@Slf4j

public class TransactionDemoDataLoader implements ApplicationRunner {

    private final AccountOperationRepository operationRepository;
    private final com.bellagnech.transaction.messaging.TransactionEventProducer events;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (operationRepository.count() > 0) {
            log.info("Account operations already present, skipping demo seeding.");
            return;
        }

        log.info("Seeding demo account operations for French customers...");
        createOperation("ACC-CA-001", OperationType.CREDIT, 2100.00,
                "Salaire - Société Tech Paris", daysAgo(5));
        createOperation("ACC-CA-001", OperationType.DEBIT, 85.40,
                "Courses Carrefour Lyon", daysAgo(4));
        createOperation("ACC-CA-001", OperationType.DEBIT, 49.99,
                "Abonnement Netflix", daysAgo(3));

        createOperation("ACC-CA-002", OperationType.CREDIT, 1950.50,
                "Virement salaire - Banque Nationale", daysAgo(8));
        createOperation("ACC-CA-002", OperationType.DEBIT, 120.30,
                "Facture électricité EDF", daysAgo(6));

        createOperation("ACC-CA-003", OperationType.CREDIT, 320.00,
                "Remboursement frais professionnels", daysAgo(7));
        createOperation("ACC-CA-003", OperationType.DEBIT, 45.90,
                "Abonnement SNCF", daysAgo(2));

        createOperation("ACC-CA-004", OperationType.DEBIT, 29.99,
                "Abonnement Spotify", daysAgo(9));
        createOperation("ACC-CA-004", OperationType.DEBIT, 64.50,
                "Restaurant Marseille", daysAgo(1));
        createOperation("SA_001", OperationType.CREDIT, 500.00,
                "Virement épargne mensuel", daysAgo(10));
        createOperation("SA_001", OperationType.CREDIT, 150.00,
                "Prime exceptionnelle", daysAgo(20));

        createOperation("SA_002", OperationType.CREDIT, 300.00,
                "Épargne automatique", daysAgo(15));
        createOperation("SA_003", OperationType.CREDIT, 250.00,
                "Intérêts trimestriels", daysAgo(30));

        // Additional mixed operations to bulk up beyond 50 records
        for (int i = 5; i <= 20; i++) {
            String accountId = String.format("ACC-CA-%03d", i);
            createOperation(accountId, OperationType.CREDIT, 150 + i * 10,
                    "Paiement freelance - Projet web Paris", daysAgo(2 + (i % 5)));
            createOperation(accountId, OperationType.DEBIT, 40 + i * 3,
                    "Courses Monoprix", daysAgo(1 + (i % 3)));
        }

        for (int i = 4; i <= 20; i++) {
            String accountId = String.format("SA_%03d", i);
            createOperation(accountId, OperationType.CREDIT, 100 + i * 15,
                    "Virement épargne automatique", daysAgo(3 + (i % 7)));
        }

        log.info("Seeded {} demo account operations.", operationRepository.count());
    }

    private void createOperation(String accountId, OperationType type, double amount,
                                 String description, Date date) {
        AccountOperation op = new AccountOperation();
        op.setOperationDate(date);
        op.setAmount(java.math.BigDecimal.valueOf(amount));
        op.setDescription(description);
        op.setType(type);
        op.setBankAccountId(accountId);
        op.setPerformedBy("system-demo");
        operationRepository.save(op);
        events.sendTransactionEvent(accountId, com.bellagnech.transaction.messaging.TransactionEvent.builder()
            .type(type.name()).accountId(accountId).amount(op.getAmount()).description(description).occurredAt(date.toInstant()).build());
    }

    private Date daysAgo(int days) {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, -days);
        cal.set(Calendar.HOUR_OF_DAY, 9 + (days % 10));
        cal.set(Calendar.MINUTE, (days * 7) % 60);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTime();
    }
}

