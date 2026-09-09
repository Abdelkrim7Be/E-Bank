package com.bellagnech.transaction.repositories;

import com.bellagnech.transaction.entities.AccountOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Date;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AccountOperationRepository extends JpaRepository<AccountOperation, Long> {
    List<AccountOperation> findByBankAccountIdOrderByOperationDateDescIdDesc(String bankAccountId);
    Page<AccountOperation> findByBankAccountIdOrderByOperationDateDescIdDesc(String bankAccountId, Pageable pageable);
    Page<AccountOperation> findAllByOrderByOperationDateDescIdDesc(Pageable pageable);

    interface AccountCount { String getAccountId(); long getTotal(); }
    interface TypeSummary { String getType(); long getTotal(); double getVolume(); }

    @Query("select o.bankAccountId as accountId, count(o) as total from AccountOperation o group by o.bankAccountId")
    List<AccountCount> countByAccount();

    @Query("select cast(o.type as string) as type, count(o) as total, sum(o.amount) as volume from AccountOperation o where o.operationDate > :since group by o.type")
    List<TypeSummary> summarizeSince(@Param("since") Date since);
}

