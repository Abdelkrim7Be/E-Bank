#!/usr/bin/env python3
"""Generate reproducible demo fixtures whose histories reconcile to account balances."""
import argparse
import csv
import io
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'microservices'


def fixtures():
    operations = []
    balances = defaultdict(lambda: Decimal('0.00'))

    def operation(account, kind, amount, days, description, reference):
        value = Decimal(str(amount)).quantize(Decimal('0.01'))
        balances[account] += value if kind == 'CREDIT' else -value
        assert balances[account] >= 0, account
        operations.append([account, kind, str(value), days, description, reference])

    for customer in range(1, 26):
        current, savings = f'ACC-CA-{customer:03}', f'SA_{customer:03}'
        operation(current, 'CREDIT', 1200 + customer * 85, 181, 'Opening deposit', f'opening-{current}')
        operation(savings, 'CREDIT', 2500 + customer * 170, 181, 'Opening savings deposit', f'opening-{savings}')
        for month in range(6):
            day = (5 - month) * 30
            reference = f'demo-savings-{customer:03}-{month}'
            operation(current, 'CREDIT', 2100 + customer * 45, day + 28, 'Monthly salary - Atelier Demo', f'salary-{customer}-{month}')
            operation(current, 'DEBIT', 720 + customer * 8, day + 25, 'Monthly rent', f'rent-{customer}-{month}')
            operation(current, 'DEBIT', Decimal('89.40') + customer, day + 20, 'Electricity and internet', f'bills-{customer}-{month}')
            operation(current, 'DEBIT', Decimal('145.65') + customer * 2 + month * 3, day + 12, 'Groceries - Marche Demo', f'groceries-{customer}-{month}')
            operation(current, 'DEBIT', '12.99', day + 7, 'Music subscription', f'music-{customer}-{month}')
            operation(current, 'DEBIT', 200 + customer * 5, day + 1, f'Savings transfer to {savings}', reference)
            operation(savings, 'CREDIT', 200 + customer * 5, day + 1, f'Savings transfer from {current}', reference)
    accounts = []
    for customer in range(1, 26):
        for account, kind, overdraft, interest in [(f'ACC-CA-{customer:03}', 'CurrentAccount', '500.00', '0'), (f'SA_{customer:03}', 'SavingAccount', '0.00', '2.5')]:
            accounts.append([account, customer, kind, str(balances[account]), overdraft, interest])
    return {
        'account-service/src/main/resources/demo/accounts.csv': (['id', 'customerId', 'type', 'balance', 'overdraft', 'interestRate'], accounts),
        'transaction-service/src/main/resources/demo/operations.csv': (['accountId', 'type', 'amount', 'daysAgo', 'description', 'reference'], operations),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for name, (header, rows) in fixtures().items():
        output = io.StringIO(newline='')
        writer = csv.writer(output, lineterminator='\n')
        writer.writerow(header)
        writer.writerows(rows)
        path = ROOT / name
        if args.check:
            assert path.read_text() == output.getvalue(), f'Regenerate {name}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(output.getvalue())
        print(f'{len(rows)} rows: {name}')


if __name__ == '__main__':
    main()
