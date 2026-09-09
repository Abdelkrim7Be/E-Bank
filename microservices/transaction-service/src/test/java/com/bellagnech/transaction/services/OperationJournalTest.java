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

    @Test void uncertainResponseRetainsRequestAndRetryCompletesHistoryOnce() {
        String key=java.util.UUID.randomUUID().toString();
        journal.prepare(key,"TRANSFER","a","b",new BigDecimal("10.25"),"Test");
        doThrow(new IllegalStateException("Response lost after account commit")).doNothing()
            .when(accounts).applyOperation(eq("transfer"),anyMap());
        assertThatThrownBy(() -> journal.complete(key)).isInstanceOf(IllegalStateException.class);
        assertThat(requests.findById(key).orElseThrow().getStatus()).isEqualTo("PENDING");
        assertThat(history.count()).isZero();
        journal.prepare(key,"TRANSFER","a","b",new BigDecimal("10.25"),"Test");
        assertThat(journal.complete(key).getStatus()).isEqualTo("COMPLETED");
        journal.complete(key);
        verify(accounts,times(2)).applyOperation(eq("transfer"),argThat(body -> key.equals(body.get("operationId"))));
        assertThat(history.count()).isEqualTo(2);
        assertThat(outbox.count()).isEqualTo(2);
        assertThatThrownBy(() -> journal.prepare(key,"TRANSFER","a","b",BigDecimal.ONE,"Test"))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
}
