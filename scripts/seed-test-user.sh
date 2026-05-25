#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="app/.maestro/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    echo "Copy the example and fill in your credentials:"
    echo "  cp app/.maestro/.env.example $ENV_FILE"
    exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

if [ -z "${TEST_EMAIL:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
    echo "Error: TEST_EMAIL and TEST_PASSWORD must be set in $ENV_FILE"
    exit 1
fi

RESPONSE=$(curl -sf -X POST http://localhost:3568/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"formFields\":[{\"id\":\"email\",\"value\":\"${TEST_EMAIL}\"},{\"id\":\"password\",\"value\":\"${TEST_PASSWORD}\"}]}")

if echo "$RESPONSE" | grep -q '"status":"OK"'; then
    echo "Test user created: ${TEST_EMAIL}"
elif echo "$RESPONSE" | grep -q '"This email already exists'; then
    echo "Test user already exists: ${TEST_EMAIL}"
else
    echo "Unexpected response: ${RESPONSE}"
    exit 1
fi
