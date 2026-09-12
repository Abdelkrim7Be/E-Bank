# Kafka and microservices review: 2026-09-11

This review is based on the repository and the local `e-bank-validation` stack.
Recommendations below are follow-up work; they are not claimed as implemented.

## Fixed in this pass

Customer status changes and bulk deletions now append domain events through the
existing transactional outbox. Previously these paths changed the customer database
without updating reporting. Integration tests cover versioned disabled snapshots,
delete events, and atomic rollback of customer, identity, and outbox creation.

## Priorities

| Priority | Observed implementation | Recommended next step |
| --- | --- | --- |
| 1 | Each service uses its own file-backed H2 database. | Move to a separately owned PostgreSQL database/schema per service, with versioned migrations and restore tests, before running multiple application replicas. |
| 1 | Outbox relays lock a batch and synchronously wait up to five seconds per Kafka send, within the database transaction. | Measure backlog age and lock waits. With PostgreSQL, evaluate CDC through Debezium or a bounded claim/lease relay. Preserve aggregate order and consumer deduplication during crashes and retries. |
| 1 | Local topics have one partition and replication factor one. | Provision topics explicitly for the target workload; a production cluster needs broker redundancy and an intentional minimum in-sync replica policy. Keep DLT partition counts aligned with source topics. Do not change existing partition counts casually: account key placement and ordering must be considered. |
| 1 | Reporting uses one listener thread; projection updates first read a version and then write. | Before increasing concurrency or replicas, make version updates conditional and concurrency-safe in SQL, and test concurrent duplicates and out-of-order delivery. Retain the event-id uniqueness constraint. |
| 2 | The relay deletes delivered events, while projection event IDs accumulate indefinitely. | Define replay and deduplication retention together. Add outbox count/oldest-age, consumer lag, DLT count, and projection freshness alerts, with a reviewed replay procedure. |
| 2 | Transaction history enriches each distinct account through remote account/customer calls. | Use a reporting projection or a batched enrichment endpoint for list views. The current per-request cache avoids repeated calls for the same account, but a page of different accounts still causes remote fan-out. |
| 2 | Admin customer lists return full arrays and the frontend calculates pagination metadata. | Move search/filter/sort/pagination to a single server-side contract and bound exports. |
| 2 | Gateway audit events are sent directly to Kafka. | Decide whether audit is best-effort telemetry or a durable business requirement; use durable storage/outbox if loss is unacceptable. |
| 3 | Production frontend build still exceeds the 500 kB warning budget. | Measure bundle contents, trim Bootstrap/icon usage and convert self-hosted fonts to WOFF2. Keep route lazy loading and avoid raising the budget to hide growth. |

Keep account balance mutation synchronous and atomic inside account-service. Kafka
is useful for reporting and downstream integration; changing transfers to async
commands would introduce pending/failed/compensating states that the current UX and
API contracts do not support.

## Local measurement

A bounded read check on 2026-09-11 completed 200 requests across four endpoints
with ten workers and zero failures in 2.26 seconds. Per-endpoint p95 was 519.5 ms
for accounts, 129.8 ms for paginated customers, 113.9 ms for transaction history,
and 26.7 ms for dashboard reports. These are local observations, not a capacity
forecast. Raw results: [api-load.json](../testing/evidence/api-load.json).

`AccountService.bankAccountList()` calls `findAll()` and then remotely enriches
customer names. The `size=20` query does not bound that endpoint. Inference from
this code and measurement: prioritize a paginated accounts contract and batched
customer enrichment before adding more service instances.

## Supporting references

- [Debezium outbox event router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html): CDC publishing and aggregate-id message keys.
- [Kafka 3.6 producer configuration](https://kafka.apache.org/36/configuration/producer-configs/): idempotent producer constraints (`acks=all`, retries, maximum in-flight requests). Producer idempotence does not remove the need to deduplicate application/outbox replays.
- [Spring Kafka error handling](https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html): retry recovery, dead-letter routing, and send-result handling.

The recovery checks exercise a single-broker outage and reporting restart. They do
not measure production capacity or multi-broker failover.
