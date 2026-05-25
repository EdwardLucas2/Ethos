#!/usr/bin/env bash
set -euo pipefail

MONOREPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$MONOREPO_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

source "$ENV_FILE"

echo "Resetting all data in auth and app database..."

# Truncates all user-data tables (app + SuperTokens) while preserving SuperTokens
# configuration tables (tenants, signing keys, key_value) that are needed for
# the auth server to function without a restart.
docker compose -f "$MONOREPO_DIR/docker/docker-compose.dev.yml" exec -T postgres \
    psql -U "${DATABASE_USER}" -d ethos -c "
        SET client_min_messages TO WARNING;
        DO \$\$
        DECLARE
            tbl TEXT;
        BEGIN
            FOR tbl IN
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename NOT IN (
                    'schema_migrations',
                    'apps',
                    'tenant_configs',
                    'tenants',
                    'tenant_thirdparty_providers',
                    'tenant_first_factors',
                    'tenant_required_secondary_factors',
                    'tenant_thirdparty_provider_clients',
                    'key_value',
                    'session_access_token_signing_keys',
                    'jwt_signing_keys'
                )
            LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(tbl) || ' CASCADE';
            END LOOP;
        END;
        \$\$;
    "

echo "Done. All auth and app data cleared."
