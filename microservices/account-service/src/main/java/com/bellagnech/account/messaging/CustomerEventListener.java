package com.bellagnech.account.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class CustomerEventListener {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "customer-events", groupId = "account-service")
    public void onCustomerEvent(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String eventType = node.has("eventType") ? node.get("eventType").asText() : "?";
            Long customerId = node.has("customerId") ? node.get("customerId").asLong() : null;
            String name = node.has("name") ? node.get("name").asText() : "?";

            switch (eventType) {
                case "CUSTOMER_CREATED" -> log.info("Account-service: new customer registered — customerId={}, name={}", customerId, name);
                case "CUSTOMER_UPDATED" -> log.info("Account-service: customer updated — customerId={}, name={}", customerId, name);
                case "CUSTOMER_DELETED" -> log.warn("Account-service: customer deleted — customerId={}. Linked accounts may need attention.", customerId);
                default -> log.info("Account-service: unknown customer event type={}, customerId={}", eventType, customerId);
            }
        } catch (Exception e) {
            log.warn("Failed to parse customer-events payload in account-service: {}", e.getMessage());
        }
    }
}
