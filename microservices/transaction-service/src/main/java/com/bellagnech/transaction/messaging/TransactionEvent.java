package com.bellagnech.transaction.messaging;
import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEvent {
    private java.time.Instant occurredAt;
    private String correlationId;
    private String type;
    private String accountId;
    private BigDecimal amount;
    private String description;
    private String recipientEmail;
    private String customerName;
}

