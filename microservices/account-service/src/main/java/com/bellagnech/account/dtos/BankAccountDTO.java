package com.bellagnech.account.dtos;
import java.math.BigDecimal;

import com.bellagnech.account.enums.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountDTO {
    private String id;
    private BigDecimal balance;
    private Date createDate;
    private AccountStatus status;
    private Long customerId;
    private String type;
    private String customerName;
    private String customerEmail;
    private BigDecimal overDraft;   // for current accounts
    private Double interestRate; // for saving accounts
}

