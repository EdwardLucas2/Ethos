# Ethos

Ethos is a mobile app that helps people build habits by creating accountability contracts with friends. Participants agree on a habit, set a forfeit for failure, and use the app to submit and verify evidence each cycle.

# Tech Stack

**Frontend**
- Expo (React Native, managed workflow) + TypeScript
- Expo Router — file-based navigation (App Router pattern)
- Orval — generates TypeScript types and TanStack Query hooks from the OpenAPI spec
- TanStack Query (`@tanstack/react-query`) — all server state, caching, loading/error handling
- React Context — global client state (current user, auth)

**Backend**
- Java 25 (LTS) + Javalin + Maven
- SuperTokens Java SDK — JWT verification on every protected request

**Database**
- PostgreSQL + dbmate (migrations) + HikariCP (connection pooling) + JDBI

**Auth**
- SuperTokens self-hosted (Docker) — email/password, issues JWTs, React Native SDK on frontend

**File Storage**
- `FileStorageService` Java interface, implementation injected via `STORAGE_BACKEND` env var
- `local` → `LocalFileStorageService`: saves to `./data/uploads/`, served via `GET /files/{key}`
- `s3` → `S3FileStorageService`: AWS SDK v2 pointed at an S3-compatible endpoint

**API Contract**
- OpenAPI (`/api/openapi.yaml`) — single source of truth for all endpoints and schemas

**Testing**
- Backend: JUnit 6 + Testcontainers
- Frontend: Jest + React Native Testing Library
- E2E: Maestro

**CI**
- GitHub Actions — runs the test suite on every PR

# Project Structure

```
/api            - OpenAPI specification (openapi.yaml)
/app            - Expo React Native application
/backend        - Java 25 + Javalin server
/docker         - Docker Compose files
/docs           - Project documentation
```

**`/app` source layout**
```
app/            - Expo Router file-based routes (screens only)
components/     - Shared UI components
hooks/          - Custom hooks
src/
  api/          - Orval-generated code (never edit manually)
  context/      - React Context providers (auth, current user)
```

**`/backend` source layout**
```
src/main/java/com/ethos/
  dto/          - Request/response objects (must match OpenAPI schemas)
  handler/      - Javalin route handlers (HTTP layer only)
  service/      - Business logic
  datastore/    - Database access (JDBI only)
  storage/      - FileStorageService interface + implementations
  auth/         - SuperTokens JWT verification
db/migrations/  - dbmate migration files: {timestamp}_{description}.sql
```

# Feature Development Flow

Follow this order for every feature. Do not skip steps.

1. Update `/api/openapi.yaml` — define the endpoint, request schema, response schema
2. Run Orval (`npx orval`) — regenerates `/app/src/api/`
3. Add a dbmate migration — only if schema changes are required (`dbmate new <description>` from the `backend/` directory)
4. Implement the backend endpoint — handler → service → datastore
5. Implement the frontend — use Orval-generated hooks, handle loading and error states

# OpenAPI

- `/api/openapi.yaml` is the **single source of truth** for all API endpoints and data shapes
- Frontend types MUST come from Orval — never define API types by hand
- Backend DTOs MUST match the spec exactly
- Never define API shapes directly in Java or TypeScript

# Backend

## Layers

- **Handler** — HTTP only: parse request, call service, return response. No business logic.
- **Service** — Business logic and orchestration. No HTTP concerns, no DB access.
- **Datastore** — JDBI queries only. No business logic.
- **DTO** — Carries data in/out of the API. No logic.

## Rules

- Handlers must be thin — no logic beyond request parsing and response mapping
- Never access the database from a handler or service directly; use Datastore classes
- Never expose database row objects in API responses; always map to DTOs
- Validate all incoming requests in the handler layer
- All protected routes must verify the SuperTokens JWT via a Javalin before-handler
- Extract the user ID from the verified session; never trust user-supplied IDs in request bodies
- Wire all dependencies via constructor injection; construct everything once in `main()` and inject — do not instantiate handlers, services, or datastores inside other classes

## Error handling

- All errors return a standard `ErrorResponse` DTO: `{ "message": "string" }`
- Map exceptions to HTTP responses in a global `app.exception()` handler, not in individual handlers
- Define error response schemas in `openapi.yaml`

## File Storage

- All file I/O goes through the `FileStorageService` interface — never reference implementations directly in handlers or services
- Inject the correct implementation via the `STORAGE_BACKEND` environment variable
- The `GET /files/{key}` static file route is only registered when `STORAGE_BACKEND=local`

# Database

## Migrations

- Files live at `/backend/db/migrations/`
- Format: `{timestamp}_{description}.sql` (e.g. `20240101120000_create_users.sql`)
- Create a new migration: `cd backend && dbmate new <description>`
- Each file has a `-- migrate:up` section (required) and `-- migrate:down` section (optional)
- Migration files are **immutable once committed** — never edit an existing file
- Always create a new migration file for schema changes
- Migrations run automatically via `run-dev.sh` before the server starts

## Schema conventions

- Use `GENERATED ALWAYS AS IDENTITY` for primary keys
- Use `BOOLEAN` for boolean columns
- Prefer explicit columns over JSON blobs
- Prefer simple schemas; no premature optimisation

## Data access

- All queries live in Datastore classes
- Use JDBI for all queries; `Jdbi` is constructed once in `main()` and injected into Datastore constructors
- Never access the database from handlers or services

# Authentication

- SuperTokens runs as a sidecar container (see `docker/docker-compose.dev.yml`)
- The backend verifies JWTs using the SuperTokens Java SDK in a before-handler
- The frontend uses the SuperTokens React Native SDK for login, signup, and token refresh
- Auth tokens are stored using `expo-secure-store` — never `AsyncStorage`

# Frontend

## Rules

- TypeScript for all files
- Handle loading and error states for every API call
- Use `expo-secure-store` for any sensitive data

## State

- **Server state**: TanStack Query via Orval hooks only
- **Global client state**: React Context (auth, current user)
- **Local UI state**: `useState`
- Do not introduce external state libraries

## Navigation

- Routes are defined by the file structure under `app/`
- Protected screens live under `(app)/`; the root `_layout.tsx` handles auth redirection
- Programmatic navigation: `useRouter()`
- Route parameters: `useLocalSearchParams()`

## Native capabilities

Use Expo SDK modules for all native device capabilities. Do not use bare React Native APIs for native features.

# API Client (Orval + TanStack Query)

- Orval reads `/api/openapi.yaml` and generates typed TanStack Query hooks into `/app/src/api/`
- Never edit files in `/app/src/api/` manually
- Run `npx orval` after any change to `openapi.yaml`
- Always use generated hooks for all API calls — never raw `fetch`
- Always use generated types — never redefine shapes that already exist in the generated code
- `QueryClientProvider` is mounted in the root layout

# Linting & Formatting

## Frontend
- ESLint via `npm run lint` — uses `eslint-config-expo` + `eslint-config-prettier`
- Prettier via `npm run format` (fix) or `npm run format:check` (verify)
- Config: `app/.prettierrc`
- Orval-generated files in `src/api/` are excluded from Prettier

## Backend
- Google Java Format via Spotless
- `mvn spotless:apply` — auto-fix all Java files
- `mvn spotless:check` — verify formatting

## Pre-commit hooks — Lefthook
- Config: `lefthook.yml` at repo root
- Runs `npm run lint` and `prettier --check` if any `.ts`/`.tsx` files are staged
- Runs `mvn spotless:check` if any `.java` files are staged

# Testing

## Backend — JUnit 5 + Testcontainers

- **Unit tests**: test service logic with mocked Datastore dependencies (no database required)
- **Integration tests**: use Testcontainers to spin up a real PostgreSQL instance; never use an in-memory database
- Tests must be independent; clean up state in `@AfterEach`
- Run: `mvn test`

## Frontend — Jest + React Native Testing Library

- Use RNTL for components with non-trivial logic: forms, conditional flows, state machines
- Simple display components do not need tests
- Mock Orval-generated hooks with `jest.mock`, not `fetch`
- Test user-visible behaviour, not implementation details
- Run: `npx jest`

## E2E — Maestro

- Maestro flows live in `/app/.maestro/`
- Cover all critical user journeys
- Run: `maestro test /app/.maestro/`

# Local Development

Services run in Docker; applications run as local processes.

```bash
docker compose -f docker/docker-compose.dev.yml up -d   # PostgreSQL + SuperTokens
cd backend && ./run-dev.sh                               # Backend on :8080
cd app && npx expo start                                 # Expo dev server
```

Backend environment variables for local development:
- `DATABASE_URL` — `jdbc:postgresql://localhost:5432/ethos` (HikariCP / Java)
- `DATABASE_USER` — `ethos`
- `DATABASE_PASSWORD` — `secret`
- `DBMATE_URL` — `postgres://ethos:secret@localhost:5432/ethos` (dbmate migrations)
- `SUPERTOKENS_URL` — `http://localhost:3567`
- `STORAGE_BACKEND` — `local`
- `UPLOAD_DIR` — `./data/uploads`

# Infrastructure

- The backend is Dockerised — runs as a container built via a multi-stage Maven + JRE Dockerfile
- PostgreSQL and SuperTokens also run as containers
- Nginx will act as a reverse proxy and handle SSL termination
- File storage uses Cloudflare R2 in production (S3-compatible; the `S3FileStorageService` points to it via the AWS SDK v2)
- The mobile app is distributed via EAS Build (App Store + Play Store)