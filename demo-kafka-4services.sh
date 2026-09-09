#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")"
exec ./demo-kafka-3services.sh
