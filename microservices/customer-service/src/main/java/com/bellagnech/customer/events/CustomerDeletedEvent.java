package com.bellagnech.customer.events;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerDeletedEvent {
    public static final String EVENT_TYPE = "CUSTOMER_DELETED";
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private Long customerId;
}
