# Backend Style Guide

Conventions for all backend Java code. Follow these rules in every feature — they exist to keep agent-generated and human-written code consistent.

---

## Naming Conventions

**Store methods** use these prefixes only:

- `findById`, `findAllBy*` — queries (single row and multi-row respectively)
- `insert`, `update`, `delete` — writes

**Service methods** use:

- `get*` — fetches a single resource, throws `NotFoundException` if absent
- `list*` — returns a list
- `create*`, `update*`, `remove*` — mutating operations

Never mix the two vocabularies across layers. A service method named `findById` or a store method named `getUser` is wrong.

---

## Null Handling

- Stores return `Optional<T>` for single-row lookups that may be absent. Never return `null`.
- Stores return `List<T>` for multi-row queries. Never return `Optional<List<T>>`.
- Services call `.orElseThrow(NotFoundException::new)` — they never propagate `Optional` to handlers.
- Handlers never receive `null` or `Optional` from any method call.

---

## JDBI

- Use the fluent handle API directly in the store class — no separate query interface.
- Write all SQL in text blocks (`"""`).
- Each store class takes `Jdbi` in its constructor and calls `jdbi.withHandle(...)` or `jdbi.inTransaction(...)` directly.
- Multi-step writes that must be atomic go in a single `jdbi.inTransaction()` inside the store method. The transaction boundary never crosses into the service layer.

---

## DTOs

- Use Java records for all DTOs by default.
- Use a plain class only when the object must be built incrementally (field-by-field across multiple steps). This should be rare.
- Jackson deserialises missing JSON fields as `null` on request DTOs — annotate nullable fields with `@Nullable` for clarity.
- Configure `JsonInclude.NON_NULL` globally so `null` response fields are omitted from JSON automatically.

---

## Logging

Uses SLF4J with Logback. MDC is populated per-request in `requireAuth`:

- `MDC.put("userId", userId.toString())`
- `MDC.put("path", ctx.path())`

MDC is cleared in an after-handler. All log lines automatically include the request context without explicit passing.

### When to log

**`log.info`** — mutating operations and state transitions only:

- Entity created: `user.registered`, `contract.created`, `evidence.submitted`, `vote.cast`
- State transition: `contract.started`, `cycle.advanced`, `cycle.settled`, `participant.signed`
- Scheduler: tick summary, each transition attempted

**`log.warn`** — expected failures worth tracking:

- Rate limits hit, conflicts, `NotFoundException` inside scheduler jobs

**`log.error`** — unexpected failures:

- Unhandled exceptions (global handler), external call failures (push, file storage), scheduler job errors. Always pass the exception as the final argument.

**Never log:**

- Any read operation (`find*`, `get*`, `list*`)
- Method entry/exit, calls to other services or stores, data mapping
- Request bodies

### Format

Always use parameterised messages with `key=value` pairs:

```
log.info("contract.created contractId={} userId={}", contractId, userId);
```

Never use string concatenation in log calls.

---

## Comments

- Do not add comments explaining what the code does — well-named methods and variables do that.
- Only add a comment when the **why** is non-obvious: i.e. a hidden constraint or a deliberate design trade-off.
- Add Javadoc only on complex public methods where the contract or side-effects are non-trivial. Keep it to one or two sentences.

---

## Tests

### Structure

Group tests in `@Nested` inner classes by method under test. Unit and integration tests live in separate nested groups within the same file:

```
class ContractServiceTest {
    @Nested class CreateContract { ... }          // unit
    @Nested class CreateContractIntegration { ... } // integration, uses Testcontainers
}
```

Each `@Nested` class may have its own `@BeforeEach` for setup specific to that method group.

### Naming

Test methods follow `givenX_returnsY` (the method under test is captured by the `@Nested` class name):

- `givenValidRequest_returnsCreatedContract`
- `givenFewerThanTwoSignedParticipants_throwsBadRequest`
- `givenDuplicateParticipant_throwsConflict`

Test user-visible behaviour, not implementation details. Assert on return values and thrown exceptions — not on which store methods were called.

---

## OpenAPI Annotations

Every handler method must have a `@OpenApi` annotation. These annotations are the source of truth for the API — `API.md` is not maintained. Write descriptions as if they are the API documentation.

Include:

- `path`, `methods`, `summary`, `description`, `tags`
- `pathParams` and `queryParams` where applicable
- `requestBody` with `required = true` for POST/PATCH
- All meaningful response codes with descriptions — including `400`, `401`, `403`, `404`, `409` where applicable

`description` should cover: what the endpoint does, any preconditions, and the specific conditions that produce each non-2xx response. Keep it factual and concise.

Tags group endpoints by domain: `users`, `contracts`, `participants`, `cycles`, `evidence`, `resolutions`, `notifications`, `files`.
