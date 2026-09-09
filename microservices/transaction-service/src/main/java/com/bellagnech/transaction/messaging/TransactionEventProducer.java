package com.bellagnech.transaction.messaging;
import com.bellagnech.transaction.messaging.outbox.OutboxEvent;
import com.bellagnech.transaction.messaging.outbox.OutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionEventProducer {
    private final ObjectMapper objectMapper;
    private final OutboxRepository repository;
    @Value("${app.kafka.enabled:false}") private boolean kafkaEnabled;

    @Transactional
    public void sendTransactionEvent(String key, TransactionEvent event) {
        if (!kafkaEnabled) return;
        String eventId = UUID.randomUUID().toString();
        ObjectNode payload = objectMapper.valueToTree(event);
        payload.put("eventId", eventId);
        payload.put("schemaVersion", 1);
        payload.put("occurredAt", Instant.now().toString());
        repository.save(new OutboxEvent(eventId, key, payload.toString()));
    }
}
