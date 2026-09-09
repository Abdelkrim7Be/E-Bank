package com.bellagnech.reporting.services;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;
import java.util.*;

/** Reports read only the database owned by reporting-service. */
@Service
@RequiredArgsConstructor
public class ReportingService {
    private final JdbcTemplate sql;

    private Map<String,Object> metadata(String type) {
        var result = new LinkedHashMap<String,Object>();
        result.put("reportType", type); result.put("generatedDate", Instant.now());
        var updated = sql.queryForObject("select max(received_at) from projection_events", OffsetDateTime.class);
        result.put("projectionUpdatedAt", updated);
        result.put("projectionStatus", updated == null ? "WAITING_FOR_EVENTS" : "EVENTUALLY_CONSISTENT");
        return result;
    }
    private long count(String query) { return sql.queryForObject(query, Long.class); }

    public Map<String,Object> getDashboardStats() {
        var result = metadata("Dashboard");
        result.put("totalCustomers", count("select count(*) from projected_customers where deleted=false"));
        result.put("activeCustomers", count("select count(*) from projected_customers where deleted=false and enabled=true"));
        result.put("totalAccounts", count("select count(*) from projected_accounts"));
        result.put("totalTransactions", count("select count(*) from projected_transactions"));
        result.put("currentAccounts", count("select count(*) from projected_accounts where account_type='CurrentAccount'"));
        result.put("savingAccounts", count("select count(*) from projected_accounts where account_type='SavingAccount'"));
        result.put("totalBalance", sql.queryForObject("select coalesce(sum(balance),0) from projected_accounts", BigDecimal.class));
        result.put("averageBalance", sql.queryForObject("select coalesce(avg(balance),0) from projected_accounts", BigDecimal.class));
        return result;
    }

    public Map<String,Object> getCustomerSummaryReport() {
        var result = metadata("Customer Summary");
        var rows = sql.query("""
            select c.id,c.name,c.email,count(a.id) accounts,coalesce(sum(a.balance),0) balance,
              coalesce(sum(t.total),0) transactions
            from projected_customers c left join projected_accounts a on a.customer_id=c.id
            left join (select account_id,count(*) total from projected_transactions group by account_id) t on t.account_id=a.id
            where c.deleted=false group by c.id,c.name,c.email order by c.id limit 10000
            """, (rs,n) -> Map.<String,Object>of("id",rs.getLong("id"),"name",rs.getString("name"),
                "email",rs.getString("email"),"totalAccounts",rs.getLong("accounts"),
                "totalBalance",rs.getBigDecimal("balance"),"transactionCount",rs.getLong("transactions")));
        result.put("customers", rows); result.put("totalCustomers", count("select count(*) from projected_customers where deleted=false"));
        result.put("exportLimit", 10000);
        return result;
    }

    public Map<String,Object> getAccountBalanceReport() {
        var result = metadata("Account Balance Analysis");
        Map<String,Long> distribution = new LinkedHashMap<>();
        Map<String,BigDecimal> balances = new LinkedHashMap<>();
        sql.query("select account_type,count(*) total,sum(balance) balance from projected_accounts group by account_type", rs -> {
            distribution.put(rs.getString("account_type"), rs.getLong("total"));
            balances.put(rs.getString("account_type"), rs.getBigDecimal("balance"));
        });
        result.put("accountTypeDistribution", distribution); result.put("balanceByType", balances);
        var summary = sql.queryForMap("select coalesce(sum(balance),0) total,coalesce(avg(balance),0) average,coalesce(max(balance),0) maximum,coalesce(min(balance),0) minimum from projected_accounts");
        result.put("summary", Map.of("totalBalance",summary.get("total"),"averageBalance",summary.get("average"),"maxBalance",summary.get("maximum"),"minBalance",summary.get("minimum")));
        Map<String,Long> ranges = new LinkedHashMap<>();
        sql.query("""
            select case when balance<=1000 then '0-1000' when balance<=5000 then '1000-5000'
            when balance<=10000 then '5000-10000' when balance<=50000 then '10000-50000' else '50000+' end bucket,
            count(*) total from projected_accounts group by bucket
            """, rs -> { ranges.put(rs.getString("bucket"), rs.getLong("total")); });
        result.put("balanceRanges",ranges);
        return result;
    }

    public Map<String,Object> getTransactionAnalysisReport(int days) {
        if (days < 1 || days > 3650) throw new IllegalArgumentException("Days must be between 1 and 3650");
        var result = metadata("Transaction Analysis");
        Map<String,Long> counts = new LinkedHashMap<>();
        Map<String,BigDecimal> volumes = new LinkedHashMap<>();
        sql.query("select type,count(*) total,sum(amount) volume from projected_transactions where occurred_at>=? group by type", rs -> {
            counts.put(rs.getString("type"), rs.getLong("total")); volumes.put(rs.getString("type"),rs.getBigDecimal("volume"));
        }, OffsetDateTime.now(ZoneOffset.UTC).minusDays(days));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        BigDecimal volume = volumes.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        result.put("periodDays",days); result.put("transactionsByType",counts); result.put("volumeByType",volumes);
        result.put("summary",Map.of("totalTransactions",total,"totalVolume",volume,
            "averageAmount",total==0 ? BigDecimal.ZERO : volume.divide(BigDecimal.valueOf(total),2,RoundingMode.HALF_EVEN)));
        return result;
    }
    public Map<String,Object> getTransactionsSummary() {
        var report = getTransactionAnalysisReport(3650);
        @SuppressWarnings("unchecked") var summary = (Map<String,Object>) report.get("summary");
        var result = new LinkedHashMap<>(summary);
        result.put("transactionsByType", report.get("transactionsByType"));
        result.put("projectionUpdatedAt",report.get("projectionUpdatedAt"));
        result.put("projectionStatus",report.get("projectionStatus"));
        return result;
    }
}
