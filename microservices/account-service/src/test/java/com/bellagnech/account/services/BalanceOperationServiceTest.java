package com.bellagnech.account.services;
import com.bellagnech.account.entities.CurrentAccount;
import com.bellagnech.account.enums.AccountStatus;
import com.bellagnech.account.repositories.BankAccountRepository;
import com.bellagnech.account.messaging.AccountEventProducer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.math.BigDecimal;
import java.util.concurrent.*;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties={"spring.cloud.discovery.enabled=false","eureka.client.enabled=false"})
@Import(BalanceOperationService.class)
@Transactional(propagation=Propagation.NOT_SUPPORTED)
class BalanceOperationServiceTest {
    @Autowired BankAccountRepository repository;
    @Autowired BalanceOperationService service;
    @Autowired com.bellagnech.account.repositories.BalanceReceiptRepository receipts;
    @MockBean AccountEventProducer events;
    @BeforeEach void seed() {
        receipts.deleteAll();
        repository.deleteAll();
        for (String id : new String[]{"a","b"}) {
            var account=new CurrentAccount(); account.setId(id); account.setBalance(new BigDecimal("100.00"));
            account.setCustomerId(1L); account.setStatus(AccountStatus.ACTIVATED); repository.save(account);
        }
    }
    @Test void transferMovesBothBalancesAndRejectsMissingDestinationWithoutDebit() {
        service.apply(java.util.UUID.randomUUID().toString(), "TRANSFER","a","b",new BigDecimal("12.25"));
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("87.75");
        assertThat(repository.findById("b").orElseThrow().getBalance()).isEqualByComparingTo("112.25");
        assertThatThrownBy(() -> service.apply(java.util.UUID.randomUUID().toString(), "TRANSFER","a","missing",BigDecimal.TEN)).isInstanceOf(RuntimeException.class);
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("87.75");
    }
    @Test void rejectsInvalidAmountsAndInsufficientFunds() {
        for (String amount : new String[]{"0","-1","1.001","101"})
            assertThatThrownBy(() -> service.apply(java.util.UUID.randomUUID().toString(), "DEBIT","a",null,new BigDecimal(amount))).isInstanceOf(RuntimeException.class);
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("100");
    }
    @Test void concurrentCreditsDoNotOverwriteEachOther() throws Exception {
        try (var pool=Executors.newFixedThreadPool(4)) {
            var tasks=IntStream.range(0,20).<Callable<Void>>mapToObj(i -> () -> { service.apply(java.util.UUID.randomUUID().toString(), "CREDIT","a",null,new BigDecimal("0.10")); return null; }).toList();
            for(var future:pool.invokeAll(tasks)) future.get(10,TimeUnit.SECONDS);
        }
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("102");
    }
    @Test void retryAfterLostResponseReturnsSameReceiptAndRejectsDifferentRequest() {
        String key = java.util.UUID.randomUUID().toString();
        var first = service.apply(key, "TRANSFER", "a", "b", new BigDecimal("12.25"));
        var replay = service.apply(key, "TRANSFER", "a", "b", new BigDecimal("12.250"));
        assertThat(replay.getCompletedAt()).isEqualTo(first.getCompletedAt());
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("87.75");
        assertThatThrownBy(() -> service.apply(key, "TRANSFER", "a", "b", BigDecimal.ONE))
            .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void simultaneousRetriesMoveMoneyOnce() throws Exception {
        String key = java.util.UUID.randomUUID().toString();
        try (var pool = Executors.newFixedThreadPool(4)) {
            var tasks = IntStream.range(0, 12).<Callable<Void>>mapToObj(i -> () -> {
                service.apply(key, "TRANSFER", "a", "b", new BigDecimal("9.99")); return null;
            }).toList();
            for (var future : pool.invokeAll(tasks)) future.get(10, TimeUnit.SECONDS);
        }
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("90.01");
        assertThat(repository.findById("b").orElseThrow().getBalance()).isEqualByComparingTo("109.99");
        assertThat(receipts.count()).isEqualTo(1);
    }
    @Test void concurrentDebitsCannotOverspend() throws Exception {
        try (var pool = Executors.newFixedThreadPool(4)) {
            var tasks = IntStream.range(0, 20).<Callable<Boolean>>mapToObj(i -> () -> {
                try { service.apply(java.util.UUID.randomUUID().toString(), "DEBIT", "a", null, BigDecimal.TEN); return true; }
                catch (org.springframework.web.server.ResponseStatusException expected) { return false; }
            }).toList();
            int successes = 0;
            for (var future : pool.invokeAll(tasks)) if (future.get(10, TimeUnit.SECONDS)) successes++;
            assertThat(successes).isEqualTo(10);
        }
        assertThat(repository.findById("a").orElseThrow().getBalance()).isEqualByComparingTo("0.00");
    }
}
