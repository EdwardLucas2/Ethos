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

**`UserHandler`** — `POST /users`, `GET /users/me`, `PATCH /users/me`, `GET /users/search`, `GET /contacts`, `POST /contacts`, `DELETE /contacts/{contactUserId}`

**`ContractHandler`** — `POST /contracts`, `GET /contracts/{id}`, `PATCH /contracts/{id}`, `POST /contracts/{id}/start`, `DELETE /contracts/{id}`, `GET /contracts/me/active`, `GET /contracts/me/pending-resolution`

**`ParticipantHandler`** — `POST /contracts/{id}/participants`, `DELETE .../participants/{id}`, `PATCH .../participants/me`, `POST .../participants/me/sign`, `POST .../participants/me/unsign`, `POST .../participants/me/decline`, `POST .../participants/me/opt-out`

**`CycleHandler`** — `GET /contracts/{id}/cycles/{cycleNumber}`

**`HabitActionHandler`** — `GET .../cycles/{cycleNumber}/participants/{participantId}/habit-actions`

**`EvidenceHandler`** — `GET .../cycles/{cycleNumber}/evidence`, `POST .../evidence`, `GET .../evidence/{evidenceId}`, `POST .../evidence/{evidenceId}/votes`

**`ResolutionHandler`** — `GET /resolutions/{id}`, `POST .../acknowledge`, `POST .../settle`, `POST .../pesters`

**`NotificationHandler`** — `GET /notifications`, `POST /notifications/{id}/read`

**`DeviceTokenHandler`** — `POST /device-tokens`, `DELETE /device-tokens/{token}`

**`FileHandler`** — `POST /files/upload`, `GET /files/{key}` (local dev only)

Both `HabitActionHandler` and `EvidenceHandler` call `EvidenceService` — habit actions and evidence are inseparable in practice and live in the same service.

---

## Services

Services own business rules and validation. They throw typed exceptions and never import Javalin or HTTP types. Services communicate via direct Java method calls; the dependency graph must be a DAG.

---

**`UserService`**  
*Stores:* `UserStore`

Handles user registration and profile management. On `POST /users`, derives `supertokens_user_id` and email from the JWT, generates a tag (first word of display name, lowercased, alphanumeric only, truncated to 8 chars, plus 4 random chars; retries on collision), and inserts the user row — returns `409` if a row already exists for this SuperTokens account. Handles profile reads and updates. For tag search, fetches prefix-matched users excluding the caller, with `isContact` computed via a join in `UserStore`. Lists, adds, and removes contacts — validates target exists, is not the caller, and (on add) is not already a contact.

---

**`ContractService`**  
*Stores:* `ContractStore`, `EvidenceStore`  
*Calls:* `NotificationService`

Owns all contract lifecycle and participant operations.

**Creator operations:** creates a contract with default values and the creator's participant row atomically (single `ContractStore` call). Updates ground rules (draft + creator only). Starts the contract: validates at least 2 signed participants, non-empty name and forfeit, and startDate reached; transitions `draft → active`; creates the first cycle and habit action rows via `CycleDateCalculator` and `ContractStore.createCycleWithHabitActions()`. Cancels a draft. Invites a participant (draft + creator + max 10 + not already a participant), sends `contract_invited` notification. Removes a participant (draft + creator + not self).

**Invitee operations:** updates commitment (habit/frequency, implicitly transitions `waiting → drafting`), signs (requires habit and frequency), unsigns (`signed → drafting`), declines (not creator, not already declined, draft only), opts out (last day of active cycle only, permanent).

**Reads:** fetches contract detail with participants (excluding `removed`) and `currentCycleNumber` via a cycle join in `ContractStore`. For the dashboard active list, calls `ContractStore.getActiveContracts()` then `EvidenceStore.getProgressSummary()` in a single batched query, and assembles the response DTO. The pending-resolution list follows the same two-call pattern.

---

**`EvidenceService`**  
*Stores:* `EvidenceStore`, `ContractStore`  
*Calls:* `NotificationService`

Lists habit actions for a participant joined with their evidence (using `evidence.status` for filled/unfilled state). Lists all evidence for a cycle with `hasMyVote` per item. Fetches a single evidence item via `EvidenceStore.findByIdInCycle()` — this validates that the evidence belongs to the specified cycle, preventing path-param spoofing.

Submits evidence: validates via `ContractStore` that the `habitActionId` belongs to the caller in this cycle and that the cycle is `active`; validates no evidence already exists for this action. Sends `evidence_uploaded` notifications to co-participants.

Casts or updates a vote (upsert): validates via `ContractStore` that the caller is a signed participant and the cycle is not `settled`. Calls `EvidenceStore.recomputeAndWriteStatus()` after every vote — computes status from the simple majority of votes actually cast (not eligible voters) and writes it to `evidence.status`. Voting is permitted during `active` and `pending_resolution`.

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

**`active → pending_resolution`:** validates `end_date` has passed, updates cycle status, creates the next cycle and its habit action rows for all non-opted-out signed participants using `CycleDateCalculator` and `ContractStore.createCycleWithHabitActions()`. Sends `cycle_pending_resolution` notifications.

**`pending_resolution → settled`:** auto-approves any evidence still `pending` (zero votes cast) via `EvidenceStore.autoApproveAll()`. Delegates outcome computation and the resolution write to `ResolutionService.computeAndWriteResolution()`. Updates cycle status to `settled`. Calls `ContractStore.endContractIfEmpty()` — transitions `contracts.status` to `ended` if zero non-opted-out signed participants remain.

---

**`ResolutionService`**  
*Stores:* `ResolutionStore`, `EvidenceStore`, `ContractStore`  
*Calls:* `NotificationService`

**`computeAndWriteResolution(cycleId)`** — called by `CycleService` on settlement. Reads verified evidence counts per participant from `EvidenceStore` and habit/frequency from `ContractStore`. Determines winners (verified count ≥ frequency) and losers. Writes the `cycle_resolutions` row with `INSERT ... ON CONFLICT DO NOTHING` (idempotent — safe to retry). Sends `resolution_winner` and `resolution_loser` notifications.

Gets a resolution by ID: validates the caller is a winner or loser (returns `404` otherwise). The response includes winner/loser user data and ack timestamps from `ResolutionStore`, and a participants summary (habit, frequency, verified count) assembled from `ContractStore` and `EvidenceStore`.

Handles acknowledge (loser writes `acknowledged_at`) and settle (winner writes `settled_at`), returning `400` if the caller is not the expected role or has already acted.

Creates pesters: validates caller is a winner and `toUserId` is a loser, checks the rate limit (one pester per winner–loser pair per 24 hours), writes the pester row, and sends a `pester` notification.

---

**`NotificationService`**  
*Stores:* `NotificationStore`  
*External:* `PushNotificationService` (Expo Push API)

Called by `ContractService`, `EvidenceService`, `CycleService`, and `ResolutionService` to write notification rows and deliver push notifications. Never calls other domain services.

Lists unread notifications: `NotificationStore.findAllUnread()` runs six type-filtered sub-queries combined with `UNION ALL`, each joining only the tables relevant to that notification type for enrichment. Marks a notification read after verifying `recipient_user_id` matches the caller.

Upserts device tokens (insert or update `last_seen_at`) and deletes them on logout — verifying ownership (`token.user_id = callerUserId`) before deleting. Delivers push notifications by fanning out to all tokens for a user and deleting any that return `DeviceNotRegistered`.

---

**`FileService`**  
*External:* `FileStorageService` (injected interface — local or S3/R2 implementation)

Validates content type (`image/jpeg` / `image/png`) and size (≤ 10 MB), generates a UUID, streams the file to storage at key `evidence/{photoId}`, and returns the `photoId`. Resolves storage keys to URLs for use in API responses — other services call `FileService.resolveUrl()` when building DTOs that include `photoUrl` or `avatarUrl`.

---

## Service Dependency Graph

```
UserService
  └── UserStore

ContractService
  ├── ContractStore
  ├── EvidenceStore
  └── NotificationService

EvidenceService
  ├── EvidenceStore
  ├── ContractStore
  └── NotificationService

CycleService
  ├── ContractStore
  ├── EvidenceStore
  ├── ResolutionService
  └── NotificationService

ResolutionService
  ├── ResolutionStore
  ├── EvidenceStore
  ├── ContractStore
  └── NotificationService

NotificationService         ← leaf: calls no other domain service
  ├── NotificationStore
  └── PushNotificationService (external)

FileService                 ← leaf
  └── FileStorageService (external)
```

`Main.java` constructs in dependency order: stores first, then leaf services (`NotificationService`, `FileService`, `UserService`), then domain services (`ContractService`, `EvidenceService`), then `ResolutionService`, then `CycleService`.

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

Contract: insert, find by ID (with participants and current cycle join), update fields, update status.  
Participants: insert, find by ID, find by contract + user, update `sign_status`, update habit/frequency, update opt-out flag, count signed participants.  
Cycles: insert, find by contract + cycle number, find cycles due for transition (scheduler query), update status.  
`createCycleWithHabitActions(contractId, cycleNumber, startDate, endDate, participants)` — atomically inserts the cycle row and batch-inserts all habit action rows in a single `jdbi.inTransaction()` call. Used by both `ContractService` (first cycle) and `CycleService` (subsequent cycles).  
`endContractIfEmpty(contractId)` — transitions `contracts.status` to `ended` if zero non-opted-out signed participants remain.  
Dashboard: `getActiveContracts(userId)`, `getPendingResolutionContracts(userId)` — return contract + cycle + participant shape; progress data is fetched separately from `EvidenceStore`.

---

**`EvidenceStore`** — `evidence`, `votes`

Evidence: insert, `findByIdInCycle(evidenceId, cycleId)` (validates path-param hierarchy via join), find all for a cycle (with participant and `hasMyVote` data), find by `habit_action_id` (duplicate check), `autoApproveAll(cycleId)` (batch UPDATE to `auto_approved` where `status = 'pending'`).  
`recomputeAndWriteStatus(evidenceId)` — counts approve/reject votes, applies the majority rule, writes the result to `evidence.status`.  
`getProgressSummary(cycleIds, callerParticipantId)` — single batched query returning verified/pending/total counts per participant and the unreviewed count for the caller, grouped by cycle.  
Votes: upsert (insert or update on `UNIQUE (evidence_id, voter_participant_id)` conflict), find all for an evidence item.

---

**`ResolutionStore`** — `cycle_resolutions`, `resolution_acknowledgments`, `pesters`

Resolution: `insert` with `ON CONFLICT DO NOTHING` (idempotent for retry safety), find by ID (joined with winner/loser user data and ack timestamps), find by cycle ID.  
Acknowledgments: upsert `acknowledged_at`, upsert `settled_at`, find by resolution + user.  
Pesters: insert, count recent pesters for a winner–loser pair (rate limit query).

---

**`NotificationStore`** — `notifications`, `device_tokens`

Notifications: insert, `findAllUnread(userId)` (six type-filtered `UNION ALL` sub-queries with per-type enrichment joins), update `read_at` with ownership check.  
Device tokens: upsert (insert or update `last_seen_at` on token conflict), delete by token string (with `user_id` ownership check), find all tokens for a user.

---

## Utility Classes

**`CycleDateCalculator`** (`util/`) — pure functions, no dependencies. Computes a cycle's `start_date` and `end_date` given a `period` (`weekly`, `biweekly`, `monthly`) and a reference date. Used by both `ContractService` (first cycle on contract start) and `CycleService` (next cycle on transition). Centralises date logic in one place.

---

## Transaction Strategy

**Within a single store:** multi-table writes (e.g. `ContractStore.createCycleWithHabitActions()`) are wrapped in `jdbi.inTransaction()` inside the store method. Services call one method and never see the transaction boundary.

**Cross-store atomicity (settlement):** the settlement sequence is designed for idempotency so it is safe to retry on failure:
1. `ResolutionStore.insert()` — `ON CONFLICT DO NOTHING`; if it already exists, the row is unchanged.
2. `EvidenceStore.autoApproveAll()` — idempotent UPDATE.
3. `ContractStore.updateCycleStatus('settled')` — idempotent UPDATE.

If the process crashes between steps, the scheduler retries on the next tick. Each step is safe to re-run. The cycle's status check ensures a fully settled cycle is never re-processed.

**Future cross-store transactions:** if a future feature requires genuine atomicity across two stores (idempotency not sufficient), introduce a `Transactor` class that holds the `Jdbi` instance and exposes `inTransaction(Function<Handle, T>)`. Stores expose handle-bound overloads of methods that need to participate. The `Transactor` lives in `store/` — JDBI never enters the service layer.

---

## Scheduler

`CycleService` registers two fixed-rate jobs via a single-threaded `ScheduledExecutorService` (60-second interval). Single-threaded prevents concurrent self-invocation.

A boolean `isRunning` flag guards against pile-up: if the previous tick has not completed when the next fires, the new tick is skipped.

A separate invariant-checker job runs every 5 minutes and queries for inconsistent state — cycles past the voting window with no resolution row, cycles with a resolution row but status not `settled`, evidence still `pending` in a `settled` cycle. Logs and alerts on any hit; does not attempt to repair state.

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
