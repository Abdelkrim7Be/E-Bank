#!/usr/bin/env python3
"""Bounded read-only load check against a local E-Bank validation stack."""
import argparse
import concurrent.futures
import json
import math
import time
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', required=True)
parser.add_argument('--requests', type=int, default=200)
parser.add_argument('--workers', type=int, default=10)
args = parser.parse_args()
assert 1 <= args.requests <= 1000 and 1 <= args.workers <= 20
req = urllib.request.Request(args.base_url + '/api/auth/login',
    data=json.dumps({'username': 'admin', 'password': 'password'}).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=20) as response:
    token = json.load(response)['token']
paths = ['/api/accounts?size=20', '/api/customers/page?size=20',
         '/api/transactions?page=0&size=20', '/api/reports/dashboard']

def read(index):
    path = paths[index % len(paths)]
    start = time.monotonic()
    try:
        req = urllib.request.Request(args.base_url + path, headers={'Authorization': 'Bearer ' + token})
        with urllib.request.urlopen(req, timeout=20) as response:
            json.load(response)
            status = response.status
    except Exception as error:
        status = getattr(error, 'code', type(error).__name__)
    return path, status, (time.monotonic() - start) * 1000

start = time.monotonic()
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
    results = list(executor.map(read, range(args.requests)))
report = {'requests': args.requests, 'workers': args.workers, 'elapsedSeconds': round(time.monotonic() - start, 2), 'endpoints': {}}
for path in paths:
    rows = [r for r in results if r[0] == path]
    if not rows:
        continue
    times = sorted(r[2] for r in rows)
    report['endpoints'][path] = {'requests': len(rows), 'failures': sum(r[1] != 200 for r in rows),
        'p50Ms': round(times[math.ceil(len(times) * .5) - 1], 1),
        'p95Ms': round(times[math.ceil(len(times) * .95) - 1], 1), 'maxMs': round(max(times), 1)}
print(json.dumps(report, indent=2))
assert all(row[1] == 200 for row in results), 'One or more read requests failed'
