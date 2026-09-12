package com.bellagnech.customer.messaging.outbox;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name="customer_outbox")
@Getter
@NoArgsConstructor
public class OutboxEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long sequence;
    private String id;
    @Column(nullable=false) private String topic;
    @Column(nullable=false) private String aggregateId;
    @lombok.Setter @Column(nullable=false, length=16000) private String payload;
    @Column(nullable=false) private Instant createdAt;
    public OutboxEvent(String id, String topic, String aggregateId, String payload) {
        this.id=id; this.topic=topic; this.aggregateId=aggregateId; this.payload=payload; this.createdAt=Instant.now();
    }
}
