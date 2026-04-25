# Tech Stack Reference

## Frontend

- **Expo** (React Native, managed workflow) + TypeScript
- **Expo Router** — file-based navigation (App Router pattern)
- **Orval** — generates TypeScript types and TanStack Query hooks from the OpenAPI spec; generated files are committed to the repo at `app/src/api/` — only regenerate when handler annotations change
- **TanStack Query** (`@tanstack/react-query`) — all server state, caching, loading/error handling. **Polling:** screens that require near-real-time updates (contract lobby, active contract overview) use TanStack Query's `refetchInterval: 500` (500ms). No WebSockets.
- **React Context** — global client state (current user, auth)
- **expo-secure-store** — secure storage for auth tokens (never AsyncStorage)

## Backend

- **Java 25 (LTS) + Javalin + Maven**
- **JJWT** (`io.jsonwebtoken:jjwt-api`) — JWT verification on every protected request. SuperTokens has no Java SDK; `AuthMiddleware` fetches the JWKS from `{SUPERTOKENS_URL}/.well-known/jwks.json` at startup, caches the RSA public keys, and verifies Bearer tokens on each request
- **javalin-openapi** — generates the OpenAPI spec at compile time from `@OpenApi` annotations; served at `GET /openapi.json`
- **`ScheduledExecutorService`** (in-process scheduler) — runs every 60 seconds; evaluates cycle transitions (active → pending_resolution, pending_resolution → settled, contract renewal/ending).
- **`PushNotificationService`** interface — wraps push delivery to the Expo Push API

## Database

- **PostgreSQL** + **dbmate** (migrations) + **HikariCP** (connection pooling) + **JDBI**

## Auth

- **SuperTokens Core** self-hosted (Docker) — stores users and sessions, signs and issues JWTs. Exposes an internal HTTP API on port 3567 (never public-facing) used by the auth server, and a JWKS endpoint used by the Java backend for token verification.
- **Node.js auth server** (Express + `supertokens-node`) — thin Express app that mounts the `supertokens-node` middleware, which auto-generates all `/auth/*` routes (signup, signin, signout, token refresh). Talks to SuperTokens Core via the internal Docker network. The Java backend has no dependency on this server.
- **SuperTokens React Native SDK** (`supertokens-react-native`) — handles login/signup flows and automatic silent token refresh on the frontend.

## File Storage

- `FileStorageService` Java interface, implementation injected via `STORAGE_BACKEND` env var
- `local` → `LocalFileStorageService`: saves to `./data/uploads/`, served via `GET /files/{key}`
- `s3` → `S3FileStorageService`: AWS SDK v2 pointed at an S3-compatible endpoint

## Testing

- **Backend**: JUnit 6 + Testcontainers
- **Frontend**: Jest + React Native Testing Library
- **E2E**: Maestro (flows in `/app/.maestro/`)

## CI/CD

- GitHub Actions, workflows defined in .github/workflows

## Infrastructure

- The backend is Dockerised — multi-stage Maven + JRE Dockerfile
- PostgreSQL, SuperTokens Core, and the Node.js auth server run as containers
- Nginx acts as a reverse proxy
- File storage uses Cloudflare R2 in production
- The mobile app is distributed via EAS Build (App Store + Play Store)

## Linting & Formatting

**Frontend**

- ESLint via `npm run lint` — uses `eslint-config-expo` + `eslint-config-prettier`
- Prettier via `npm run format` (fix) or `npm run format:check` (verify)
- Config: `app/.prettierrc`
- Orval-generated files in `src/api/` are excluded from Prettier

**Backend**

- Palantir Java Format via Spotless
- `mvn spotless:apply` — auto-fix all Java files
- `mvn spotless:check` — verify formatting

**Pre-commit hooks — Lefthook**

- Config: `lefthook.yml` at repo root
- Runs `npm run lint` and `prettier --check` if any `.ts`/`.tsx` files are staged
- Runs `mvn spotless:check` if any `.java` files are staged

## Local Development

### Starting the Backend

```bash
# Option 1: Start docker separately (your preference for fast iteration)
docker compose -f docker/docker-compose.dev.yml --env-file .env.local up -d
cd backend && ./run-dev.sh

# Option 2: Let run-dev.sh start docker for you
cd backend && ./run-dev.sh --docker
```

### Starting the Frontend

```bash
cd app && npx expo start
```

## Environment Variables

Environment variables are consolidated at the monorepo root:

- `.env.local`: Local dev `localhost` URLs, dev DB credentials
- `.env.ci`: GitHub Actions Container URLs (service names)
- `.env.dev`: Dev server Same as local initially
- `.env.prod`: Production Real credentials

Shared variables in `.env.*`:

```
DATABASE_URL=jdbc:postgresql://localhost:5432/ethos
DATABASE_USER=ethos
DATABASE_PASSWORD=secret
DBMATE_URL=postgres://ethos:secret@localhost:5432/ethos
SUPERTOKENS_URL=http://localhost:3567
API_URL=http://localhost:8080
AUTH_URL=http://localhost:3568
STORAGE_BACKEND=local
UPLOAD_DIR=./data/uploads
```

Service-specific files (just `PORT`):

- `auth/.env` — `PORT=3568`
- `backend/.env` — `PORT=8080`
