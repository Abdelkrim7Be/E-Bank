package com.bellagnech.customer.messaging;

import com.bellagnech.customer.events.CustomerCreatedEvent;
import com.bellagnech.customer.events.CustomerDeletedEvent;
import com.bellagnech.customer.events.CustomerUpdatedEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class CustomerEventProducer {

    private static final String TOPIC = "customer-events";

    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public CustomerEventProducer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void publishCustomerCreated(CustomerCreatedEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping CustomerCreatedEvent for customerId={}", event.getCustomerId());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getCustomerId() != null ? event.getCustomerId().toString() : "unknown";
            kafkaTemplate.send(TOPIC, key, payload);
            log.info("Published CustomerCreatedEvent: customerId={}, email={}", event.getCustomerId(), event.getEmail());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize CustomerCreatedEvent: {}", e.getMessage());
        }
    }

    public void publishCustomerUpdated(CustomerUpdatedEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping CustomerUpdatedEvent for customerId={}", event.getCustomerId());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getCustomerId() != null ? event.getCustomerId().toString() : "unknown";
            kafkaTemplate.send(TOPIC, key, payload);
            log.info("Published CustomerUpdatedEvent: customerId={}, name={}", event.getCustomerId(), event.getName());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize CustomerUpdatedEvent: {}", e.getMessage());
        }
    }

    public void publishCustomerDeleted(CustomerDeletedEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping CustomerDeletedEvent for customerId={}", event.getCustomerId());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getCustomerId() != null ? event.getCustomerId().toString() : "unknown";
            kafkaTemplate.send(TOPIC, key, payload);
            log.info("Published CustomerDeletedEvent: customerId={}", event.getCustomerId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize CustomerDeletedEvent: {}", e.getMessage());
        }
    }
}
