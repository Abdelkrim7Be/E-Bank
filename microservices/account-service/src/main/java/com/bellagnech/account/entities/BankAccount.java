package com.bellagnech.account.entities;
import java.math.BigDecimal;

import com.bellagnech.account.enums.AccountStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "TYPE", length = 4)
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class BankAccount {
    @Id
    private String id;

    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    @Column(precision = 19, scale = 2, nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createDate;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Account status is required")
    private AccountStatus status;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String createdBy;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastModifiedDate;

    private String lastModifiedBy;

    @PrePersist
    protected void onCreate() {
        createDate = new Date();
        if (createdBy == null) {
            createdBy = "system";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastModifiedDate = new Date();
    }
}

