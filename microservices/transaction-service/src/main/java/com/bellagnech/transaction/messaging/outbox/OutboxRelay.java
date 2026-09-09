package com.bellagnech.transaction.messaging.outbox;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OutboxRelay {
    private final OutboxRepository repository;
    private final KafkaTemplate<String,String> kafka;
    // The bounded batch holds database locks until broker acknowledgement.
    // A crash after send and before commit can replay an event with the same eventId.
    @Scheduled(fixedDelayString="${app.outbox.poll-ms:1000}")
    @Transactional
    public void publishPending() {
        for (var event : repository.findAllByOrderByCreatedAtAscIdAsc(PageRequest.of(0,25))) {
            try {
                kafka.send("transaction-events", event.getAggregateId(), event.getPayload()).get(5, TimeUnit.SECONDS);
                repository.delete(event);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                log.warn("Outbox delivery deferred for event {}: {}", event.getId(), e.getClass().getSimpleName());
                return;
            }
        }
    }
}
