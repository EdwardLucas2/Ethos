# Testing Strategy

## Philosophy

- Test behaviour, not implementation. Tests should break when the product breaks, not when internals are refactored.
- Prefer real dependencies over mocks at the integration layer. Mocked tests that pass while production behaviour breaks are worse than no tests.
- Tests must be independent and leave no shared state. Each test is responsible for its own setup and teardown.

---

## Layers

### Unit Tests

- **Scope:** Individual service classes in isolation.
- **Dependencies:** All Datastore dependencies are mocked (Mockito).
- **What to test:** Business logic branches — status transitions, access control decisions, computation logic (e.g. evidence status, cycle winner/loser determination).
- **What not to test:** Handlers (HTTP plumbing), Datastore queries (covered by integration tests).
- **Tool:** JUnit 5 + Mockito. Run with `mvn test`.

### Integration Tests

- **Scope:** Full backend stack — handler → service → datastore → real PostgreSQL.
- **Dependencies:** Testcontainers spins up a real PostgreSQL instance. Schema is applied via dbmate migrations before each test class. Never use an in-memory database.
- **What to test:** Full logical flows end-to-end — e.g. contract creation through cycle settlement. Each flow test exercises a realistic sequence of API calls and asserts on the resulting database state.
- **Invariant checks** are run at the end of each logical flow test (see below).
- **Tool:** JUnit 5 + Testcontainers + JDBI. Run with `mvn test`.

### E2E Tests

- **Scope:** Full app stack — real device/emulator against a running backend and database.
- **What to test:** Critical user journeys (sign up, create contract, submit evidence, settle cycle).
- **Tool:** Maestro. Run with `maestro test /app/.maestro/`.

---

## Data Invariant Checks

A set of read-only database assertions that verify service-level invariants which cannot be enforced by DB constraints alone. These are written as JDBI queries called from JUnit helper methods, and are run at the end of each logical flow integration test.
