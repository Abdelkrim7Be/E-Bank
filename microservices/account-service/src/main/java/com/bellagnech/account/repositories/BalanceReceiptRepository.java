package com.bellagnech.account.repositories;
import com.bellagnech.account.entities.BalanceReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BalanceReceiptRepository extends JpaRepository<BalanceReceipt, String> {}
