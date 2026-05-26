#!/usr/bin/env bash
set -euo pipefail

EMAIL="${1:-test@email.com}"
PASSWORD="${2:-Testing123}"

PAYLOAD=$(jq -cn \
    --arg email "$EMAIL" \
    --arg password "$PASSWORD" \
    '{formFields:[{id:"email",value:$email},{id:"password",value:$password}]}')

RESPONSE=$(curl -sf -X POST http://localhost:3568/auth/signup \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

if echo "$RESPONSE" | grep -q '"status":"OK"'; then
    echo "Test user created: ${EMAIL}"
elif echo "$RESPONSE" | grep -q '"This email already exists'; then
    echo "Test user already exists: ${EMAIL}"
else
    echo "Unexpected response: ${RESPONSE}"
    exit 1
fi
