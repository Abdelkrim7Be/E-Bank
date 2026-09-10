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

@DataJpaTest(properties={"spring.cloud.discovery.enabled=false","eureka.client.enabled=false"})
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

    @Test void uncertainResponseRetainsRequestAndRetryCompletesHistoryOnce() {
        String key=java.util.UUID.randomUUID().toString();
        var prepared = journal.prepare(key,"TRANSFER","a","b",new BigDecimal("10.25"),"Test");
        assertThat(requests.findById(key).orElseThrow()).usingRecursiveComparison().isEqualTo(prepared);
        doThrow(new IllegalStateException("Response lost after account commit")).doNothing()
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
        assertThat(outbox.count()).isEqualTo(2);
        assertThatThrownBy(() -> journal.prepare(key,"TRANSFER","a","b",BigDecimal.ONE,"Test"))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
}
