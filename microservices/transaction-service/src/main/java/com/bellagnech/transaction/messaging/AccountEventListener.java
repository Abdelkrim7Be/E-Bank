package com.bellagnech.transaction.messaging;

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

    @KafkaListener(topics = "account-events", groupId = "transaction-service")
    public void onAccountEvent(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String eventType = node.has("eventType") ? node.get("eventType").asText() : "?";
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            Long customerId = node.has("customerId") ? node.get("customerId").asLong() : null;
            log.info("Transaction-service received account event: type={}, accountId={}, customerId={}", eventType, accountId, customerId);
        } catch (Exception e) {
            log.warn("Failed to parse account-events payload in transaction-service: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "account-balance-updates", groupId = "transaction-service")
    public void onBalanceUpdate(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            Double previousBalance = node.has("previousBalance") ? node.get("previousBalance").asDouble() : null;
            Double newBalance = node.has("newBalance") ? node.get("newBalance").asDouble() : null;
            String reason = node.has("reason") ? node.get("reason").asText() : "?";
            log.info("Transaction-service received balance update: accountId={}, {} -> {}, reason={}", accountId, previousBalance, newBalance, reason);
        } catch (Exception e) {
            log.warn("Failed to parse account-balance-updates in transaction-service: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "account-status-changes", groupId = "transaction-service")
    public void onAccountStatusChanged(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            String previousStatus = node.has("previousStatus") ? node.get("previousStatus").asText() : "?";
            String newStatus = node.has("newStatus") ? node.get("newStatus").asText() : "?";
            log.info("Transaction-service received account status change: accountId={}, {} -> {}", accountId, previousStatus, newStatus);
        } catch (Exception e) {
            log.warn("Failed to parse account-status-changes in transaction-service: {}", e.getMessage());
        }
    }
}
