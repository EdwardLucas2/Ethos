#!/bin/bash
# Ensures the backend API is running on port 8080.
# Outputs "already-running", "started:<pid>", or "error:<message>" (on stderr + exit 1).
set -e

MONOREPO_DIR="$(cd "$(dirname "$0")/../../../.." && pwd)"
BACKEND_DIR="$MONOREPO_DIR/backend"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

source "$SCRIPT_DIR/wait-for-service.sh"

wait_for_service \
    "curl -sf http://localhost:8080/health" \
    "cd '$BACKEND_DIR' && ./run-dev.sh --docker" \
    "/tmp/backend-fe-dev.log" \
    3 \
    120
