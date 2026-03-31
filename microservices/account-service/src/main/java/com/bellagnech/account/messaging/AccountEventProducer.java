package com.bellagnech.account.messaging;

import com.bellagnech.account.events.AccountBalanceUpdatedEvent;
import com.bellagnech.account.events.AccountCreatedEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AccountEventProducer {

    private static final String ACCOUNT_EVENTS_TOPIC = "account-events";
    private static final String BALANCE_UPDATE_TOPIC = "account-balance-updates";

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public AccountEventProducer(ObjectMapper objectMapper) { 
        this.objectMapper = objectMapper;
    }

    public void publishAccountCreated(AccountCreatedEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping AccountCreatedEvent for account={}", event.getAccountId());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            log.info("Publishing AccountCreatedEvent: accountId={}, customerId={}",
                    event.getAccountId(), event.getCustomerId());
            kafkaTemplate.send(ACCOUNT_EVENTS_TOPIC, event.getAccountId(), payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AccountCreatedEvent: {}", e.getMessage(), e);
        }
    }

    public void publishBalanceUpdated(AccountBalanceUpdatedEvent event) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.debug("Kafka disabled, skipping AccountBalanceUpdatedEvent for account={}",
                    event.getAccountId());
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(event);
            log.info("Publishing AccountBalanceUpdatedEvent: accountId={}, newBalance={}",
                    event.getAccountId(), event.getNewBalance());
            kafkaTemplate.send(BALANCE_UPDATE_TOPIC, event.getAccountId(), payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AccountBalanceUpdatedEvent: {}", e.getMessage(), e);
        }
    }
}

