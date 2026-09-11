package com.bellagnech.reporting.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

@JdbcTest
@Import({ProjectionStore.class, ReportingService.class, ObjectMapper.class})
class ReportingServiceTest {
    @Autowired ProjectionStore projections;
    @Autowired ReportingService reports;
    @Autowired JdbcTemplate sql;
    private String account(String id, int version, String balance) {
        return "{\"schemaVersion\":1,\"eventId\":\""+id+"\",\"aggregateId\":\"a\",\"aggregateVersion\":"+version+",\"occurredAt\":\"2026-09-09T00:00:00Z\",\"customerId\":1,\"accountType\":\"CurrentAccount\",\"status\":\"ACTIVATED\",\"balance\":"+balance+"}";
    }
    @Test void snapshotsIgnoreDuplicatesAndOldVersionsAcrossTopics() throws Exception {
        projections.accept("account-balance-updates",account("new",2,"120.25"));
        projections.accept("account-events",account("old",1,"100.00"));
        projections.accept("account-balance-updates",account("new",2,"120.25"));
        assertThat(reports.getDashboardStats().get("totalAccounts")).isEqualTo(1L);
        assertThat((BigDecimal)reports.getDashboardStats().get("totalBalance")).isEqualByComparingTo("120.25");
        assertThat(sql.queryForObject("select count(*) from projection_events",Long.class)).isEqualTo(2);
    }
    @Test void transactionReplayDoesNotDoubleCountAndPeriodIsFilteredLocally() throws Exception {
        String event="{\"schemaVersion\":1,\"eventId\":\"tx1\",\"aggregateId\":\"a\",\"accountId\":\"a\",\"type\":\"CREDIT\",\"amount\":12.25,\"occurredAt\":\""+java.time.Instant.now()+"\"}";
        projections.accept("transaction-events",event); projections.accept("transaction-events",event);
        var summary=(Map<?,?>) reports.getTransactionAnalysisReport(30).get("summary");
        assertThat(summary.get("totalTransactions")).isEqualTo(1L);
        assertThat((BigDecimal)summary.get("totalVolume")).isEqualByComparingTo("12.25");
        assertThatThrownBy(() -> reports.getTransactionAnalysisReport(0)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void invalidSchemaIsRejectedWithoutRecordingSuccess() {
        assertThatThrownBy(() -> projections.accept("account-events","{\"schemaVersion\":99,\"eventId\":\"bad\"}"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThat(sql.queryForObject("select count(*) from projection_events",Long.class)).isZero();
    }
    @Test void reconciliationFlagsAccountsWhoseLedgerDoesNotMatchBalance() throws Exception {
        projections.accept("account-events", account("bal1", 1, "100.00"));
        sql.update("update projected_accounts set id='b1' where id='a'");
        String opening = "{\"schemaVersion\":1,\"eventId\":\"tx1\",\"aggregateId\":\"b1\",\"accountId\":\"b1\",\"type\":\"CREDIT\",\"amount\":60.00,\"occurredAt\":\"2026-09-09T00:00:00Z\"}";
        String topUp = "{\"schemaVersion\":1,\"eventId\":\"tx2\",\"aggregateId\":\"b1\",\"accountId\":\"b1\",\"type\":\"CREDIT\",\"amount\":40.00,\"occurredAt\":\"2026-09-09T00:00:00Z\"}";
        projections.accept("transaction-events", opening);
        projections.accept("transaction-events", topUp);
        var balanced = reports.getReconciliationReport();
        assertThat(balanced.get("status")).isEqualTo("BALANCED");
        assertThat(balanced.get("accountsChecked")).isEqualTo(1L);

        sql.update("update projected_accounts set balance=999.99 where id='b1'");
        var mismatched = reports.getReconciliationReport();
        assertThat(mismatched.get("status")).isEqualTo("MISMATCH");
        assertThat((java.util.List<?>) mismatched.get("mismatches")).hasSize(1);
    }
    @Test void emptyProjectionExplicitlySignalsWaiting() {
        assertThat(reports.getDashboardStats().get("projectionStatus")).isEqualTo("WAITING_FOR_EVENTS");
        assertThat(reports.getDashboardStats().get("projectionUpdatedAt")).isNull();
    }
}
