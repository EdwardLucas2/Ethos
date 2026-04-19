# Backend Architecture

Java 25 + Javalin + JDBI. Single deployable JAR — no microservices. See `TECHSTACK.md` for the full stack and `DATAMODEL.md` for the database schema.

## Layer Overview

```
handler/      HTTP only — parse request, validate structure, call service, return DTO
service/      Business logic, validation, orchestration
store/        SQL via JDBI — no business logic; grouped by domain aggregate
dto/          HTTP request/response POJOs, annotated for OpenAPI spec generation
model/        Internal domain objects returned from stores
exception/    Typed exceptions mapped to HTTP status codes
scheduler/    Background jobs via ScheduledExecutorService
util/         Shared utility classes with no dependencies (e.g. CycleDateCalculator)
```

`Main.java` builds the object graph (stores → services → handlers) and starts the server.  
`AppRouter.java` registers all routes, before-handlers, and exception mappers in one place.

Dependencies flow downward across layers: handlers → services → stores. Within the service layer, services may call other services via direct method calls. The service dependency graph must be a **DAG — no cycles**. See the [Service Dependency Graph](#service-dependency-graph) below.

---

## Authentication & Middleware

Two before-handlers registered in `AppRouter`, applied per-route:

**`requireAuth`** — verifies the SuperTokens JWT and loads the `users` row by `supertokens_user_id`. Attaches the `users.id` UUID to the context as `userId`. Used on all protected routes.

If the JWT is valid but no `users` row exists (e.g. registration was interrupted by a crash or re-install), throws `RegistrationIncompleteException` → `401` with body `{ "error": "registration_incomplete" }`. The client deletes its local session token and routes to the registration screen.

**`requireJwt`** — verifies the SuperTokens JWT only. Does not load the `users` row. Used only on `POST /users` (the user row does not exist yet at registration time).

The `userId` attached to context is always our `users.id` UUID — never the SuperTokens user ID and never a caller-supplied value. Handlers read it from context; they never trust the request body for identity.

If the JWT is missing or invalid, SuperTokens returns `401` before any handler or service code runs.

---

## Request Validation

Javalin does not automatically validate request bodies — it only deserialises JSON via Jackson. Two levels of validation apply:

**Structural validation (handler)** — checks that the request is well-formed: required fields are present and non-blank, enum values are known, query params meet minimum length. Done in the handler using Javalin's `ctx.bodyValidator()` or manual null checks before calling the service. Throws `BadRequestException`.

**Business validation (service)** — checks that the request is valid given current state: the `habitActionId` belongs to the caller, the cycle is still `active`, the `sign_status` transition is permitted. Done in the service. Throws the appropriate typed exception.

---

## Handlers

Handlers know only HTTP. Each extracts path params, body, and `userId` from context, performs structural validation, calls one or more service methods, and returns the result. No business logic.

The handler-to-service relationship is **many-to-many**: a handler calls whichever service owns the operation; a service may be called by multiple handlers. There is no requirement for a 1:1 mapping.

**`UserHandler`** — `POST /users`, `GET /users/me`, `PATCH /users/me`, `GET /users/search`, `GET /contacts`, `POST /contacts`, `DELETE /contacts/{contactUserId}` → `UserService`

**`ContractHandler`** — `POST /contracts`, `GET /contracts/{id}`, `PATCH /contracts/{id}`, `POST /contracts/{id}/start`, `DELETE /contracts/{id}`, `GET /contracts/me/active`, `GET /contracts/me/pending-resolution` → `ContractService`

**`ParticipantHandler`** — `POST /contracts/{id}/participants`, `DELETE .../participants/{id}`, `PATCH .../participants/me`, `POST .../participants/me/sign`, `POST .../participants/me/unsign`, `POST .../participants/me/decline`, `POST .../participants/me/opt-out` → `ContractService`

**`CycleHandler`** — `GET /contracts/{id}/cycles/{cycleNumber}` → `CycleService`

**`HabitActionHandler`** — `GET .../cycles/{cycleNumber}/participants/{participantId}/habit-actions` → `EvidenceService`

**`EvidenceHandler`** — `GET .../cycles/{cycleNumber}/evidence`, `POST .../evidence`, `GET .../evidence/{evidenceId}`, `POST .../evidence/{evidenceId}/votes` → `EvidenceService`

**`ResolutionHandler`** — `GET /resolutions/{id}`, `POST .../acknowledge`, `POST .../settle`, `POST .../pesters` → `ResolutionService`

**`NotificationHandler`** — `GET /notifications`, `POST /notifications/{id}/read` → `NotificationService`

**`DeviceTokenHandler`** — `POST /device-tokens`, `DELETE /device-tokens/{token}` → `NotificationService`

**`FileHandler`** — `POST /files/upload`, `GET /files/{key}` (local dev only) → `FileService`

Both `HabitActionHandler` and `EvidenceHandler` call `EvidenceService` — habit actions and evidence are inseparable in practice and live in the same service.

---

## Services

Services own business rules and validation. They throw typed exceptions and never import Javalin or HTTP types. Services communicate via direct Java method calls; the dependency graph must be a DAG.

URL resolution — converting a stored UUID (`avatar_id`, `photo_id`) to a frontend-ready URL — is performed in the service layer when assembling response data. Services that return DTOs containing `avatarUrl` or `photoUrl` call `FileService.resolveUrl(key)` before returning.

---

**`UserService`**  
*Stores:* `UserStore`  
*Calls:* `FileService`

Handles user registration and profile management. On `POST /users`, derives `supertokens_user_id` and email from the JWT, generates a tag (first word of display name, lowercased, alphanumeric only, truncated to 8 chars, plus 4 random chars; retries on collision), and inserts the user row — returns `409` if a row already exists for this SuperTokens account. Handles profile reads and updates. For tag search, fetches prefix-matched users excluding the caller, with `isContact` computed via a join in `UserStore`. Lists, adds, and removes contacts — validates target exists, is not the caller, and (on add) is not already a contact.

---

**`ContractService`**  
*Stores:* `ContractStore`, `EvidenceStore`  
*Calls:* `NotificationService`, `FileService`

Owns all contract lifecycle and participant operations.

**Creator operations:** creates a contract with default values and the creator's participant row atomically (single `ContractStore` call). Updates ground rules (draft + creator only). Starts the contract: validates at least 2 signed participants, non-empty name and forfeit, and startDate reached; calls `ContractStore.activateContract()` — an atomic test-and-set that transitions `draft → active` and inserts the first cycle and habit action rows in one transaction; returns `false` if the status was already changed (concurrent start), which the service maps to `ConflictException`. Cancels a draft. Invites a participant (draft + creator + max 10 + not already a participant), sends `contract_invited` notification. Removes a participant (draft + creator + not self).

**Invitee operations:** updates commitment (habit/frequency, implicitly transitions `waiting → drafting`), signs (requires habit and frequency), unsigns (`signed → drafting`), declines (not creator, not already declined, draft only), opts out (last day of active cycle only, permanent).

**Reads:** fetches contract detail with participants (excluding `removed`) and `currentCycleNumber` via a join on the current `active` cycle in `ContractStore`. For the dashboard active list, calls `ContractStore.getActiveContracts()` then `EvidenceStore.getProgressSummary()` in two separate queries and assembles the response DTO. The pending-resolution list follows the same two-call pattern.

---

**`EvidenceService`**  
*Stores:* `EvidenceStore`, `ContractStore`  
*Calls:* `NotificationService`, `FileService`

Lists habit actions for a participant joined with their evidence (using `evidence.status` for filled/unfilled state). Lists all evidence for a cycle with `hasMyVote` per item. Fetches a single evidence item via `EvidenceStore.findByIdInCycle()` — this validates that the evidence belongs to the specified cycle, preventing path-param spoofing.

Submits evidence: validates via `ContractStore` that the `habitActionId` belongs to the caller in this cycle and that the cycle is `active`; validates no evidence already exists for this action. Sends `evidence_uploaded` notifications to co-participants.

Casts or updates a vote (upsert): validates via `ContractStore` that the caller is a signed participant and the cycle is not `settled`. Calls `EvidenceStore.upsertVoteAndRecomputeStatus()` — an atomic store method that upserts the vote and rewrites `evidence.status` in one transaction. Voting is permitted during `active` and `pending_resolution`.

**Evidence status rule:**
- `VERIFIED` if approvals > (total votes cast) / 2
- `REJECTED` if rejections > (total votes cast) / 2
- `PENDING` otherwise (tie or no votes yet)

---

**`CycleService`**  
*Stores:* `ContractStore`, `EvidenceStore`  
*Calls:* `ResolutionService`, `NotificationService`

Fetches a single cycle by contract + cycle number, validating the caller is a non-removed participant via `ContractStore`.

Runs the background scheduler (see [Scheduler](#scheduler)):

**`active → pending_resolution`:** validates `end_date` has passed. Calls `ContractStore.advanceCycleToResolution()` — an atomic method that sets the current cycle's status to `pending_resolution` and inserts the next cycle row and its habit action rows for all non-opted-out signed participants in the same transaction, using `CycleDateCalculator` to compute `start_date`, `end_date`, and `voting_deadline`. Sends `cycle_pending_resolution` notifications after the commit.

**`pending_resolution → settled`:** triggered when either (a) no evidence for the cycle has `status = 'pending'` (all items have a majority decision — early settlement) or (b) `voting_deadline <= today` (hard deadline). In case (b), `EvidenceStore.autoApproveAll(cycleId)` runs first to clear remaining pending items. Delegates outcome computation and the resolution write to `ResolutionService.computeAndWriteResolution()`, which returns `true` if the resolution row was newly inserted, `false` if it already existed (retry scenario) — notifications are only sent when it returns `true`. Updates cycle status to `settled` via `ContractStore.updateCycleStatus()`. Calls `ContractStore.endContractIfEmpty()` — transitions `contracts.status` to `ended` if zero non-opted-out signed participants remain.

---

**`ResolutionService`**  
*Stores:* `ResolutionStore`, `EvidenceStore`, `ContractStore`  
*Calls:* `NotificationService`, `FileService`

**`computeAndWriteResolution(cycleId)`** — called by `CycleService` on settlement. Reads verified evidence counts per participant from `EvidenceStore` and habit/frequency from `ContractStore`. Determines winners (verified count ≥ frequency) and losers. Writes the `cycle_resolutions` row with `INSERT ... ON CONFLICT DO NOTHING`; **returns `true` if the row was newly inserted, `false` if it already existed** (retry). Sends `resolution_winner` and `resolution_loser` notifications only when returning `true` — preventing duplicate notifications on scheduler retry.

Gets a resolution by ID: validates the caller is a winner or loser (returns `404` otherwise). The response includes `contractId`, `contractName`, and `cycleNumber` from the `cycle_resolutions → cycles → contracts` join in `ResolutionStore`; winner/loser user data and ack timestamps from `ResolutionStore`; and a participants summary (habit, frequency, verified count) assembled from `ContractStore` and `EvidenceStore`.

Handles acknowledge (loser writes `acknowledged_at`) and settle (winner writes `settled_at`), returning `400` if the caller is not the expected role or has already acted.

Creates pesters: validates caller is a winner and `toUserId` is a loser, checks the rate limit (one pester per winner–loser pair per 24 hours), writes the pester row, and sends a `pester` notification.

---

**`NotificationService`**  
*Stores:* `NotificationStore`  
*Calls:* `FileService`  
*External:* `PushNotificationService` (Expo Push API)

Called by `ContractService`, `EvidenceService`, `CycleService`, and `ResolutionService` to write notification rows and deliver push notifications. Never calls other domain services.

Lists unread notifications in two steps: (1) `NotificationStore.findAllUnreadHeaders(userId)` fetches raw notification rows (id, type, entity_id, created_at) with no joins; (2) rows are grouped by type and a targeted enrichment method is called per non-empty group — `enrichEvidenceUploaded`, `enrichContractInvited`, `enrichCyclePendingResolution`, `enrichResolutionWinner`, `enrichResolutionLoser`, `enrichPester` — each fetching only the fields required for that notification type. `NotificationService` merges the headers and enrichment results into the response DTOs. Marks a notification read after verifying `recipient_user_id` matches the caller.

Upserts device tokens (insert or update `last_seen_at`) and deletes them on logout — verifying ownership (`token.user_id = callerUserId`) before deleting. Delivers push notifications by fanning out to all tokens for a user and deleting any that return `DeviceNotRegistered`.

---

**`FileService`**  
*External:* `FileStorageService` (injected interface — local or S3/R2 implementation)

Validates content type (`image/jpeg` / `image/png`) and size (≤ 10 MB), generates a UUID, streams the file to storage at key `evidence/{photoId}`, and returns the `photoId`. `resolveUrl(String key)` delegates to `FileStorageService` — returns `http://localhost:8080/files/{key}` in local dev and the R2 CDN URL in production. Called by other services when assembling DTOs that include `photoUrl` or `avatarUrl`.

---

## Service Dependency Graph

```
UserService
  ├── UserStore
  └── FileService

ContractService
  ├── ContractStore
  ├── EvidenceStore
  ├── NotificationService
  └── FileService

EvidenceService
  ├── EvidenceStore
  ├── ContractStore
  ├── NotificationService
  └── FileService

CycleService
  ├── ContractStore
  ├── EvidenceStore
  ├── ResolutionService
  └── NotificationService

ResolutionService
  ├── ResolutionStore
  ├── EvidenceStore
  ├── ContractStore
  ├── NotificationService
  └── FileService

NotificationService         ← calls no other domain service
  ├── NotificationStore
  ├── FileService
  └── PushNotificationService (external)

FileService                 ← sole leaf service
  └── FileStorageService (external)
```

`Main.java` constructs in dependency order: stores first, then `FileService` (the sole leaf service), then `NotificationService` and `UserService` (both depend only on `FileService`), then `ContractService`, `EvidenceService`, and `ResolutionService`, then `CycleService`.

---

## Domain Stores

Each store encapsulates all SQL for its group of tables. Methods return domain models from `model/`. No business logic — no typed exceptions, no calls to other stores or services.

A store that owns the primary entity in a query may join against any table, including those owned by other stores, in read-only `SELECT` operations. Write operations (INSERT, UPDATE, DELETE) are restricted to the store's own tables.

---

**`UserStore`** — `users`, `contacts`

User: insert, find by ID, find by `supertokens_user_id`, tag prefix search (with `isContact` join for search results).  
Contacts: insert, delete, find all for user (joined with user profile), exists check for a specific pair.

---

**`ContractStore`** — `contracts`, `participants`, `cycles`, `habit_actions`

Contract: insert, find by ID (with participants and current `active`-cycle join), update fields.  
Participants: insert, find by ID, find by contract + user, find all by cycle ID (used by `ResolutionService` for the participants summary), update `sign_status`, update habit/frequency, update opt-out flag, count signed participants.  
Cycles: find by contract + cycle number, find cycles due for transition (scheduler query), update status.  
`activateContract(contractId, cycleStart, cycleEnd, votingDeadline, signedParticipants)` — atomic method: `UPDATE contracts SET status = 'active' WHERE id = ? AND status = 'draft'` (test-and-set); if zero rows updated, returns `false` (service maps to `ConflictException` for concurrent-start protection); if one row updated, inserts the first cycle row and batch-inserts habit action rows in the same `jdbi.inTransaction()`.  
`advanceCycleToResolution(currentCycleId, contractId, nextCycleNumber, nextStart, nextEnd, nextVotingDeadline, activeParticipants)` — atomically sets the current cycle's status to `pending_resolution` and inserts the next cycle row and its habit action rows in one `jdbi.inTransaction()`. Used by `CycleService` on the `active → pending_resolution` transition.  
`endContractIfEmpty(contractId)` — transitions `contracts.status` to `ended` if zero non-opted-out signed participants remain.  
Dashboard: `getActiveContracts(userId)`, `getPendingResolutionContracts(userId)` — return contract + cycle + participant shape; progress data is fetched separately from `EvidenceStore`.

---

**`EvidenceStore`** — `evidence`, `votes`

Evidence: insert, `findByIdInCycle(evidenceId, cycleId)` (validates path-param hierarchy via join), find all for a cycle (with participant and `hasMyVote` data), find by `habit_action_id` (duplicate check), `autoApproveAll(cycleId)` (batch UPDATE to `auto_approved` where `status = 'pending'`).  
`recomputeAndWriteStatus(evidenceId)` — counts approve/reject votes, applies the majority rule, writes the result to `evidence.status`.  
`getProgressSummary(cycleIds, callerUserId)` — batched query returning verified/pending/total counts per participant and the unreviewed count for the caller (derived by joining through `participants` per cycle), grouped by cycle.  
Votes: `upsertVoteAndRecomputeStatus(vote)` — atomically upserts the vote row and calls `recomputeAndWriteStatus()` in a single `jdbi.inTransaction()`, ensuring the vote and its status consequence are never partially committed. Find all votes for an evidence item.

---

**`ResolutionStore`** — `cycle_resolutions`, `resolution_acknowledgments`, `pesters`

Resolution: `insert` with `ON CONFLICT DO NOTHING`; returns `true` if the row was newly inserted (service gates notification sends on this value). `findById` joins `cycle_resolutions → cycles → contracts` (for `contractId`, `contractName`, `cycleNumber`) and `UNNEST(winner_ids) / UNNEST(loser_ids) → users` (for display names and avatars) and `resolution_acknowledgments` (for ack/settled timestamps). `findByCycleId` — used by the invariant checker.  
Acknowledgments: upsert `acknowledged_at`, upsert `settled_at`, find by resolution + user.  
Pesters: insert, count recent pesters for a winner–loser pair (rate limit query).

---

**`NotificationStore`** — `notifications`, `device_tokens`

Notifications: insert, `findAllUnreadHeaders(userId)` (raw notification rows only — id, type, entity_id, created_at — no joins), per-type enrichment methods called by `NotificationService` after grouping by type:
- `enrichEvidenceUploaded(ids)` — joins `evidence → habit_actions → cycles → contracts` for submitter name, contract name, cycle number, and evidence ID
- `enrichContractInvited(ids)` — joins `contracts → users (via creator_id)` for inviter name and contract name
- `enrichCyclePendingResolution(ids)` — joins `cycles → contracts` for contract name and cycle number
- `enrichResolutionWinner(ids)` — joins `cycle_resolutions → cycles → contracts`; `UNNEST(loser_ids) → users` for loser names
- `enrichResolutionLoser(ids)` — same; `UNNEST(winner_ids) → users` for winner names
- `enrichPester(ids)` — joins `pesters → users (from_user_id)` and `pesters → cycle_resolutions → cycles → contracts` for forfeit

Update `read_at` with ownership check.  
Device tokens: upsert (insert or update `last_seen_at` on token conflict), delete by token string (with `user_id` ownership check), find all tokens for a user.

---

## Utility Classes

**`CycleDateCalculator`** (`util/`) — pure functions, no dependencies. Computes a cycle's `start_date`, `end_date`, and `voting_deadline` given a `period` (`weekly`, `biweekly`, `monthly`) and a reference date. `voting_deadline` is `end_date + VOTING_WINDOW_DAYS`. Used by both `ContractService` (first cycle) and `CycleService` (next cycle on transition).

---

## Transaction Strategy

### Single-store atomicity (preferred)

When a state transition touches only one store's tables, wrap all writes in a single `jdbi.inTransaction()` inside the store method. Services call one method and never see the transaction boundary. Examples:

- `ContractStore.activateContract()` — atomically test-and-sets `contracts.status` and inserts the first cycle and habit action rows
- `ContractStore.advanceCycleToResolution()` — atomically sets the current cycle to `pending_resolution` and inserts the next cycle and habit action rows
- `EvidenceStore.upsertVoteAndRecomputeStatus()` — atomically upserts the vote and rewrites `evidence.status`

This is the default: design new multi-step writes to fall within one store wherever possible.

### Cross-store atomicity (idempotent retry)

When writes span multiple stores, full atomicity is not achievable without the `Transactor` (see below). The settlement sequence handles this via idempotency:

1. `EvidenceStore.autoApproveAll(cycleId)` — idempotent UPDATE (only affects `status = 'pending'` rows)
2. `ResolutionService.computeAndWriteResolution(cycleId)` — `ResolutionStore.insert()` uses `ON CONFLICT DO NOTHING`; **returns `true` if the resolution was newly inserted, `false` if it already existed**. `NotificationService` calls for `resolution_winner`/`resolution_loser` are gated on this return value — they fire only on the first successful insert, preventing duplicate notifications on scheduler retry
3. `ContractStore.updateCycleStatus('settled')` — idempotent UPDATE

If the process crashes between steps, the scheduler retries on the next tick. The cycle's `pending_resolution` status ensures a settled cycle is never re-entered.

### The Transactor pattern (when idempotency is insufficient)

If a future feature requires genuine atomicity across two stores where idempotency cannot be engineered in, introduce a `Transactor` class:

```java
// store/Transactor.java
public class Transactor {
    private final Jdbi jdbi;
    public <T> T inTransaction(Function<Handle, T> work) {
        return jdbi.inTransaction(work);
    }
}
```

Stores expose handle-bound method overloads (e.g. `insert(Handle h, ...)`) alongside their normal instance methods. The service calls `transactor.inTransaction(handle -> { storeA.insert(handle, ...); storeB.update(handle, ...); })`. The `Transactor` lives in `store/` — the JDBI `Handle` never crosses into the service layer.

**Tradeoff:** The `Transactor` guarantees database consistency at the cost of coupling the service to the transaction boundary (it must know which calls to group). Reserve it for cases where idempotency or single-store design genuinely cannot work — misuse creates implicit ordering constraints between stores that are hard to test and reason about. In practice, most multi-step writes can be either collapsed into a single store method or made safe via idempotency.

---

## Scheduler

`CycleService` registers two fixed-rate jobs via a single-threaded `ScheduledExecutorService` (60-second interval). Single-threaded prevents concurrent self-invocation of the same job.

An `AtomicBoolean isRunning` flag guards against pile-up: if the previous tick has not completed when the next fires, the new tick is skipped. `AtomicBoolean` is required (not plain `boolean`) for correct memory visibility between the scheduler thread and the JVM's other threads.

**`active → pending_resolution` predicate:** `WHERE cycles.status = 'active' AND cycles.end_date < today`

**`pending_resolution → settled` predicate:** fires when either:
- All evidence for the cycle has a majority decision (no `evidence.status = 'pending'` rows remain) — early settlement when all participants have voted
- `cycles.voting_deadline <= today` — hard deadline; `EvidenceStore.autoApproveAll(cycleId)` runs first to clear remaining pending items before settlement proceeds

A separate invariant-checker job runs every 5 minutes and queries for inconsistent state — cycles past `voting_deadline` with no resolution row, cycles with a resolution row but status not `settled`, evidence still `pending` in a `settled` cycle. Logs and alerts on any hit; does not attempt to repair state.

---

## Exceptions & Response Codes

### Exceptions

All are `RuntimeException` subclasses. `AppRouter` registers one `app.exception(...)` per type.

**`BadRequestException(String message)`** → `400`  
**`RegistrationIncompleteException`** → `401` with body `{ "error": "registration_incomplete" }`  
**`ForbiddenException`** → `403`  
**`NotFoundException`** → `404`  
**`ConflictException(String message)`** → `409`

Unhandled exceptions → `500` with a generic error body.  
`401 Unauthorized` (invalid/missing JWT) is returned by SuperTokens middleware — no application exception needed.

### 2XX Response Codes

**`201 Created`** — `POST /users`, `POST /contacts`, `POST /contracts`, `POST .../participants`, `POST .../evidence`, `POST /files/upload`

**`204 No Content`** — `DELETE /contacts/{id}`, `DELETE /contracts/{id}`, `DELETE .../participants/{id}`, `POST .../participants/me/decline`, `POST .../participants/me/opt-out`, `POST .../acknowledge`, `POST .../settle`, `POST .../pesters`, `POST /notifications/{id}/read`, `POST /device-tokens`, `DELETE /device-tokens/{token}`

**`200 OK`** — everything else: reads, updates, and action endpoints that return the updated resource.
