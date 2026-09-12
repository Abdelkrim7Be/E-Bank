package com.bellagnech.account.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseEvent {

    private String eventId = UUID.randomUUID().toString();
    private String eventType;
    private Instant timestamp = Instant.now();
    private String aggregateId;
    private Integer version = 1;
    private String correlationId;
}
