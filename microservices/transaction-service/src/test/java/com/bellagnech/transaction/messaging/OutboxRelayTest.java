package com.bellagnech.transaction.messaging;
import com.bellagnech.transaction.messaging.outbox.*;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import static org.mockito.Mockito.*;

class OutboxRelayTest {
    @SuppressWarnings("unchecked")
    @Test void failedDeliveryRetainsTheEventAndStopsTheBatch() {
        var repository = mock(OutboxRepository.class);
        KafkaTemplate<String,String> kafka = mock(KafkaTemplate.class);
        var event = new OutboxEvent("event-1","account-1","{\"eventId\":\"event-1\"}");
        when(repository.findAllByOrderByCreatedAtAscIdAsc(any())).thenReturn(List.of(event));
        when(kafka.send(anyString(),anyString(),anyString())).thenReturn(CompletableFuture.failedFuture(new IllegalStateException("offline")));
        new OutboxRelay(repository,kafka).publishPending();
        verify(repository,never()).delete(any());
    }
    @SuppressWarnings("unchecked")
    @Test void confirmedDeliveryRemovesThePendingEvent() {
        var repository = mock(OutboxRepository.class);
        KafkaTemplate<String,String> kafka = mock(KafkaTemplate.class);
        var event = new OutboxEvent("event-1","account-1","{}");
        when(repository.findAllByOrderByCreatedAtAscIdAsc(any())).thenReturn(List.of(event));
        when(kafka.send("transaction-events","account-1","{}")).thenReturn(CompletableFuture.completedFuture(null));
        new OutboxRelay(repository,kafka).publishPending();
        verify(repository).delete(event);
    }
}
