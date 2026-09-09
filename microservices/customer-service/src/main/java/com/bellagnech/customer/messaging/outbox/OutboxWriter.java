package com.bellagnech.customer.messaging.outbox;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OutboxWriter {
    private final OutboxRepository repository;
    private final ObjectMapper mapper;
    private final com.bellagnech.customer.repositories.CustomerRepository aggregates;
    @Transactional
    public void append(String topic, String aggregateId, Object event) {
        String id = UUID.randomUUID().toString();
        ObjectNode payload = mapper.valueToTree(event);
        payload.put("eventId", id); payload.put("schemaVersion", 1);
        payload.put("aggregateId", aggregateId); payload.put("occurredAt", Instant.now().toString());
        payload.put("correlationId", id);
        aggregates.flush();
        aggregates.findById(Long.valueOf(aggregateId)).ifPresent(c -> {
            payload.put("name", c.getName()); payload.put("email", c.getEmail());
            payload.put("enabled", c.getUser() == null || c.getUser().isEnabled());
        });
        var row = repository.saveAndFlush(new OutboxEvent(id, topic, aggregateId, "{}"));
        payload.put("aggregateVersion", row.getSequence());
        payload.set("payload", payload.deepCopy());
        row.setPayload(payload.toString());
    }
}
