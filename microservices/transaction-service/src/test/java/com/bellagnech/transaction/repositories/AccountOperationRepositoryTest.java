package com.bellagnech.transaction.repositories;
import com.bellagnech.transaction.entities.AccountOperation;
import com.bellagnech.transaction.enums.OperationType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import java.util.Date;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {"spring.cloud.discovery.enabled=false", "eureka.client.enabled=false"})
class AccountOperationRepositoryTest {
    @Autowired AccountOperationRepository repository;
    private AccountOperation operation(String account, OperationType type, double amount, long date) {
        var operation = new AccountOperation();
        operation.setBankAccountId(account); operation.setType(type); operation.setAmount(java.math.BigDecimal.valueOf(amount));
        operation.setDescription("Test operation"); operation.setOperationDate(new Date(date));
        return repository.saveAndFlush(operation);
    }
    @Test void aggregatesWithoutLoadingHistoriesAndFiltersBeforeSumming() {
        operation("a", OperationType.CREDIT, 100, 1000);
        operation("a", OperationType.DEBIT, 25, 2000);
        operation("b", OperationType.CREDIT, 50, 2000);
        assertThat(repository.countByAccount()).extracting(AccountOperationRepository.AccountCount::getTotal).containsExactlyInAnyOrder(2L,1L);
        var summaries = repository.summarizeSince(new Date(1500));
        assertThat(summaries).hasSize(2);
        assertThat(summaries).filteredOn(row -> row.getType().equals("CREDIT"))
            .extracting(AccountOperationRepository.TypeSummary::getVolume).containsExactly(new java.math.BigDecimal("50.00"));
    }
    @Test void paginationHasStableOrderWhenDatesTie() {
        var first = operation("a", OperationType.CREDIT, 1, 2000);
        var second = operation("a", OperationType.CREDIT, 2, 2000);
        var page = repository.findByBankAccountIdOrderByOperationDateDescIdDesc("a", PageRequest.of(0,1));
        assertThat(page.getContent()).extracting(AccountOperation::getId).containsExactly(second.getId());
        assertThat(repository.findByBankAccountIdOrderByOperationDateDescIdDesc("a", PageRequest.of(1,1)).getContent())
            .extracting(AccountOperation::getId).containsExactly(first.getId());
    }
}
