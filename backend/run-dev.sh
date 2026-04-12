#!/bin/bash
set -a
source "$(dirname "$0")/.env"
set +a
dbmate --url "$DBMATE_URL" --migrations-dir "$(dirname "$0")/db/migrations" migrate
mvn exec:java
