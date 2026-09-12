package com.bellagnech.customer.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCreatedEvent {
    public static final String EVENT_TYPE = "CUSTOMER_CREATED";

    private String eventId;
    private String eventType = EVENT_TYPE;
    private Instant timestamp = Instant.now();
    private Long customerId;
    private String name;
    private String email;
    private String username;
}
