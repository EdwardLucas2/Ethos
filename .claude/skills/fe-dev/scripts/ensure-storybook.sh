#!/bin/bash
# Ensures Storybook is running on port 6006.
# Outputs "already-running" or "started:<pid>" so the caller knows whether to stop it later.
set -e

APP_DIR="$(dirname "$0")/../../../app"

if curl -sf http://localhost:6006 > /dev/null 2>&1; then
    echo "already-running"
else
    cd "$APP_DIR"
    npm run storybook > /tmp/storybook-fe-dev.log 2>&1 &
    PID=$!
    until curl -sf http://localhost:6006 > /dev/null 2>&1; do sleep 2; done
    echo "started:$PID"
fi
