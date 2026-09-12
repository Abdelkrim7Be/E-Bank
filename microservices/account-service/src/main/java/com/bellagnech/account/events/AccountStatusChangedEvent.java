package com.bellagnech.account.events;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AccountStatusChangedEvent extends BaseEvent {
    private String accountId;
    private Long customerId;
    private String previousStatus;
    private String newStatus;
}
