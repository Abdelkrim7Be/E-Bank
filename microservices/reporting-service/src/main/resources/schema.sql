CREATE TABLE IF NOT EXISTS projection_events (
 event_id VARCHAR(100) PRIMARY KEY, aggregate_id VARCHAR(100) NOT NULL,
 topic VARCHAR(100) NOT NULL, occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
 received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS projected_accounts (
 id VARCHAR(100) PRIMARY KEY, customer_id BIGINT NOT NULL, account_type VARCHAR(40) NOT NULL,
 balance DECIMAL(19,2) NOT NULL, status VARCHAR(40) NOT NULL, version BIGINT NOT NULL,
 initial_balance DECIMAL(19,2)
);
ALTER TABLE projected_accounts ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(19,2);
UPDATE projected_accounts SET initial_balance = balance WHERE initial_balance IS NULL AND version = 1;
CREATE TABLE IF NOT EXISTS projected_customers (
 id BIGINT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), enabled BOOLEAN NOT NULL,
 deleted BOOLEAN NOT NULL, version BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS projected_transactions (
 event_id VARCHAR(100) PRIMARY KEY, account_id VARCHAR(100) NOT NULL,
 type VARCHAR(40) NOT NULL, amount DECIMAL(19,2) NOT NULL,
 occurred_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_projected_transactions_date ON projected_transactions(occurred_at, event_id);
CREATE INDEX IF NOT EXISTS ix_projected_transactions_account ON projected_transactions(account_id, occurred_at);
