package com.bellagnech.reporting.services;

import com.fasterxml.jackson.databind.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@RequiredArgsConstructor
public class ProjectionStore {
    private final JdbcTemplate sql;
    private final ObjectMapper mapper;

    @Transactional
    public void accept(String topic, String json) throws Exception {
        JsonNode e = mapper.reader().with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS).readTree(json);
        if (e.path("schemaVersion").asInt() != 1 || e.path("eventId").asText().isBlank())
            throw new IllegalArgumentException("Unsupported event envelope");
        String id = e.get("eventId").asText();
        if (sql.queryForObject("select count(*) from projection_events where event_id=?", Long.class, id) != 0) return;
        String aggregate = e.path("aggregateId").asText(e.path("accountId").asText());
        var occurred = OffsetDateTime.parse(e.path("occurredAt").asText());
        long version = e.path("aggregateVersion").asLong();
        if (topic.startsWith("account-")) {
            if (!e.hasNonNull("balance") || !e.hasNonNull("customerId") || version < 1)
                throw new IllegalArgumentException("Missing account snapshot");
            var versions = sql.queryForList("select version from projected_accounts where id=?", Long.class, aggregate);
            if (versions.isEmpty()) {
                sql.update("insert into projected_accounts values(?,?,?,?,?,?,?)", aggregate, e.get("customerId").asLong(), e.path("accountType").asText(), e.get("balance").decimalValue(), e.path("status").asText(), version, e.get("balance").decimalValue());
            } else if (version > versions.get(0)) {
                sql.update("update projected_accounts set customer_id=?, account_type=?, balance=?, status=?, version=? where id=?", e.get("customerId").asLong(), e.path("accountType").asText(), e.get("balance").decimalValue(), e.path("status").asText(), version, aggregate);
            }
        } else if (topic.equals("customer-events")) {
            long customer = Long.parseLong(aggregate);
            boolean deleted = e.path("eventType").asText().contains("DELETED");
            var versions = sql.queryForList("select version from projected_customers where id=?", Long.class, customer);
            if (versions.isEmpty()) sql.update("insert into projected_customers values(?,?,?,?,?,?)", customer, e.path("name").asText(), e.path("email").asText(), e.path("enabled").asBoolean(true), deleted, version);
            else if (version > versions.get(0)) sql.update("update projected_customers set name=?, email=?, enabled=?, deleted=?, version=? where id=?", e.path("name").asText(), e.path("email").asText(), e.path("enabled").asBoolean(true), deleted, version, customer);
        } else if (topic.equals("transaction-events")) {
            if (!e.hasNonNull("amount") || e.get("amount").decimalValue().signum() <= 0)
                throw new IllegalArgumentException("Invalid transaction amount");
            sql.update("insert into projected_transactions values(?,?,?,?,?)", id, e.path("accountId").asText(), e.path("type").asText(), e.get("amount").decimalValue(), occurred);
        } else throw new IllegalArgumentException("Unknown projection topic");
        sql.update("insert into projection_events(event_id,aggregate_id,topic,occurred_at) values(?,?,?,?)", id, aggregate, topic, occurred);
    }
}
