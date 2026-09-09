package com.bellagnech.account.repositories;

import com.bellagnech.account.entities.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select a from BankAccount a where a.id = :id")
    Optional<BankAccount> findForUpdate(@org.springframework.data.repository.query.Param("id") String id);

    List<BankAccount> findByCustomerId(Long customerId);
    Optional<BankAccount> findByIdAndCustomerId(String id, Long customerId);
}

