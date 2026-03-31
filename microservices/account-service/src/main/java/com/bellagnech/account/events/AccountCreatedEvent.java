package com.bellagnech.account.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AccountCreatedEvent extends BaseEvent {
    private String accountId;
    private Long customerId;
    private String accountType;
    private Double initialBalance;
    private String status;
    private String customerEmail;
    private String customerName;
} 

