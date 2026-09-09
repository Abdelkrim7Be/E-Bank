package com.bellagnech.reporting.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class DomainEventListeners {

    private static final int MAX_EVENTS = 100;

    private final ObjectMapper objectMapper;

    @Getter
    private final Deque<String> lastEvents = new ArrayDeque<>();

    private void recordEvent(String source, String payload) {
        String entry = Instant.now() + " [" + source + "] " + payload;
        synchronized (lastEvents) {
            if (lastEvents.size() >= MAX_EVENTS) {
                lastEvents.removeFirst();
            }
            lastEvents.addLast(entry);
        }
    }

    @KafkaListener(topics = "account-events", groupId = "reporting-service")
    public void onAccountEvent(String payload) {
        recordEvent("account-events", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            String eventType = node.has("eventType") ? node.get("eventType").asText() : "?";
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            log.info("Reporting: account event type={}, accountId={}", eventType, accountId);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse account-events payload: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "account-balance-updates", groupId = "reporting-service")
    public void onBalanceUpdate(String payload) {
        recordEvent("account-balance-updates", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            Double newBalance = node.has("newBalance") ? node.get("newBalance").asDouble() : null;
            log.info("Reporting: balance update accountId={}, newBalance={}", accountId, newBalance);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse account-balance-updates payload: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "transaction-events", groupId = "reporting-service")
    public void onTransactionEvent(String payload) {
        recordEvent("transaction-events", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            String type = node.has("type") ? node.get("type").asText() : "?";
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            log.info("Reporting: transaction event type={}, accountId={}", type, accountId);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse transaction-events payload: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "customer-events", groupId = "reporting-service")
    public void onCustomerEvent(String payload) {
        recordEvent("customer-events", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            Long customerId = node.has("customerId") ? node.get("customerId").asLong() : null;
            String email = node.has("email") ? node.get("email").asText() : "?";
            log.info("Reporting: customer event customerId={}, email={}", customerId, email);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse customer-events payload: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "account-status-changes", groupId = "reporting-service")
    public void onAccountStatusChanged(String payload) {
        recordEvent("account-status-changes", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            String accountId = node.has("accountId") ? node.get("accountId").asText() : "?";
            String previousStatus = node.has("previousStatus") ? node.get("previousStatus").asText() : "?";
            String newStatus = node.has("newStatus") ? node.get("newStatus").asText() : "?";
            log.info("Reporting: account status changed accountId={}, {} -> {}", accountId, previousStatus, newStatus);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse account-status-changes payload: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "audit-events", groupId = "reporting-service")
    public void onAuditEvent(String payload) {
        recordEvent("audit-events", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);
            String method = node.has("method") ? node.get("method").asText() : "?";
            String path = node.has("path") ? node.get("path").asText() : "?";
            int statusCode = node.has("statusCode") ? node.get("statusCode").asInt() : 0;
            long durationMs = node.has("durationMs") ? node.get("durationMs").asLong() : 0;
            log.info("Reporting: audit event {} {} -> {} ({}ms)", method, path, statusCode, durationMs);
        } catch (Exception e) {
            log.warn("Reporting: failed to parse audit-events payload: {}", e.getMessage());
        }
    }

    public List<String> snapshotLastEvents() {
        synchronized (lastEvents) {
            return List.copyOf(lastEvents);
        }
    }
}
