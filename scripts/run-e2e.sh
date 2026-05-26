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
    first=true
    for yaml in "${flows[@]}"; do
        if $first; then
            "$RESET_SCRIPT"
            first=false
        fi
        run_flow "$yaml"
    done
fi
