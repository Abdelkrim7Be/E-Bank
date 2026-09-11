package com.bellagnech.customer.controllers;

import com.bellagnech.customer.clients.AccountServiceClient;
import com.bellagnech.customer.clients.TransactionServiceClient;
import com.bellagnech.customer.entities.Customer;
import com.bellagnech.customer.repositories.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@Slf4j
public class CustomerPortalController {

    private final CustomerRepository customerRepository;
    private final AccountServiceClient accountServiceClient;
    private final TransactionServiceClient transactionServiceClient;

    @GetMapping("/accounts")
    public ResponseEntity<?> getMyAccounts(HttpServletRequest request) {
        String username = getCurrentUsername(request);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Customer customer = customerRepository.findByUser_Username(username).orElse(null);
        if (customer == null) {
            log.warn("No customer found for user: {}", username);
            return ResponseEntity.ok(List.of());
        }
        try {
            List<AccountServiceClient.AccountDTO> accounts = accountServiceClient.getAccountsByCustomerId(customer.getId());
            return ResponseEntity.ok(accounts != null ? accounts : List.of());
        } catch (Exception e) {
            log.error("Failed to fetch accounts for customer {}: {}", customer.getId(), e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<?> getMyAccountById(@PathVariable String accountId, HttpServletRequest request) {
        String username = getCurrentUsername(request);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Customer customer = customerRepository.findByUser_Username(username).orElse(null);
        if (customer == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Customer not found"));
        }
        try {
            List<AccountServiceClient.AccountDTO> myAccounts = accountServiceClient.getAccountsByCustomerId(customer.getId());
            boolean ownsAccount = myAccounts != null && myAccounts.stream()
                    .anyMatch(a -> accountId.equals(a.getId()));
            if (!ownsAccount) {
                return ResponseEntity.status(403).body(Map.of("error", "Account not found or access denied"));
            }
            AccountServiceClient.AccountDTO account = accountServiceClient.getAccount(accountId);
            return account != null ? ResponseEntity.ok(account) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to fetch account {} for customer {}: {}", accountId, customer.getId(), e.getMessage());
            return ResponseEntity.status(404).build();
        }
    }

    @GetMapping("/accounts/summary")
    public ResponseEntity<?> getMyAccountsSummary(HttpServletRequest request) {
        String username = getCurrentUsername(request);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Customer customer = customerRepository.findByUser_Username(username).orElse(null);
        if (customer == null) {
            return ResponseEntity.ok(Map.of(
                    "totalAccounts", 0,
                    "totalBalance", 0.0,
                    "averageBalance", 0.0
            ));
        }
        try {
            List<AccountServiceClient.AccountDTO> accounts = accountServiceClient.getAccountsByCustomerId(customer.getId());
            if (accounts == null || accounts.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "totalAccounts", 0,
                        "totalBalance", 0.0,
                        "averageBalance", 0.0
                ));
            }
            double totalBalance = accounts.stream().mapToDouble(a -> a.getBalance()).sum();
            int count = accounts.size();
            return ResponseEntity.ok(Map.of(
                    "totalAccounts", count,
                    "totalBalance", totalBalance,
                    "averageBalance", count > 0 ? totalBalance / count : 0.0
            ));
        } catch (Exception e) {
            log.error("Failed to fetch accounts summary for customer {}: {}", customer.getId(), e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "totalAccounts", 0,
                    "totalBalance", 0.0,
                    "averageBalance", 0.0
            ));
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getMyDashboard(HttpServletRequest request) {
        String username = getCurrentUsername(request);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Customer customer = customerRepository.findByUser_Username(username).orElse(null);
        if (customer == null) {
            return ResponseEntity.ok(buildDashboardResponse(List.of(), List.of()));
        }
        try {
            List<AccountServiceClient.AccountDTO> accounts = accountServiceClient.getAccountsByCustomerId(customer.getId());
            if (accounts == null) accounts = List.of();
            List<Map<String, Object>> recentTransactions = fetchMergedTransactions(customer.getId(), 0, 5);
            return ResponseEntity.ok(buildDashboardResponse(accounts, recentTransactions));
        } catch (Exception e) {
            log.error("Failed to fetch dashboard for customer {}: {}", customer.getId(), e.getMessage());
            return ResponseEntity.ok(buildDashboardResponse(List.of(), List.of()));
        }
    }

    private Map<String, Object> buildDashboardResponse(List<AccountServiceClient.AccountDTO> accounts, List<Map<String, Object>> recentTransactions) {
        double totalBalance = accounts.stream().mapToDouble(AccountServiceClient.AccountDTO::getBalance).sum();
        int totalAccounts = accounts.size();
        double averageBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0.0;
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalBalance", totalBalance);
        summary.put("totalAccounts", totalAccounts);
        summary.put("averageBalance", averageBalance);
        summary.put("recentTransactionsCount", recentTransactions != null ? recentTransactions.size() : 0);
        Map<String, Object> body = new HashMap<>();
        body.put("accounts", accounts != null ? accounts : List.of());
        body.put("recentTransactions", recentTransactions != null ? recentTransactions : List.of());
        body.put("summary", summary);
        return body;
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getMyTransactions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "accountId", required = false) String accountIdFilter,
            @RequestParam(name = "type", required = false) String typeFilter,
            HttpServletRequest request) {
        if (page < 0 || size < 1 || size > 100) return ResponseEntity.badRequest().body(Map.of("message","Invalid page size"));
        return ResponseEntity.ok(transactionServiceClient.getCustomerHistory(page,size,accountIdFilter,typeFilter));
    }

    private List<Map<String, Object>> fetchMergedTransactions(Long customerId, int page, int size) {
        return fetchMergedTransactions(customerId, page, size, null, null);
    }

    private List<Map<String, Object>> fetchMergedTransactions(Long customerId, int page, int size, String accountIdFilter, String typeFilter) {
        List<AccountServiceClient.AccountDTO> accounts;
        try {
            accounts = accountServiceClient.getAccountsByCustomerId(customerId);
        } catch (Exception e) {
            log.warn("Could not load accounts for customer {}: {}", customerId, e.getMessage());
            return List.of();
        }
        if (accounts == null || accounts.isEmpty()) {
            return List.of();
        }
        List<String> accountIds = accounts.stream()
                .map(AccountServiceClient.AccountDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (accountIdFilter != null && !accountIdFilter.isBlank()) {
            if (!accountIds.contains(accountIdFilter)) return List.of();
            accountIds = List.of(accountIdFilter);
        }

        List<Map<String, Object>> merged = new ArrayList<>();
        for (String accountId : accountIds) {
            try {
                List<TransactionServiceClient.TransactionDTO> list = transactionServiceClient.getAccountTransactions(accountId);
                if (list != null) {
                    for (TransactionServiceClient.TransactionDTO t : list) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", t.getId());
                        map.put("operationDate", t.getOperationDate());
                        map.put("amount", t.getAmount());
                        map.put("description", t.getDescription());
                        String type = t.getType();
                        if ("CREDIT".equalsIgnoreCase(type)) type = "DEPOSIT";
                        else if ("DEBIT".equalsIgnoreCase(type)) type = "WITHDRAWAL";
                        map.put("type", type);
                        map.put("bankAccountId", t.getBankAccountId());
                        map.put("accountId", t.getBankAccountId());
                        map.put("performedBy", t.getPerformedBy());
                        map.put("customerName", t.getCustomerName());
                        map.put("requestId", t.getRequestId());
                        map.put("status", "COMPLETED");
                        merged.add(map);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not load transactions for account {}: {}", accountId, e.getMessage());
            }
        }
        merged.sort((a, b) -> {
            Object d1 = a.get("operationDate");
            Object d2 = b.get("operationDate");
            if (d1 == null && d2 == null) return 0;
            if (d1 == null) return 1;
            if (d2 == null) return -1;
            return ((Date) d2).compareTo((Date) d1);
        });

        if (typeFilter != null && !typeFilter.isBlank()) {
            String upper = typeFilter.toUpperCase();
            merged = merged.stream()
                    .filter(m -> upper.equals(m.get("type")))
                    .collect(Collectors.toList());
        }

        if (size > 0 && page >= 0) {
            int from = page * size;
            int to = Math.min(from + size, merged.size());
            return from < merged.size() ? merged.subList(from, to) : List.of();
        }
        return merged;
    }

    private ResponseEntity<Map<String, Object>> pageResponse(List<Map<String, Object>> content, int totalElements, int page, int size) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        body.put("transactions", content);
        body.put("totalElements", totalElements);
        body.put("totalPages", totalPages);
        body.put("size", size);
        body.put("number", page);
        body.put("currentPage", page);
        body.put("first", page == 0);
        body.put("last", page >= totalPages - 1 || totalPages == 0);
        return ResponseEntity.ok(body);
    }

    private String getCurrentUsername(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        if (request != null) {
            String name = request.getHeader("X-User-Name");
            if (name != null && !name.isBlank()) {
                return name.trim();
            }
        }
        return null;
    }
}
