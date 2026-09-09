package com.bellagnech.transaction.messaging.outbox;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name="transaction_outbox")
@Getter
@NoArgsConstructor
public class OutboxEvent {
    @Id private String id;
    @Column(nullable=false) private String aggregateId;
    @Column(nullable=false, length=16000) private String payload;
    @Column(nullable=false) private Instant createdAt;
    public OutboxEvent(String id, String aggregateId, String payload) {
        this.id=id; this.aggregateId=aggregateId; this.payload=payload; this.createdAt=Instant.now();
    }
}
