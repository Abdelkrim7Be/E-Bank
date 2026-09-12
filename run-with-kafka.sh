#!/usr/bin/env bash

set -e
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

COMPOSE_PROJECT=digital-banking-kafka
echo "=== Starting Kafka (Docker) ==="
docker compose -p "$COMPOSE_PROJECT" -f "$PROJECT_ROOT/docker-compose-kafka.yml" up -d
echo "Waiting for Kafka to be ready..."
sleep 15
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export SPRING_PROFILES_ACTIVE=kafka

echo "=== Building microservices ==="
cd "$PROJECT_ROOT/microservices"
mvn -q clean install -DskipTests
echo ""

echo "=== Building frontend ==="
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build
echo ""

echo "=== Starting services (event-driven with Kafka) ==="
trap 'echo ""; echo "Stopping..."; docker compose -p "'"$COMPOSE_PROJECT"'" -f "'"$PROJECT_ROOT"'/docker-compose-kafka.yml" down 2>/dev/null; kill $(jobs -p) 2>/dev/null; exit' INT TERM EXIT

mkdir -p "$PROJECT_ROOT/logs"
LOG_DIR="$PROJECT_ROOT/logs"

echo "Starting discovery-service..."
(cd "$PROJECT_ROOT/microservices" && mvn -q -pl discovery-service spring-boot:run >> "$LOG_DIR/discovery-service.log" 2>&1) &
DISCOVERY_PID=$!
sleep 25
if ! kill -0 $DISCOVERY_PID 2>/dev/null; then
  echo "Discovery failed. Check $LOG_DIR/discovery-service.log"
  exit 1
fi
echo "Eureka up."

echo "Starting gateway-service..."
(cd "$PROJECT_ROOT/microservices" && mvn -q -pl gateway-service spring-boot:run >> "$LOG_DIR/gateway-service.log" 2>&1) &
sleep 25

for mod in customer-service account-service transaction-service reporting-service; do
  echo "Starting $mod (kafka profile)..."
  (cd "$PROJECT_ROOT/microservices" && mvn -q -pl "$mod" spring-boot:run -Dspring-boot.run.profiles=kafka >> "$LOG_DIR/$mod.log" 2>&1) &
  sleep 8
done

echo "Starting frontend..."
(cd "$PROJECT_ROOT/frontend" && npm run start >> "$LOG_DIR/frontend.log" 2>&1) &
sleep 5

echo ""
echo "  Eureka:  http://localhost:8761"
echo "  Gateway: http://localhost:8080"
echo "  Frontend: http://localhost:4200"
echo "  Kafka:   localhost:9092"
echo ""
wait
