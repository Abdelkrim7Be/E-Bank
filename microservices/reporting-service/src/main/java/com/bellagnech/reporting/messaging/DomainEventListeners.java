package com.bellagnech.reporting.messaging;

import com.bellagnech.reporting.services.ProjectionStore;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class DomainEventListeners {
    private final ProjectionStore projections;
    @KafkaListener(topics={"account-events","account-balance-updates","account-status-changes","customer-events","transaction-events"}, groupId="reporting-projection-v1", concurrency="1")
    public void onEvent(String payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) throws Exception {
        projections.accept(topic, payload);
    }
    public List<String> snapshotLastEvents() { return List.of("Persistent projection available through /api/reports/dashboard"); }
}
