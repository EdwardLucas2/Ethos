#!/bin/sh
set -e

echo "Running migrations..."
dbmate --url "$DBMATE_URL" migrate

echo "Starting application..."
exec java -jar app.jar "$@"