#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONOREPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$MONOREPO_DIR/.env.local"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --docker)
            echo "Starting docker containers..."
            docker compose -f "$MONOREPO_DIR/docker/docker-compose.dev.yml" --env-file "$ENV_FILE" up -d postgres supertokens auth
            echo "Waiting for services..."
            sleep 5
            ;;
    esac
done

set -a
source "$SCRIPT_DIR/.env"
set +a

dbmate --url "$DBMATE_URL" --migrations-dir "$SCRIPT_DIR/db/migrations" migrate
mvn exec:java