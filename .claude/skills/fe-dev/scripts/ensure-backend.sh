#!/bin/bash
# Ensures the backend API is running on port 8080.
# Outputs "already-running", "started:<pid>", or "error:<message>" (on stderr + exit 1).

MONOREPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
BACKEND_DIR="$MONOREPO_DIR/backend"

# TCP check — avoids curl -sf failing on 4xx responses from Javalin
backend_up() {
    nc -z localhost 8080 > /dev/null 2>&1
}

if backend_up; then
    echo "already-running"
else
    cd "$BACKEND_DIR"
    ./run-dev.sh --docker > /tmp/backend-fe-dev.log 2>&1 &
    PID=$!
    TRIES=0
    until backend_up; do
        sleep 3
        TRIES=$((TRIES + 1))
        if [ "$TRIES" -ge 40 ]; then
            echo "error:Backend did not start within 120s — check /tmp/backend-fe-dev.log" >&2
            exit 1
        fi
    done
    echo "started:$PID"
fi
