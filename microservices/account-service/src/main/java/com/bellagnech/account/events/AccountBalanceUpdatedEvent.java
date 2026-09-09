package com.bellagnech.account.events;
import java.math.BigDecimal;

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
public class AccountBalanceUpdatedEvent extends BaseEvent {
    private String accountId;
    private BigDecimal previousBalance;
    private BigDecimal newBalance;
    private String reason;
    private String initiatedBy;
}

