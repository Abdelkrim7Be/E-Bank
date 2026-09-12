package com.bellagnech.account.messaging;
import com.bellagnech.account.events.*;
import com.bellagnech.account.messaging.outbox.OutboxWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountEventProducer {
    private final OutboxWriter outbox;
    public void publishAccountCreated(AccountCreatedEvent event) {
        outbox.append("account-events", String.valueOf(event.getAccountId()), event);
    }
    public void publishBalanceUpdated(AccountBalanceUpdatedEvent event) {
        outbox.append("account-balance-updates", String.valueOf(event.getAccountId()), event);
    }
    public void publishAccountStatusChanged(AccountStatusChangedEvent event) {
        outbox.append("account-status-changes", String.valueOf(event.getAccountId()), event);
    }
}
