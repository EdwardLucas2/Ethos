#!/usr/bin/env bash
set -euo pipefail

MONOREPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAESTRO_DIR="$MONOREPO_DIR/app/.maestro"
RESET_SCRIPT="$MONOREPO_DIR/scripts/reset-test-db.sh"
FLOW="${1:-}"

banner() {
    echo "──────────────────────────────"
    echo "▶  $1"
    echo "──────────────────────────────"
}

run_signup() {
    banner "sign-up"
    maestro test "$MAESTRO_DIR/sign-up.yaml"
}

run_login() {
    banner "login"
    maestro test "$MAESTRO_DIR/login.yaml"
}

if [ -f "$MONOREPO_DIR/.env.local" ]; then
    "$RESET_SCRIPT"
fi

case "$FLOW" in
    sign-up) run_signup ;;
    login)   run_login ;;
    "")
        run_signup
        run_login
        ;;
    *)
        echo "Unknown flow: $FLOW" >&2
        exit 1
        ;;
esac
