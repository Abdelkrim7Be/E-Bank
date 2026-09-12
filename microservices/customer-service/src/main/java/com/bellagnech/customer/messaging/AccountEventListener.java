package com.bellagnech.customer.messaging;

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
public class AccountEventListener {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "account-events", groupId = "customer-service")
    public void onAccountEvent(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String eventType = node.has("eventType") ? node.get("eventType").asText() : "?";
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            Long customerId = node.has("customerId") ? node.get("customerId").asLong() : null;
            log.info("Customer-service received account event: type={}, accountId={}, customerId={}", eventType, accountId, customerId);
        } catch (Exception e) {
            log.warn("Failed to parse account-events payload in customer-service: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "account-balance-updates", groupId = "customer-service")
    public void onBalanceUpdate(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            Double newBalance = node.has("newBalance") ? node.get("newBalance").asDouble() : null;
            log.info("Customer-service received balance update: accountId={}, newBalance={}", accountId, newBalance);
        } catch (Exception e) {
            log.warn("Failed to parse account-balance-updates in customer-service: {}", e.getMessage());
        }
    }
}
