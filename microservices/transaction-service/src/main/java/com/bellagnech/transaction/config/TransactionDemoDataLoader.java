package com.bellagnech.transaction.config;

import com.bellagnech.transaction.entities.AccountOperation;
import com.bellagnech.transaction.enums.OperationType;
import com.bellagnech.transaction.messaging.TransactionEvent;
import com.bellagnech.transaction.messaging.TransactionEventProducer;
import com.bellagnech.transaction.repositories.AccountOperationRepository;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Date;

@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionDemoDataLoader implements ApplicationRunner {
    private final AccountOperationRepository operations;
    private final TransactionEventProducer events;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(ApplicationArguments args) throws Exception {
        if (operations.count() > 0) return;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("demo/operations.csv").getInputStream(), StandardCharsets.UTF_8))) {
            for (String line : reader.lines().skip(1).toList()) {
                String[] row = line.split(",");
                var operation = new AccountOperation();
                operation.setBankAccountId(row[0]);
                operation.setType(OperationType.valueOf(row[1]));
                operation.setAmount(new BigDecimal(row[2]));
                operation.setOperationDate(Date.from(today.minusDays(Integer.parseInt(row[3]))
                        .atTime(9, 0).toInstant(ZoneOffset.UTC)));
                operation.setDescription(row[4]);
                operation.setPerformedBy("system-demo");
                operations.save(operation);
                events.sendTransactionEvent(row[0], TransactionEvent.builder()
                        .type(row[1]).accountId(row[0]).amount(operation.getAmount()).description(row[4])
                        .correlationId(row[5]).occurredAt(operation.getOperationDate().toInstant()).build());
            }
        }
        log.info("Seeded {} demo operations spanning six months", operations.count());
    }
}
