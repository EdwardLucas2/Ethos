#!/usr/bin/env bash
set -euo pipefail

MONOREPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAESTRO_DIR="$MONOREPO_DIR/app/.maestro"
RESET_SCRIPT="$MONOREPO_DIR/scripts/reset-test-db.sh"
FLOW="${1:-}"

run_flow() {
    local name="$1"
    echo "──────────────────────────────"
    echo "▶  $name"
    echo "──────────────────────────────"
    maestro test "$MAESTRO_DIR/$name.yaml"
}

if [ -f "$MONOREPO_DIR/.env.local" ]; then
    "$RESET_SCRIPT"
fi

if [ -n "$FLOW" ]; then
    if [ ! -f "$MAESTRO_DIR/$FLOW.yaml" ]; then
        echo "Unknown flow: $FLOW" >&2
        exit 1
    fi
    run_flow "$FLOW"
else
    # Auto-discovers every top-level flow in app/.maestro/ (not subflows/) so a
    # newly added flow runs automatically instead of needing a hardcoded entry.
    shopt -s nullglob
    yamls=("$MAESTRO_DIR"/*.yaml)
    shopt -u nullglob
    if [ ${#yamls[@]} -eq 0 ]; then
        echo "No flows found in $MAESTRO_DIR" >&2
        exit 1
    fi
    for yaml in "${yamls[@]}"; do
        run_flow "$(basename "$yaml" .yaml)"
    done
fi
