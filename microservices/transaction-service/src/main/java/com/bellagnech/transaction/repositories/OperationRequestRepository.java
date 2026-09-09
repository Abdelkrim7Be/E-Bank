package com.bellagnech.transaction.repositories;
import com.bellagnech.transaction.entities.OperationRequest;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface OperationRequestRepository extends JpaRepository<OperationRequest, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OperationRequest o where o.id = :id")
    Optional<OperationRequest> lockById(@Param("id") String id);
    List<OperationRequest> findTop25ByStatusOrderByCreatedAtAsc(String status);
}
