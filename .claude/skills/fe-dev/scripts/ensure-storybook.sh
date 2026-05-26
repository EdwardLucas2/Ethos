#!/bin/bash
# Ensures Storybook is running on port 6006.
# Outputs "already-running", "started:<pid>", or "error:<message>" (on stderr + exit 1).
set -e

APP_DIR="$(dirname "$0")/../../../../app"

if curl -sf http://localhost:6006 > /dev/null 2>&1; then
    echo "already-running"
else
    cd "$APP_DIR"
    npm run storybook > /tmp/storybook-fe-dev.log 2>&1 &
    PID=$!
    TRIES=0
    until curl -sf http://localhost:6006 > /dev/null 2>&1; do
        sleep 2
        TRIES=$((TRIES + 1))
        if [ "$TRIES" -ge 30 ]; then
            kill "$PID" 2>/dev/null || true
            echo "error:Storybook did not start within 60s — check /tmp/storybook-fe-dev.log" >&2
            exit 1
        fi
    done
    echo "started:$PID"
fi
