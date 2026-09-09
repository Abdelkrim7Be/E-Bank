package com.bellagnech.account.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BalanceReceipt {
    @Id private String operationId;
    @Column(nullable = false, length = 2000) private String requestFingerprint;
    @Column(precision = 19, scale = 2, nullable = false) private BigDecimal sourceBalance;
    @Column(precision = 19, scale = 2) private BigDecimal destinationBalance;
    @Column(nullable = false) private Instant completedAt;
}
