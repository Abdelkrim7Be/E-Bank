package com.bellagnech.transaction.entities;
import java.math.BigDecimal;

import com.bellagnech.transaction.enums.OperationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "account_operations", indexes = {
    @Index(name = "idx_operation_account_date", columnList = "bankAccountId,operationDate,id"),
    @Index(name = "idx_operation_date", columnList = "operationDate,id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountOperation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @NotNull(message = "Operation date is required")
    private Date operationDate;

    @DecimalMin(value = "0.0", message = "Amount must be positive")
    @Column(precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;

    @NotBlank(message = "Description is required")
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Operation type is required")
    private OperationType type;

    @NotNull(message = "Bank account ID is required")
    private String bankAccountId;

    private String performedBy;

    @PrePersist
    protected void onCreate() {
        if (operationDate == null) {
            operationDate = new Date();
        }
        if (performedBy == null) {
            performedBy = "system";
        }
    }
}

