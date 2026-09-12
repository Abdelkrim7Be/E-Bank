#!/usr/bin/env python3
"""Exercise the local demo's durable outbox and reporting restart recovery.

Usage: python3 scripts/verify-kafka-recovery.py --project e-bank-validation \
    --base-url http://127.0.0.1:34200
Adds 0.37 to demo account ACC-CA-001. Pauses this project's broker temporarily.
"""
import argparse
import json
import subprocess
import time
import urllib.request
import uuid
from decimal import Decimal


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True)
    parser.add_argument('--base-url', required=True)
    args = parser.parse_args()
    token = None

    def request(path, data=None, key=None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        if key:
            headers['Idempotency-Key'] = key
        req = urllib.request.Request(args.base_url + '/api/' + path,
                                     data=None if data is None else json.dumps(data).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.load(response, parse_float=Decimal)

    def container(service):
        result = subprocess.check_output(['docker', 'ps', '-q', '--filter',
            'label=com.docker.compose.project=' + args.project, '--filter',
            'label=com.docker.compose.service=' + service], text=True).split()
        assert len(result) == 1, f'Expected one running {service} container'
        return result[0]

    def wait_for(check, description):
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            try:
                value = check()
                if value:
                    return value
            except (OSError, ValueError):
                pass  # The reporting service is briefly unreachable during restart.
            time.sleep(2)
        raise AssertionError('Timed out: ' + description)

    broker, reporting = container('kafka'), container('reporting-service')
    token = request('auth/login', {'username': 'admin', 'password': 'password'})['token']
    stats = lambda: request('reports/dashboard')
    # Require a caught-up projection before measuring outage behavior.
    accounts = request('accounts?size=100')
    rows = accounts['content'] if isinstance(accounts, dict) else accounts
    balance = sum((Decimal(str(a['balance'])) for a in rows), Decimal(0))
    customers = request('customers')
    wait_for(lambda: stats()['totalBalance'] == balance and
             stats()['totalAccounts'] == len(rows) and
             stats()['totalCustomers'] == len(customers), 'initial projection convergence')
    before = stats()
    account_before = request('accounts/ACC-CA-001')['balance']
    key = str(uuid.uuid4())
    data = {'accountId': 'ACC-CA-001', 'amount': 0.37, 'description': 'Kafka recovery validation'}
    subprocess.run(['docker', 'pause', broker], check=True, stdout=subprocess.DEVNULL)
    try:
        receipt = request('transactions/credit', data, key)
        assert receipt['status'] == 'COMPLETED'
        assert request('accounts/ACC-CA-001')['balance'] == account_before + Decimal('0.37')
        assert stats()['totalBalance'] == before['totalBalance'], 'Projection changed while broker was paused'
        print('PASS: money command committed while Kafka was paused', flush=True)
    finally:
        subprocess.run(['docker', 'unpause', broker], check=True, stdout=subprocess.DEVNULL)
    expected = before['totalBalance'] + Decimal('0.37')
    wait_for(lambda: stats()['totalBalance'] == expected and
             stats()['totalTransactions'] == before['totalTransactions'] + 1, 'outbox delivery after broker recovery')
    assert request('transactions/credit', data, key) == receipt
    print('PASS: outbox delivery recovered and retry returned the same receipt', flush=True)
    subprocess.run(['docker', 'restart', reporting], check=True, stdout=subprocess.DEVNULL)
    wait_for(lambda: stats()['totalBalance'] == expected and
             stats()['totalTransactions'] == before['totalTransactions'] + 1, 'persistent projection after restart')
    print('PASS: reporting restart preserved balances and transaction counts', flush=True)


if __name__ == '__main__':
    main()
