package com.bellagnech.gateway.messaging;

import com.bellagnech.gateway.events.AuditEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuditEventProducer {

    private static final String TOPIC = "audit-events";

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public void publishAuditEvent(AuditEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping audit event for {} {}", event.getMethod(), event.getPath());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getMethod() + ":" + event.getPath();
            kafkaTemplate.send(TOPIC, key, payload);
            log.debug("Published audit event: {} {} -> {}", event.getMethod(), event.getPath(), event.getStatusCode());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AuditEvent: {}", e.getMessage());
        }
    }
}
