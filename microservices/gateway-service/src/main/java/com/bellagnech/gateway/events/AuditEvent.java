package com.bellagnech.gateway.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private String method;
    private String path;
    private int statusCode;
    private long durationMs;
    private String clientIp;
    private String userAgent;
}
