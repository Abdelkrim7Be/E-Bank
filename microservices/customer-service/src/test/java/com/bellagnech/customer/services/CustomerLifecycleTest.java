package com.bellagnech.customer.services;

import com.bellagnech.customer.dtos.CustomerDTO;
import com.bellagnech.customer.messaging.CustomerEventProducer;
import com.bellagnech.customer.messaging.outbox.*;
import com.bellagnech.customer.repositories.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties={"spring.cloud.discovery.enabled=false", "eureka.client.enabled=false"})
@Import({CustomerService.class, CustomerEventProducer.class, OutboxWriter.class, CustomerLifecycleTest.Config.class})
class CustomerLifecycleTest {
    @TestConfiguration static class Config {
        @Bean ObjectMapper mapper() { return new ObjectMapper().findAndRegisterModules(); }
        @Bean PasswordEncoder encoder() { return new BCryptPasswordEncoder(); }
    }
    @Autowired CustomerService service;
    @Autowired CustomerRepository customers;
    @Autowired UserRepository users;
    @Autowired OutboxRepository outbox;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper mapper;
    @Autowired PlatformTransactionManager manager;

    private CustomerDTO input() {
        var dto = new CustomerDTO();
        dto.setUsername("lifecycle.customer"); dto.setName("Lifecycle Customer");
        dto.setEmail("lifecycle@example.test"); dto.setPassword("ChosenPassword42");
        dto.setRole("ADMIN"); // Creating a customer must never grant administrator access.
        return dto;
    }

    @Test void creationLinksHashedCredentialsAndNeverReturnsPassword() throws Exception {
        var result = service.saveCustomer(input());
        var user = users.findByUsername("lifecycle.customer").orElseThrow();
        assertThat(encoder.matches("ChosenPassword42", user.getPassword())).isTrue();
        assertThat(result.getRole()).isEqualTo("CUSTOMER");
        assertThat(customers.findById(result.getId()).orElseThrow().getUser().getId()).isEqualTo(user.getId());
        assertThat(mapper.writeValueAsString(input())).doesNotContain("password", "ChosenPassword42");
        assertThat(outbox.count()).isEqualTo(1);
    }

    @Test void statusAndBulkDeletionEmitVersionedSnapshots() throws Exception {
        var result = service.saveCustomer(input());
        service.bulkUpdateCustomerStatus(List.of(result.getId()), false);
        var status = outbox.findAll().stream().map(e -> {
            try { return mapper.readTree(e.getPayload()); } catch (Exception ex) { throw new RuntimeException(ex); }
        }).filter(e -> e.path("eventType").asText().contains("UPDATED")).findFirst().orElseThrow();
        assertThat(status.path("enabled").asBoolean()).isFalse();
        assertThat(status.path("aggregateVersion").asLong()).isPositive();
        service.bulkDeleteCustomers(List.of(result.getId()));
        assertThat(customers.existsById(result.getId())).isFalse();
        assertThat(outbox.findAll()).anyMatch(e -> e.getPayload().contains("CUSTOMER_DELETED"));
        assertThat(outbox.count()).isEqualTo(3);
    }

    @Test @Transactional(propagation=Propagation.NOT_SUPPORTED)
    void rollbackRemovesCustomerIdentityAndOutboxTogether() {
        long beforeCustomers = customers.count(), beforeUsers = users.count(), beforeEvents = outbox.count();
        assertThatThrownBy(() -> new TransactionTemplate(manager).execute(status -> {
            service.saveCustomer(input());
            throw new IllegalStateException("Simulated failure");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(customers.count()).isEqualTo(beforeCustomers);
        assertThat(users.count()).isEqualTo(beforeUsers);
        assertThat(outbox.count()).isEqualTo(beforeEvents);
    }
}
