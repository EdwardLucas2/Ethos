#!/bin/bash
# Ensures Storybook is running on port 6006.
# Outputs "already-running", "started:<pid>", or "error:<message>" (on stderr + exit 1).
set -e

APP_DIR="$(dirname "$0")/../../../../app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

source "$SCRIPT_DIR/wait-for-service.sh"

wait_for_service \
    "curl -sf http://localhost:6006" \
    "cd '$APP_DIR' && npm run storybook" \
    "/tmp/storybook-fe-dev.log" \
    2 \
    60
