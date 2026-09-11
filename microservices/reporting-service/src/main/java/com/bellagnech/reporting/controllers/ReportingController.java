package com.bellagnech.reporting.controllers;

import com.bellagnech.reporting.services.ReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        log.info("Dashboard statistics requested");
        return ResponseEntity.ok(reportingService.getDashboardStats());
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStatsForAdmin() {
        log.info("Dashboard stats requested (admin widget)");
        return ResponseEntity.ok(reportingService.getDashboardStats());
    }

    @GetMapping("/dashboard/transactions-summary")
    public ResponseEntity<Map<String, Object>> getDashboardTransactionsSummary() {
        log.info("Dashboard transactions summary requested");
        return ResponseEntity.ok(reportingService.getTransactionsSummary());
    }

    @GetMapping("/customer-summary")
    public ResponseEntity<Map<String, Object>> getCustomerSummaryReport() {
        log.info("Customer summary report requested");
        return ResponseEntity.ok(reportingService.getCustomerSummaryReport());
    }

    @GetMapping("/account-balance")
    public ResponseEntity<Map<String, Object>> getAccountBalanceReport() {
        log.info("Account balance report requested");
        return ResponseEntity.ok(reportingService.getAccountBalanceReport());
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<Map<String, Object>> getReconciliationReport() {
        log.info("Ledger reconciliation report requested");
        return ResponseEntity.ok(reportingService.getReconciliationReport());
    }

    @GetMapping("/transaction-analysis")
    public ResponseEntity<Map<String, Object>> getTransactionAnalysisReport(
            @RequestParam(defaultValue = "30") int days) {
        log.info("Transaction analysis report requested for {} days", days);
        return ResponseEntity.ok(reportingService.getTransactionAnalysisReport(days));
    }
}

