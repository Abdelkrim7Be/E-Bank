package com.bellagnech.reporting.controllers;

import com.bellagnech.reporting.messaging.DomainEventListeners;
import com.bellagnech.reporting.security.ApiIdentity;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports/debug")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaDebugController {

    private final DomainEventListeners domainEventListeners;

    @GetMapping("/events")
    public List<String> getLastEvents() {
        ApiIdentity.current().requireAdmin();
        return domainEventListeners.snapshotLastEvents();
    }
}

