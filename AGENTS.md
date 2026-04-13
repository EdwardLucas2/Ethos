# Ethos

Ethos is a mobile app that helps people build habits by creating accountability contracts with friends. Participants agree on a habit, set a forfeit for failure, and use the app to submit and verify evidence each cycle.

- [product/PRD.md](product/PRD.md) — full product requirements
- [product/DESIGN.md](product/DESIGN.md) — design system
- [docs/TECHSTACK.md](docs/TECHSTACK.md) — full tech stack details, env vars, infrastructure, linting config
- [docs/DATAMODEL.md](docs/DATAMODEL.md) — database schema, table definitions, conventions
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — shared UI component specifications
- [docs/ROUTING.md](docs/ROUTING.md) — Expo Router file structure, route params, and navigation flows

# Project Structure

```
/app            - Expo React Native application
/backend        - Java 25 + Javalin server
/docker         - Docker Compose files
/docs           - Implementation documentation
/product        - Product requirements and design
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

1. Annotate the new handler method with `@OpenApi` — define the path, method, request body, and response schemas
2. Run Orval (`npx orval` with the backend server running) — regenerates `/app/src/api/`
3. Add a dbmate migration — only if schema changes are required (`dbmate new <description>` from the `backend/` directory)
4. Implement the backend endpoint — handler → service → datastore
5. Implement the frontend — use Orval-generated hooks, handle loading and error states

# OpenAPI

- The spec is generated at compile time from `@OpenApi` annotations — no hand-written spec file; served at `GET /openapi.json`
- Frontend types MUST come from Orval — never define API types by hand in TypeScript
- Always regenerate via Orval after changing handler annotations

# Backend

## Layers

- **Handler** — HTTP only: parse request, call service, return response. No business logic.
- **Service** — Business logic and orchestration. No HTTP concerns, no DB access.
- **Datastore** — JDBI queries only. No business logic.
- **DTO** — Carries data in/out of the API. No logic.

## Rules

- Handlers must be thin — no logic beyond request parsing and response mapping
- Never access the database from a handler or service; use Datastore classes
- Never expose database row objects in API responses; always map to DTOs
- Validate all incoming requests in the handler layer
- All protected routes must verify the SuperTokens JWT via a Javalin before-handler
- Extract the user ID from the verified session; never trust user-supplied IDs in request bodies
- Wire all dependencies via constructor injection; construct everything once in `main()` and inject
- All errors return `ErrorResponse` DTO — map exceptions in a global `app.exception()` handler, not per-handler
- All file I/O goes through the `FileStorageService` interface — never reference implementations directly in handlers or services

# Database

- Migrations live at `/backend/db/migrations/` — format: `{timestamp}_{description}.sql`
- Create a migration: `cd backend && dbmate new <description>`
- Migration files are **immutable once committed** — never edit an existing file; always create a new one
- Use `UUID DEFAULT gen_random_uuid()` for primary keys — never auto-increment integers; prefer `BOOLEAN` for booleans
- Prefer explicit columns over JSON blobs; keep schemas simple
- All queries live in Datastore classes via JDBI — never access the database from handlers or services

# Authentication

- SuperTokens runs as a sidecar container (see `docker/docker-compose.dev.yml`)
- The backend verifies JWTs via the SuperTokens Java SDK in a before-handler
- Auth tokens must be stored using `expo-secure-store` — never `AsyncStorage`

# Frontend

- TypeScript for all files
- Handle loading and error states for every API call
- **Server state**: TanStack Query via Orval-generated hooks only — never raw `fetch`
- **Global client state**: React Context (auth, current user)
- **Local UI state**: `useState` — do not introduce external state libraries
- Routes are defined by file structure under `app/`; protected screens live under `(app)/`; the root `_layout.tsx` handles auth redirection
- Use Expo SDK modules for all native device capabilities — do not use bare React Native APIs

# Testing

- Backend unit tests: mock Datastore dependencies — no database required
- Backend integration tests: Testcontainers with a real PostgreSQL instance — never an in-memory database
- Tests must be independent; clean up state in `@AfterEach`
- Frontend: use RNTL for components with non-trivial logic; mock Orval hooks with `jest.mock`, not `fetch`
- Test user-visible behaviour, not implementation details

```bash
mvn test                          # Backend
npx jest                          # Frontend
maestro test /app/.maestro/       # E2E
```

# Local Development

```bash
docker compose -f docker/docker-compose.dev.yml up -d   # PostgreSQL + SuperTokens
cd backend && ./run-dev.sh                               # Backend on :8080
cd app && npx expo start                                 # Expo dev server
```

# Linting & Formatting

```bash
npm run lint          # ESLint (frontend)
npm run format        # Prettier fix (frontend)
mvn spotless:apply    # Java format fix (backend)
mvn spotless:check    # Java format verify (backend)
```

Pre-commit hooks (Lefthook) run lint and format checks automatically on staged files.
