package com.bellagnech.customer.messaging;
import com.bellagnech.customer.events.*;
import com.bellagnech.customer.messaging.outbox.OutboxWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerEventProducer {
    private final OutboxWriter outbox;
    public void publishCustomerCreated(CustomerCreatedEvent event) {
        outbox.append("customer-events", String.valueOf(event.getCustomerId()), event);
    }
    public void publishCustomerUpdated(CustomerUpdatedEvent event) {
        outbox.append("customer-events", String.valueOf(event.getCustomerId()), event);
    }
    public void publishCustomerDeleted(CustomerDeletedEvent event) {
        outbox.append("customer-events", String.valueOf(event.getCustomerId()), event);
    }
}
