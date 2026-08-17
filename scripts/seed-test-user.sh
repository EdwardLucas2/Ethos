#!/usr/bin/env bash
set -euo pipefail

# Defaults match CLAUDE.md's documented manual-QA workflow ("re-seed test user
# after reset (defaults: test@email.com / Testing123)") — override with
# positional args if a different account is needed.
EMAIL="${1:-test@email.com}"
PASSWORD="${2:-Testing123}"

SIGNUP_RESPONSE=$(curl -si -X POST http://localhost:3568/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"formFields\":[{\"id\":\"email\",\"value\":\"${EMAIL}\"},{\"id\":\"password\",\"value\":\"${PASSWORD}\"}]}")

if ! echo "$SIGNUP_RESPONSE" | grep -q '"status":"OK"'; then
    echo "Signup failed: $(echo "$SIGNUP_RESPONSE" | tail -1)" >&2
    exit 1
fi

# The `|| true` keeps a no-match grep from tripping `pipefail` and aborting
# the script here (under `set -e`) before the actual diagnostic below runs.
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -i '^st-access-token:' | awk '{print $2}' | tr -d '\r' || true)

if [ -z "$TOKEN" ]; then
    echo "Failed to extract st-access-token from signup response" >&2
    exit 1
fi

curl -sf -X POST http://localhost:8080/users \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"displayName":"Test User"}' > /dev/null

echo "TEST_EMAIL=${EMAIL}"
echo "TEST_PASSWORD=${PASSWORD}"
