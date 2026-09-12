#!/usr/bin/env python3
"""Check a pristine demo's ownership, balances, history and Kafka projections through its API."""
import argparse
import json
import time
import urllib.request
from collections import defaultdict
from decimal import Decimal


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:4200')
    args = parser.parse_args()
    token = None

    def request(path, data=None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        req = urllib.request.Request(args.base_url.rstrip('/') + '/api/' + path,
                                     data=None if data is None else json.dumps(data).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response, parse_float=Decimal)

    token = request('auth/login', {'username': 'admin', 'password': 'password'})['token']
    customers = request('customers')
    accounts = request('accounts?size=100')
    customer_ids = {customer['id'] for customer in customers}
    assert len(customers) == 50, 'Expected 50 fictional customers'
    assert len(accounts) == 50, 'Expected 50 demo accounts'
    assert all(account['customerId'] in customer_ids for account in accounts), 'Orphan account'
    balances = defaultdict(lambda: Decimal('0.00'))
    months = set()
    page = 0
    count = 0
    while True:
        history = request(f'transactions?page={page}&size=100')
        for operation in history['content']:
            amount = Decimal(str(operation['amount']))
            balances[operation['bankAccountId']] += amount if operation['type'] == 'CREDIT' else -amount
            months.add(operation['operationDate'][:7])
            count += 1
        if history['last']:
            break
        page += 1
    assert count == 1100, f'Expected 1100 operations; found {count}'
    assert len(months) >= 6, 'History must span six months'
    for account in accounts:
        assert balances[account['id']] == account['balance'], f'Unreconciled account: {account["id"]}'
    total = sum(balances.values())
    deadline = time.monotonic() + 120
    while True:
        stats = request('reports/dashboard')
        if (stats['totalCustomers'], stats['totalAccounts'], stats['totalTransactions'], stats['totalBalance'],
                stats['currentAccounts'], stats['savingAccounts']) == (50, 50, 1100, total, 25, 25):
            break
        assert time.monotonic() < deadline, 'Kafka reporting did not converge'
        time.sleep(2)
    print(f'PASS: 50 customers, 50 reconciled accounts, {count} operations across {len(months)} calendar months')
    print(f'PASS: Kafka projections match the source services; total balance EUR {total}')


if __name__ == '__main__':
    main()
