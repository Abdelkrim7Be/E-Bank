package com.bellagnech.transaction.services;

import com.bellagnech.transaction.clients.AccountServiceClient;
import com.bellagnech.transaction.repositories.*;
import com.bellagnech.transaction.messaging.*;
import com.bellagnech.transaction.messaging.outbox.OutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.*;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@DataJpaTest(properties={"spring.cloud.discovery.enabled=false","eureka.client.enabled=false",
    "spring.datasource.hikari.maximum-pool-size=10","spring.datasource.hikari.minimum-idle=10"})
@Import({OperationJournal.class, TransactionEventProducer.class, ObjectMapper.class})
@Transactional(propagation=Propagation.NOT_SUPPORTED)
class OperationJournalTest {
    @Autowired OperationJournal journal;
    @Autowired OperationRequestRepository requests;
    @Autowired AccountOperationRepository history;
    @Autowired OutboxRepository outbox;
    @MockBean AccountServiceClient accounts;
    @Autowired org.springframework.transaction.PlatformTransactionManager manager;

    @org.junit.jupiter.api.BeforeEach void clean() {
        outbox.deleteAll(); history.deleteAll(); requests.deleteAll();
        // Mimics account-service's idempotent BalanceReceipt: exactly one caller sees firstApplication=true,
        // and every caller (winner or replay) observes the same completedAt, as a real persisted row would.
        var applied = new java.util.concurrent.atomic.AtomicBoolean(false);
        var completedAt = java.time.Instant.now();
        when(accounts.applyOperation(anyString(), anyMap()))
            .thenAnswer(invocation -> receipt(applied.compareAndSet(false, true), completedAt));
    }

    private static AccountServiceClient.BalanceReceipt receipt(boolean firstApplication, java.time.Instant completedAt) {
        var receipt = new AccountServiceClient.BalanceReceipt();
        receipt.completedAt = completedAt;
        receipt.firstApplication = firstApplication;
        return receipt;
    }

    @Test void stalePendingEntityCannotRepeatAnotherTransactionsCompletion() throws Exception {
        String key = java.util.UUID.randomUUID().toString();
        journal.prepare(key, "CREDIT", "a", null, BigDecimal.ONE, "Concurrent credit");
        var executor = java.util.concurrent.Executors.newSingleThreadExecutor();
        try {
            new org.springframework.transaction.support.TransactionTemplate(manager).execute(status -> {
                var stale = requests.findById(key).orElseThrow();
                assertThat(stale.getStatus()).isEqualTo("PENDING");
                try {
                    var receipt = executor.submit(() -> journal.complete(key)).get(10, java.util.concurrent.TimeUnit.SECONDS);
                    var retry = journal.complete(key);
                    assertThat(retry).usingRecursiveComparison().isEqualTo(receipt);
                } catch (Exception e) { throw new RuntimeException(e); }
                return null;
            });
        } finally { executor.shutdownNow(); }
        verify(accounts, times(1)).applyOperation(eq("credit"), anyMap());
        assertThat(history.count()).isEqualTo(1);
        assertThat(outbox.count()).isEqualTo(1);
    }

    @Test void manyTrueConcurrentCompletionsWriteExactlyOneLeg() throws Exception {
        String key = java.util.UUID.randomUUID().toString();
        journal.prepare(key, "CREDIT", "a", null, BigDecimal.ONE, "Race");
        int racers = 8;
        var pool = java.util.concurrent.Executors.newFixedThreadPool(racers);
        var ready = new java.util.concurrent.CountDownLatch(racers);
        var go = new java.util.concurrent.CountDownLatch(1);
        try {
            var futures = new java.util.ArrayList<java.util.concurrent.Future<com.bellagnech.transaction.entities.OperationRequest>>();
            for (int i = 0; i < racers; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    go.await();
                    // Mirrors TransactionService.execute(): a concurrent racer's leg insert can lose the
                    // unique-constraint race, so retry once and observe the winner's already-committed result.
                    try { return journal.complete(key); }
                    catch (org.springframework.dao.DataIntegrityViolationException conflict) { return journal.complete(key); }
                }));
            }
            ready.await(10, java.util.concurrent.TimeUnit.SECONDS);
            go.countDown();
            var results = new java.util.ArrayList<com.bellagnech.transaction.entities.OperationRequest>();
            for (var future : futures) results.add(future.get(10, java.util.concurrent.TimeUnit.SECONDS));
            var winner = results.get(0);
            assertThat(results).allSatisfy(r -> assertThat(r).usingRecursiveComparison().isEqualTo(winner));
        } finally { pool.shutdownNow(); }
        assertThat(history.count()).isEqualTo(1);
        assertThat(outbox.count()).isEqualTo(1);
    }

    @Test void uncertainResponseRetainsRequestAndRetryCompletesHistoryOnce() {
        String key=java.util.UUID.randomUUID().toString();
        var prepared = journal.prepare(key,"TRANSFER","a","b",new BigDecimal("10.25"),"Test");
        assertThat(requests.findById(key).orElseThrow()).usingRecursiveComparison().isEqualTo(prepared);
        doThrow(new IllegalStateException("Response lost after account commit"))
            .doReturn(receipt(true, java.time.Instant.now()))
            .when(accounts).applyOperation(eq("transfer"),anyMap());
        assertThatThrownBy(() -> journal.complete(key)).isInstanceOf(IllegalStateException.class);
        assertThat(requests.findById(key).orElseThrow().getStatus()).isEqualTo("PENDING");
        assertThat(history.count()).isZero();
        journal.prepare(key,"TRANSFER","a","b",new BigDecimal("10.25"),"Test");
        var receipt = journal.complete(key);
        assertThat(receipt.getStatus()).isEqualTo("COMPLETED");
        assertThat(journal.complete(key)).usingRecursiveComparison().isEqualTo(receipt);
        verify(accounts,times(2)).applyOperation(eq("transfer"),argThat(body -> key.equals(body.get("operationId"))));
        assertThat(history.count()).isEqualTo(2);
        assertThat(history.findAll()).allMatch(operation -> operation.getDescription().contains("Test"));
        assertThat(history.findByRequestIdOrderByIdAsc(key)).hasSize(2)
            .allMatch(operation -> key.equals(operation.getRequestId()));
        assertThat(outbox.count()).isEqualTo(2);
        assertThatThrownBy(() -> journal.prepare(key,"TRANSFER","a","b",BigDecimal.ONE,"Test"))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
}
