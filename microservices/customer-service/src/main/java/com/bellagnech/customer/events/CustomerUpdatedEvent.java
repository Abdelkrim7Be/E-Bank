package com.bellagnech.customer.events;

import lombok.*;
import java.time.Instant;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerUpdatedEvent {
    public static final String EVENT_TYPE = "CUSTOMER_UPDATED";
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private Long customerId;
    private String name;
    private String email;
    private String username;
    private String phone;
    private String address;
}
