#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"
COMPOSE_PROJECT="digital-banking-kafka-demo"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

cleanup() {
  echo ""
  echo "Stopping demo processes..."
  docker compose -p "$COMPOSE_PROJECT" -f "$PROJECT_ROOT/docker-compose-kafka.yml" down >/dev/null 2>&1 || true
  kill $(jobs -p) >/dev/null 2>&1 || true
}
trap cleanup INT TERM EXIT

wait_http() {
  local url="$1"
  local max_attempts="${2:-60}"
  local sleep_s="${3:-2}"
  local attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
    attempt=$((attempt + 1))
  done
  return 1
}

echo "=== Starting Kafka ==="
docker compose -p "$COMPOSE_PROJECT" -f "$PROJECT_ROOT/docker-compose-kafka.yml" up -d
sleep 12

export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export SPRING_PROFILES_ACTIVE=kafka

echo "=== Building required services ==="
cd "$PROJECT_ROOT/microservices"
mvn -q -pl discovery-service,customer-service,account-service,transaction-service,reporting-service -am -DskipTests compile

echo "=== Starting discovery-service ==="
(cd "$PROJECT_ROOT/microservices" && mvn -q -pl discovery-service spring-boot:run >> "$LOG_DIR/discovery-service.log" 2>&1) &
wait_http "http://localhost:8761/actuator/health" 80 2 || {
  echo "discovery-service did not become healthy. Check logs/discovery-service.log"
  exit 1
}

for mod in customer-service account-service transaction-service reporting-service; do
  echo "=== Starting $mod (kafka profile) ==="
  (cd "$PROJECT_ROOT/microservices" && mvn -q -pl "$mod" spring-boot:run -Dspring-boot.run.profiles=kafka >> "$LOG_DIR/$mod.log" 2>&1) &
done

wait_http "http://localhost:8081/actuator/health" 80 2 || {
  echo "customer-service did not become healthy. Check logs/customer-service.log"
  exit 1
}
wait_http "http://localhost:8082/actuator/health" 80 2 || {
  echo "account-service did not become healthy. Check logs/account-service.log"
  exit 1
}
wait_http "http://localhost:8083/actuator/health" 80 2 || {
  echo "transaction-service did not become healthy. Check logs/transaction-service.log"
  exit 1
}
wait_http "http://localhost:8084/actuator/health" 80 2 || {
  echo "reporting-service did not become healthy. Check logs/reporting-service.log"
  exit 1
}

echo ""
echo "All services are up for Postman testing:"
echo "  customer-service:    http://localhost:8081"
echo "  account-service:     http://localhost:8082"
echo "  transaction-service: http://localhost:8083"
echo "  reporting-service:   http://localhost:8084"
echo "  eureka:              http://localhost:8761"
echo "  kafka:               localhost:9092"
echo ""
echo "Use Postman to execute your flow now."
echo "Press Ctrl+C to stop everything."
wait
