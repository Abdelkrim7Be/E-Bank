package com.bellagnech.transaction.messaging;
import com.bellagnech.transaction.messaging.outbox.OutboxRepository;
import com.bellagnech.transaction.entities.AccountOperation;
import com.bellagnech.transaction.enums.OperationType;
import com.bellagnech.transaction.repositories.AccountOperationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties={"app.kafka.enabled=true","spring.cloud.discovery.enabled=false","eureka.client.enabled=false"})
@Import({TransactionEventProducer.class, ObjectMapper.class})
class OutboxTransactionTest {
    @Autowired TransactionEventProducer producer;
    @Autowired OutboxRepository outbox;
    @Autowired AccountOperationRepository operations;
    @Autowired PlatformTransactionManager manager;
    @Test
    @Transactional(propagation=Propagation.NOT_SUPPORTED)
    void businessRollbackAlsoRemovesTheEvent() {
        assertThatThrownBy(() -> new TransactionTemplate(manager).execute(status -> {
            var operation = new AccountOperation();
            operation.setBankAccountId("a"); operation.setAmount(new java.math.BigDecimal("10")); operation.setDescription("Rollback test");
            operation.setType(OperationType.CREDIT); operations.saveAndFlush(operation);
            producer.sendTransactionEvent("a", TransactionEvent.builder().type("CREDIT").accountId("a").amount(java.math.BigDecimal.TEN).build());
            throw new IllegalStateException("Simulated business failure");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(operations.count()).isZero();
        assertThat(outbox.count()).isZero();
    }
}
