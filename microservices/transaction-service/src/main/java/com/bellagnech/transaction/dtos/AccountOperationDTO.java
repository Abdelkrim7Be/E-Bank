package com.bellagnech.transaction.dtos;
import java.math.BigDecimal;

import com.bellagnech.transaction.enums.OperationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountOperationDTO {
    private Long id;
    private Date operationDate;
    private BigDecimal amount;
    private String description;
    private OperationType type;
    private String bankAccountId;
    private String performedBy;
    private String customerName;
}

