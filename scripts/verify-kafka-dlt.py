#!/usr/bin/env python3
"""Send an invalid envelope to the isolated demo and verify dead-letter delivery."""
import argparse
import json
import subprocess
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--project', required=True)
args = parser.parse_args()
containers = subprocess.check_output(['docker', 'ps', '-q', '--filter',
    'label=com.docker.compose.project=' + args.project, '--filter',
    'label=com.docker.compose.service=kafka'], text=True).split()
assert len(containers) == 1, 'Expected one running Kafka container'
broker = containers[0]
marker = 'e2e-invalid-' + str(uuid.uuid4())
payload = json.dumps({'eventId': marker, 'schemaVersion': -1})
subprocess.run(['docker', 'exec', '-i', broker, 'kafka-console-producer',
    '--bootstrap-server', 'localhost:9092', '--topic', 'customer-events'],
    input=payload + '\n', text=True, check=True, timeout=30, capture_output=True)
result = subprocess.run(['docker', 'exec', broker, 'kafka-console-consumer',
    '--bootstrap-server', 'localhost:9092', '--topic', 'customer-events.DLT',
    '--from-beginning', '--timeout-ms', '20000'], text=True, capture_output=True, timeout=45)
# The console consumer may exit nonzero after its idle timeout. Inspect the actual record.
assert any(json.loads(line).get('eventId') == marker for line in result.stdout.splitlines() if line.startswith('{')), result.stderr
print('PASS: unsupported event envelope arrived on customer-events.DLT')
