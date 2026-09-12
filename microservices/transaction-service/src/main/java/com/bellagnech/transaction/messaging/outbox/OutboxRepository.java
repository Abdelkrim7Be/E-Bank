package com.bellagnech.transaction.messaging.outbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import java.util.List;
public interface OutboxRepository extends JpaRepository<OutboxEvent,String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<OutboxEvent> findAllByOrderByCreatedAtAscIdAsc(Pageable page);
}
