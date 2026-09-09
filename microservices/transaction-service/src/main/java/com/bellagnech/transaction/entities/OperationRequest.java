package com.bellagnech.transaction.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OperationRequest {
    @Id private String id;
    @Column(nullable = false) private String type;
    @Column(nullable = false) private String accountId;
    private String destinationId;
    @Column(precision = 19, scale = 2, nullable = false) private BigDecimal amount;
    @Column(length = 1000) private String description;
    @Column(nullable = false) private String status = "PENDING";
    @Column(nullable = false) private Instant createdAt = Instant.now();
    private Instant completedAt;
}
