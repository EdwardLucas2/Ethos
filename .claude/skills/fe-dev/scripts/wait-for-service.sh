#!/bin/bash
# Shared helper: waits for a local dev service to become ready, starting it in the
# background if it isn't already running. Sourced by ensure-backend.sh / ensure-storybook.sh.
#
# Usage: wait_for_service <check_cmd> <start_cmd> <log_file> <interval_s> <timeout_s>
# Prints "already-running", "started:<pid>", or "error:<message>" (stderr) and returns 1.

wait_for_service() {
    local check_cmd="$1"
    local start_cmd="$2"
    local log_file="$3"
    local interval="$4"
    local timeout="$5"

    if eval "$check_cmd" > /dev/null 2>&1; then
        echo "already-running"
        return 0
    fi

    eval "$start_cmd" > "$log_file" 2>&1 &
    local pid=$!
    local tries=0
    local max_tries=$((timeout / interval))
    until eval "$check_cmd" > /dev/null 2>&1; do
        sleep "$interval"
        tries=$((tries + 1))
        if [ "$tries" -ge "$max_tries" ]; then
            kill "$pid" 2>/dev/null || true
            echo "error:Service did not start within ${timeout}s — check $log_file" >&2
            return 1
        fi
    done
    echo "started:$pid"
}
