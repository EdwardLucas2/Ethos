# Testing Strategy

## Philosophy

- Test behaviour, not implementation. Tests should break when the product breaks, not when internals are refactored.
- Prefer real dependencies over mocks at the integration layer. Mocked tests that pass while production behaviour breaks are worse than no tests.
- Tests must be independent and leave no shared state. Each test is responsible for its own setup and teardown.

---

## Backend (Java)

### Unit Tests

- **Scope:** Service classes in isolation. Mock all `Store` dependencies (Mockito).
- **What to test:** Business logic — status transitions, access control, computation (e.g. evidence status, cycle winner/loser).
- **What not to test:** Handlers (HTTP plumbing) or store queries.
- **Run:** `mvn test`

### Integration Tests — `@Tag("integration")`

- **Scope:** Handler → service → store → real PostgreSQL (Testcontainers). Schema applied via dbmate before each class.
- **What to test:** Full logical flows end-to-end. Assert on resulting DB state. Run data invariant checks at the end of each flow (see below).
- **Run:** `mvn test -Dgroups=integration`

### E2E Tests — `@Tag("e2e")`

- **Scope:** Full stack — PostgreSQL + SuperTokens Core + auth server + Javalin app, all in containers.
- **What to test:** Critical user journeys (sign up, create contract, submit evidence, settle cycle).
- **Run:** `mvn test -Dgroups=e2e`

### Full Backend Suite

```
mvn verify
```

### Fuzz Tests — `@FuzzTest`

- **Scope:** Targeted fuzzing of pure logic (e.g. tag-prefix generation in `UserService`). Static mocks only — never recreate mocks inside the fuzz loop.
- **Run:** `mvn test -Pfuzz` (set `JAZZER_FUZZ=1` for continuous mode). Scheduled daily in CI via `fuzz.yml`.

---

## Auth Server (Node.js/TypeScript)

- **Scope:** Integration tests against real SuperTokens + PostgreSQL containers (Testcontainers via Jest global setup).
- **Tool:** Jest + supertest.
- **Run:** `npm test` (from `auth/`)

---

## Frontend (React Native/Expo)

- **Tool:** Jest.
- **Run:** `npx jest` (from `app/`)

---

## Data Invariant Checks

Read-only DB assertions verifying service-level invariants that DB constraints alone cannot enforce. Implemented as JDBI queries in JUnit helper methods. Run at the end of each integration flow test.

---

## CI

`ci.yml` runs on every push and PR:

- **Backend:** `mvn spotless:check` → `mvn verify` → JaCoCo coverage to Codacy
- **Auth:** lint → prettier → tsc → `npm test --coverage` → coverage to Codacy
- **Frontend:** lint → prettier → tsc → jest → coverage to Codacy

`codeql.yml` runs CodeQL static analysis (Java + JS/TS)
