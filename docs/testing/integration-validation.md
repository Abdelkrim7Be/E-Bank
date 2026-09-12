# E-Bank integration validation

Run commands from the repository root unless otherwise indicated. Use an isolated
Compose project for tests: the browser suite changes demo balances and the recovery
check temporarily pauses Kafka and restarts reporting.

## Start the validation stack

```bash
export FRONTEND_PORT=34200 GATEWAY_PORT=38080 CUSTOMER_PORT=38081
export ACCOUNT_PORT=38082 TRANSACTION_PORT=38083 REPORTING_PORT=38084
export DISCOVERY_PORT=38761 KAFKA_PORT=39092 KAFKA_UI_PORT=39090 ZOOKEEPER_PORT=32181
docker compose -p e-bank-validation up -d --build --wait
```

Visit http://127.0.0.1:34200. Login shortcuts use the local demo credentials.
After service recreation, Eureka and gateway caches can take about a minute to
converge even when individual health checks pass. Wait for account and transaction
pages to load before starting the suite.

## Automated checks

```bash
mvn -B -f microservices/pom.xml test
cd frontend
npm ci
npx playwright install chromium
E2E_BASE_URL=http://127.0.0.1:34200 npm run test:e2e
cd ..
python3 scripts/verify-kafka-recovery.py --project e-bank-validation --base-url http://127.0.0.1:34200
```

The Playwright suite runs on desktop and mobile Chromium. It covers authentication,
route rendering and overflow, login accessibility, report generation/download,
customer/admin separation, a persisted credit, transfer review and confirmation,
concurrent replay of the completed transfer, conflicting retries, and invalid
destinations. Screenshots and traces are under `frontend/test-results/`; the HTML
report is under `frontend/playwright-report/`.

The recovery check adds 0.37 to `ACC-CA-001`. It verifies the credit commits while
Kafka is paused, reporting catches up after Kafka resumes, a replay returns the
same receipt, and a reporting restart retains the projection. Run it without other
clients modifying accounts so its exact balance/count comparisons remain valid.
The script always attempts to unpause the broker when leaving its outage check.

## Scope

These checks do not establish production readiness or exhaustive control coverage.
The application uses H2 and demo credentials. No production load benchmark or
multi-broker Kafka failover is covered. Route screenshots establish rendering;
only explicitly asserted interactions establish functional behavior.

## Validation result: 2026-09-10

Validated against the retained `e-bank-validation` volumes at port 34200:

- Backend reactor: 16 tests passed. After normalizing receipt timestamps to
  database microsecond precision, all 6 transaction tests passed again, including
  equality of newly prepared/persisted requests and completed/replayed receipts.
- Desktop/mobile browser suite: 18 checks passed in the full rerun; the 2 transfer
  checks then passed against the rebuilt transaction service. These assert exact
  receipt equality for concurrent replays, conflicting retries, and balances.
  The full-run HTML report retains the two pre-fix failures; transfer rerun
  artifacts are under `frontend/test-results/transfer-rerun/`.
- Same-origin login through Nginx returned HTTP 200. Reporting matched the retained
  50 customers and 50 accounts.
- Kafka recovery: credit committed during the pause, delivery caught up after
  resume, retry returned the same receipt, and reporting restart preserved the
  balance and transaction count. Kafka was left unpaused.
- Frontend container build passed with warnings about the initial bundle size
  and skipped CSS selectors. All application service health checks passed.

## Extended validation: 2026-09-11

The [navbar and E2E review](navbar-e2e-review.md) records the expanded 40-check
desktop/mobile suite, 20 backend tests, Kafka recovery/DLT checks, and a 200-request
concurrent API check. All passed. See the [scaling review](../architecture/scaling-review.md)
for measured bottlenecks and prioritized Kafka/microservices follow-up work.
