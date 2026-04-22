# Ethos

Ethos is a mobile app that helps people build habits by creating accountability contracts with friends. Participants agree on a habit, set a forfeit for failure, and use the app to submit and verify evidence each cycle.

Read these docs when working on anything that touches their domain:

- [docs/API.md](docs/API.md) — all endpoints, request/response shapes, error codes
- [docs/BACKEND.md](docs/BACKEND.md) — service/store architecture, transaction strategy, scheduler
- [docs/BACKEND_STYLE.md](docs/BACKEND_STYLE.md) — naming, nulls, JDBI, DTOs, logging, comments, tests, OpenAPI conventions
- [docs/DATAMODEL.md](docs/DATAMODEL.md) — database schema, table definitions, conventions
- [docs/ROUTING.md](docs/ROUTING.md) — Expo Router file structure, route params, navigation flows
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — shared UI component specifications
- [docs/TESTS.md](docs/TESTS.md) — testing strategy and invariant checks
- [docs/TECHSTACK.md](docs/TECHSTACK.md) — full tech stack, env vars, infrastructure
- [product/PRD.md](product/PRD.md) — full product requirements
- [product/DESIGN.md](product/DESIGN.md) — design system

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
  store/        - Database access (JDBI only); grouped by domain
  storage/      - FileStorageService interface + implementations
  push/         - PushNotificationService interface + ExpoPushNotificationService implementation
  scheduler/    - ScheduledExecutorService setup; cycle transition jobs
  auth/         - JWT verification (JJWT + SuperTokens Core JWKS)
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

- Never access the database from a handler or service; use Store classes
- Never expose Store/model objects in API responses; always map to DTOs
- Two validation levels: structural (handler — is the request well-formed?) and business (service — is the request valid given current state?)
- Extract `userId` from the verified JWT context — never trust user-supplied identity in request bodies
- All file I/O goes through `FileStorageService` — never reference implementations directly
- All errors are mapped globally in `AppRouter` via `app.exception()` — no per-handler error handling
- Wire all dependencies via constructor injection; construct the full object graph once in `Main.java`

# Database

- Migrations live at `backend/db/migrations/` — create with `cd backend && dbmate new <description>`
- Migration files are **immutable once run against a shared or persistent database** — never edit; always create a new one
- Primary keys: `UUID DEFAULT gen_random_uuid()` — never auto-increment integers

# Authentication

Two auth before-handlers — use the right one per route:

- **`requireAuth`** — verifies JWT and loads the `users` row; attaches `userId` UUID to context. Used on all protected routes.
- **`requireJwt`** — verifies JWT only, no DB lookup. Used only on `POST /users` (the `users` row does not exist yet at registration time).

Auth tokens must be stored with `expo-secure-store` — never `AsyncStorage`.

# Frontend

- Handle loading and error states for every API call
- **Server state**: TanStack Query via Orval-generated hooks only — never raw `fetch`
- **Global client state**: React Context (auth, current user)
- **Local UI state**: `useState` — do not introduce external state libraries
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
docker compose -f docker/docker-compose.dev.yml up -d   # PostgreSQL + SuperTokens Core + auth server
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
