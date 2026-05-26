#!/usr/bin/env bash
set -euo pipefail

MONOREPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAESTRO_DIR="$MONOREPO_DIR/app/.maestro"
RESET_SCRIPT="$MONOREPO_DIR/scripts/reset-test-db.sh"
FLOW="${1:-}"

run_flow() {
    local yaml="$1"
    local name
    name="$(basename "$yaml" .yaml)"
    echo "──────────────────────────────"
    echo "▶  $name"
    echo "──────────────────────────────"
    maestro test "$yaml"
}

if [ -n "$FLOW" ]; then
    "$RESET_SCRIPT"
    run_flow "$MAESTRO_DIR/$FLOW.yaml"
else
    flows=("$MAESTRO_DIR"/*.yaml)
    if [ ! -f "${flows[0]:-}" ]; then
        echo "No flows found in $MAESTRO_DIR" >&2
        exit 1
    fi
    # Flows run in dependency order: sign-up first (creates the user), login second.
    ordered_flows=("sign-up" "login")
    "$RESET_SCRIPT"
    for name in "${ordered_flows[@]}"; do
        run_flow "$MAESTRO_DIR/$name.yaml"
    done
fi
