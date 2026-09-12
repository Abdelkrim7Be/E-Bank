package com.bellagnech.customer.repositories;

import com.bellagnech.customer.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    long countByEnabledTrue();

    long countByEnabledFalse();

    long countByAccountNonLockedFalse();

    @Query("SELECT COUNT(u) FROM User u WHERE FUNCTION('DATE_TRUNC', 'month', u.createdDate) = FUNCTION('DATE_TRUNC', 'month', CURRENT_DATE)")
    long countCreatedThisMonth();
}

