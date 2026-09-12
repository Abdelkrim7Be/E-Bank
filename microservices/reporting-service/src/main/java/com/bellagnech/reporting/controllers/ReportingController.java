package com.bellagnech.reporting.controllers;

import com.bellagnech.reporting.security.ApiIdentity;
import com.bellagnech.reporting.services.ReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        ApiIdentity.current().requireAdmin();
        log.info("Dashboard statistics requested");
        return ResponseEntity.ok(reportingService.getDashboardStats());
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStatsForAdmin() {
        ApiIdentity.current().requireAdmin();
        log.info("Dashboard stats requested (admin widget)");
        return ResponseEntity.ok(reportingService.getDashboardStats());
    }

    @GetMapping("/dashboard/transactions-summary")
    public ResponseEntity<Map<String, Object>> getDashboardTransactionsSummary() {
        ApiIdentity.current().requireAdmin();
        log.info("Dashboard transactions summary requested");
        return ResponseEntity.ok(reportingService.getTransactionsSummary());
    }

    @GetMapping("/customer-summary")
    public ResponseEntity<Map<String, Object>> getCustomerSummaryReport() {
        ApiIdentity.current().requireAdmin();
        log.info("Customer summary report requested");
        return ResponseEntity.ok(reportingService.getCustomerSummaryReport());
    }

    @GetMapping("/account-balance")
    public ResponseEntity<Map<String, Object>> getAccountBalanceReport() {
        ApiIdentity.current().requireAdmin();
        log.info("Account balance report requested");
        return ResponseEntity.ok(reportingService.getAccountBalanceReport());
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<Map<String, Object>> getReconciliationReport() {
        ApiIdentity.current().requireAdmin();
        log.info("Ledger reconciliation report requested");
        return ResponseEntity.ok(reportingService.getReconciliationReport());
    }

    @GetMapping("/transaction-analysis")
    public ResponseEntity<Map<String, Object>> getTransactionAnalysisReport(
            @RequestParam(defaultValue = "30") int days) {
        ApiIdentity.current().requireAdmin();
        log.info("Transaction analysis report requested for {} days", days);
        return ResponseEntity.ok(reportingService.getTransactionAnalysisReport(days));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity(
            @RequestParam(required = false) Instant since) {
        var identity = ApiIdentity.current();
        if (identity.customerId() == null) throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Activity feed is customer-scoped");
        Instant cutoff = since == null ? Instant.now().minusSeconds(300) : since;
        return ResponseEntity.ok(reportingService.getRecentActivity(identity.customerId(), cutoff));
    }
}

