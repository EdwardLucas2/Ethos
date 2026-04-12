# Tech Stack Reference

## Frontend

- **Expo** (React Native, managed workflow) + TypeScript
- **Expo Router** — file-based navigation (App Router pattern)
- **Orval** — generates TypeScript types and TanStack Query hooks from the OpenAPI spec
- **TanStack Query** (`@tanstack/react-query`) — all server state, caching, loading/error handling
- **React Context** — global client state (current user, auth)
- **expo-secure-store** — secure storage for auth tokens (never AsyncStorage)

## Backend

- **Java 25 (LTS) + Javalin + Maven**
- **SuperTokens Java SDK** — JWT verification on every protected request
- **javalin-openapi** — generates the OpenAPI spec at compile time from `@OpenApi` annotations; served at `GET /openapi.json`

## Database

- **PostgreSQL** + **dbmate** (migrations) + **HikariCP** (connection pooling) + **JDBI**

## Auth

- **SuperTokens** self-hosted (Docker) — email/password, issues JWTs
- **SuperTokens React Native SDK** — login, signup, and token refresh on the frontend

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
- PostgreSQL and SuperTokens run as containers
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

## Local Environment Variables

Backend environment variables for local development:

- `DATABASE_URL` — `jdbc:postgresql://localhost:5432/ethos`
- `DATABASE_USER` — `ethos`
- `DATABASE_PASSWORD` — `secret`
- `DBMATE_URL` — `postgres://ethos:secret@localhost:5432/ethos`
- `SUPERTOKENS_URL` — `http://localhost:3567`
- `STORAGE_BACKEND` — `local`
- `UPLOAD_DIR` — `./data/uploads`
