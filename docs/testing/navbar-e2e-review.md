# Navbar and E2E review: 2026-09-11

Target: isolated Compose project `e-bank-validation`, http://127.0.0.1:34200.
Existing workspace edits and retained data were preserved. Tests add small demo
transactions and uniquely named test customers.

## Changes and reproduced issues

| Issue | Fix | Evidence / regression |
| --- | --- | --- |
| Navbar visually dominated by solid brand/profile blocks | Lighter surface, normal-weight links, distinct SVG E mark, active underline and responsive spacing | `evidence/navbar-before.png`; final desktop/mobile captures below |
| Mobile menu stayed open when selecting the current route | Close menu on link activation, including same-route navigation | Both role-specific navigation tests, desktop and mobile |
| Activated accounts counted as zero | Recognize backend `ACTIVATED` status | Dashboard count compared with the real accounts API |
| Failed account requests silently showed invented demo balances | Remove fallback data; show error and retry, hide balance summaries during failure | Browser fault-injection and successful retry test |
| Chart grew to thousands of pixels in height | Bound responsive canvas to a 300 px container | Painted canvas and desktop/mobile height regression |
| Spending chart contained fixed categories and amounts | Group actual latest-five transaction amounts; show empty/unavailable states | Real API-backed dashboard; no fabricated categories |
| Admin-created customers could not log in | Persist a linked customer-role identity and encoded chosen password in the customer transaction; password is write-only | Create via UI, log out, log in as new customer; backend rollback/serialization tests |
| New customer history failed JSON serialization | Return an empty page with explicit pagination | Empty history response asserted after customer creation |
| Transfer description lost in receipt/history | Preserve submitted note in both transfer legs and widen history description column | History regression; backend assertions |
| Simultaneous first submissions repeated history/events | Refresh the locked payment record before checking completion; disable transaction-service Open EntityManager in View | Eight concurrent requests must return identical receipts, change balance once, and create one history row; stale-entity backend regression |
| Customer status and bulk deletion skipped Kafka | Append versioned snapshots/delete events through the existing outbox | Live reporting convergence and transactional outbox tests |

The pre-fix race changed completion timestamps and repeated bookkeeping. The account
service's operation receipt prevented duplicate balance mutation. Earlier test-created
duplicate history was retained; no historical ledger cleanup was attempted.

## Validation

The suite uses actual
services through Nginx and the gateway. Only the dashboard outage test intercepts a
request deliberately. Desktop and mobile projects both use Chromium.

Commands:

```bash
mvn -B -f microservices/pom.xml test
cd frontend
E2E_BASE_URL=http://127.0.0.1:34200 npm run test:e2e
cd ..
python3 scripts/verify-kafka-dlt.py --project e-bank-validation
python3 scripts/verify-kafka-recovery.py --project e-bank-validation --base-url http://127.0.0.1:34200
python3 scripts/verify-api-load.py --base-url http://127.0.0.1:34200
```

Wait for gateway login, account reads and transaction reads after recreating services;
container health alone precedes Eureka route convergence. One intermediate run began
too soon and failed two login tests during this window. Its other failures reproduced
the mobile menu, transfer-note and concurrent-first-submission bugs fixed here.

Screenshots, traces and the full HTML report from the latest suite live in
`frontend/test-results/` and `frontend/playwright-report/`. Intermediate failure
summaries are retained in `docs/testing/evidence/`.

## Results

- **40/40 desktop and mobile browser checks passed** in 1.7 minutes, with retries
  disabled. [Final test log](evidence/e2e-final.log). After the final chart sizing fix,
  all four affected desktop/mobile dashboard checks passed again, including painted
  canvas and bounded height assertions. [Focused rerun](evidence/chart-final.log).

- Backend: full reactor passed with 19 tests; after the payment race regression was
  added, all seven transaction-service tests passed. This covers 20 distinct backend
  tests across customer (3), account (6), transaction (7), and reporting (4).
- Production frontend and changed service container builds passed. Initial bundle:
  691.13 kB against a 500 kB warning budget; existing Bootstrap selector warnings remain.
- Kafka recovery: credit committed with the broker paused, outbox delivery caught up
  after resume, retries returned the same receipt, and reporting restart preserved
  balances and transaction counts. [Recovery log](evidence/kafka-recovery-final.log).
- Dead-letter handling: an unsupported envelope reached `customer-events.DLT`.
- Bounded API load: **200/200 successful reads**, ten workers, 2.26 seconds total.
  [Per-endpoint latency results](evidence/api-load.json).

[Desktop navbar](evidence/dashboard-final.png) · [Mobile navbar](evidence/navbar-mobile-sept11.png)

## Limits and next steps

This is local integration/functional testing, plus a small bounded load check. It
is not a production capacity or multi-broker failover certification. The frontend
build retains a 500 kB initial-bundle warning and Bootstrap selector warnings.
See [the Kafka and microservices review](../architecture/scaling-review.md) for
prioritized follow-up work and supporting documentation.
