# Backend Architecture

Java 25 + Javalin + JDBI. Single deployable JAR — no microservices. See `TECHSTACK.md` for the full stack and `DATAMODEL.md` for the database schema.

## Layer Overview

```
handler/      HTTP only — parse request, validate structure, call service, return DTO
service/      Business logic, validation, orchestration
repository/   SQL via JDBI — no business logic
dto/          HTTP request/response POJOs, annotated for OpenAPI spec generation
model/        Internal domain objects returned from repositories
exception/    Typed exceptions mapped to HTTP status codes
scheduler/    Background jobs via ScheduledExecutorService
```

`Main.java` builds the object graph (repos → services → handlers) and starts the server.  
`AppRouter.java` registers all routes, before-handlers, and exception mappers in one place.

Dependencies flow in one direction: handlers → services → repositories. Services may call other services where needed — this is preferred over duplicating validation logic. No circular dependencies.

---

## Authentication & Middleware

Two before-handlers registered in `AppRouter`, applied per-route:

**`requireAuth`** — verifies the SuperTokens JWT and loads the `users` row by `supertokens_user_id`. Attaches the `users.id` UUID to the context as `userId`. Used on all protected routes.

**`requireJwt`** — verifies the SuperTokens JWT only. Does not load the `users` row. Used only on `POST /users` (the user row does not exist yet at registration time).

The `userId` attached to context is always our `users.id` UUID — never the SuperTokens user ID and never a caller-supplied value. Handlers read it from context; they never trust the request body for identity.

If the JWT is missing or invalid, SuperTokens returns `401` before any handler or service code runs.

---

## Request Validation

Javalin does not automatically validate request bodies — it only deserialises JSON via Jackson. Two levels of validation apply:

**Structural validation (handler)** — checks that the request is well-formed: required fields are present and non-blank, enum values are known, query params meet minimum length. Done in the handler using Javalin's `ctx.bodyValidator()` or manual null checks before calling the service. Throws `BadRequestException`.

**Business validation (service)** — checks that the request is valid given current state: the `habitActionId` belongs to the caller, the cycle is still `active`, the `sign_status` transition is permitted. Done in the service. Throws the appropriate typed exception.

This split keeps services free from HTTP concerns while keeping structural guards close to the API boundary.

---

## Handlers

Handlers know only HTTP. Each extracts path params, body, and `userId` from context, performs structural validation, calls one service method, and returns the result. No business logic.

**`UserHandler`** — `POST /users`, `GET /users/me`, `PATCH /users/me`, `GET /users/search`

**`ContactHandler`** — `GET /contacts`, `POST /contacts`, `DELETE /contacts/{contactUserId}`

**`ContractHandler`** — `POST /contracts`, `GET /contracts/{id}`, `PATCH /contracts/{id}`, `POST /contracts/{id}/start`, `DELETE /contracts/{id}`, `GET /contracts/me/active`, `GET /contracts/me/pending-resolution`

**`ParticipantHandler`** — `POST /contracts/{id}/participants`, `DELETE .../participants/{id}`, `PATCH .../participants/me`, `POST .../participants/me/sign`, `POST .../participants/me/unsign`, `POST .../participants/me/decline`, `POST .../participants/me/opt-out`

**`CycleHandler`** — `GET /contracts/{id}/cycles/{cycleNumber}`

**`HabitActionHandler`** — `GET .../cycles/{cycleNumber}/participants/{participantId}/habit-actions`

**`EvidenceHandler`** — `GET .../cycles/{cycleNumber}/evidence`, `POST .../evidence`, `GET .../evidence/{evidenceId}`, `POST .../evidence/{evidenceId}/votes`

**`ResolutionHandler`** — `GET /resolutions/{id}`, `POST .../acknowledge`, `POST .../settle`

**`PesterHandler`** — `POST /resolutions/{id}/pesters`

**`NotificationHandler`** — `GET /notifications`, `POST /notifications/{id}/read`

**`DeviceTokenHandler`** — `POST /device-tokens`, `DELETE /device-tokens/{token}`

**`FileHandler`** — `POST /files/upload`, `GET /files/{key}` (local dev only)

Votes are handled by `EvidenceHandler`, not a separate handler, because votes only exist in the context of an evidence item.

---

## Services

Services own business rules and validation. They throw typed exceptions and never import Javalin or HTTP types.

---

**`UserService`**  
*Repositories:* `UserRepository`

Fetches the current user profile and handles profile updates. On `POST /users` (registration), upserts a user row keyed on `supertokens_user_id` — derives email from the JWT, auto-generates the tag (first word of display name, lowercased, stripped to alphanumeric, truncated to 8 chars, plus 4 random chars; retries on collision). Returns the existing row on re-registration rather than throwing a conflict.

---

**`ContactService`**  
*Repositories:* `ContactRepository`, `UserRepository`

Lists contacts for the caller. Adds a contact after verifying the target user exists and the caller is not adding themselves. Removes a contact. The `isContact` field on user search results is computed here by joining against the contacts table.

---

**`ContractService`**  
*Repositories:* `ContractRepository`, `ParticipantRepository`, `UserRepository`  
*Calls:* `NotificationService`

Creates a contract and the creator's participant row atomically. Updates ground rules (name, forfeit, period, startDate — draft only, creator only). Starts the contract: validates at least 2 signed participants, non-empty name and forfeit, startDate reached; transitions `draft → active`, creates the first cycle and its habit action rows. Cancels a draft contract. Returns the dashboard list views (`/me/active`, `/me/pending-resolution`) via joins across contracts, participants, cycles, and evidence. Sends a `contract_invited` notification when a participant is invited.

---

**`ParticipantService`**  
*Repositories:* `ParticipantRepository`  
*Calls:* (none)

Manages all `sign_status` transitions for a participant within a contract. Each method validates the current status before writing: invite (creator only, draft only, max 10 participants, not already a participant), remove (creator only, cannot remove self), update commitment (sets habit/frequency, implicitly transitions `waiting → drafting`), sign (requires habit and frequency set), unsign (reverts `signed → drafting`), decline (not the creator), opt-out (last day of active cycle only). No notification sending — callers handle that where needed.

---

**`CycleService`**  
*Repositories:* `CycleRepository`, `HabitActionRepository`, `ParticipantRepository`  
*Calls:* `ResolutionService`, `NotificationService`

Reads a cycle by contract + cycle number. Contains the cycle transition logic invoked by the scheduler every 60 seconds:

- `active → pending_resolution`: triggered when `end_date` is passed. Creates the next cycle and its habit action rows for all remaining signed participants. Sends `cycle_pending_resolution` notifications.
- `pending_resolution → settled`: triggered after a configurable voting window. Auto-approves any `PENDING` evidence. Delegates to `ResolutionService` to compute and write the resolution. Sends `resolution_winner` and `resolution_loser` notifications.

---

**`EvidenceService`**  
*Repositories:* `EvidenceRepository`, `HabitActionRepository`, `VoteRepository`, `ParticipantRepository`, `CycleRepository`  
*Calls:* `NotificationService`

Handles habit actions, evidence, and votes together — these are inseparable in practice.

Lists habit actions for a participant, joined with evidence to show filled/unfilled state. Lists all evidence for a cycle, computing `hasMyVote` (null/false/true) per item and the `status` field (PENDING/VERIFIED/REJECTED) from vote counts against eligible voters. Gets a single evidence item with its full vote breakdown.

Submits evidence: validates `habitActionId` belongs to the caller in this cycle, the cycle is `active`, and no evidence already exists for this action. Sends `evidence_uploaded` notifications to co-participants.

Casts or updates a vote (upsert): validates the caller is not the submitter, is a signed participant, and the cycle is not `settled`. Voting is allowed during `active` and `pending_resolution`.

Evidence status computation — `eligible_voters` = signed participants minus the submitter:
- `VERIFIED` if approvals > eligible_voters / 2
- `REJECTED` if rejections > eligible_voters / 2
- `PENDING` otherwise

---

**`ResolutionService`**  
*Repositories:* `ResolutionRepository`, `ParticipantRepository`, `EvidenceRepository`, `UserRepository`  
*Calls:* `NotificationService`

Called by `CycleService` on settlement to compute and write the resolution. Determines winners and losers by comparing each participant's verified action count against their frequency — participants meeting their target win; those who don't lose. Writes the `cycle_resolutions` row. Sends `resolution_winner` and `resolution_loser` notifications.

Gets a resolution by ID: validates the caller is a winner or loser (returns 404 otherwise to avoid leaking existence). The response is self-contained — includes `contractName` and `cycleNumber` so pay-up/owed screens don't require contract data in cache.

Handles acknowledge (loser) and settle (winner): writes or validates `resolution_acknowledgments` rows. Returns 400 if the caller is not the expected role or has already acted.

---

**`PesterService`**  
*Repositories:* `PesterRepository`, `ResolutionRepository`  
*Calls:* `NotificationService`

Validates the caller is a winner in the resolution and `toUserId` is a loser. Checks the rate limit (one pester per winner–loser pair per 24 hours). Writes a `pesters` row and sends a `pester` notification to the target user.

---

**`NotificationService`**  
*Repositories:* `NotificationRepository`  
*Calls:* `DeviceTokenService`

Lists all unread notifications for the caller, enriched with display context needed to render each alert type (submitter name, contract name, loser names, etc.). Marks a notification as read. Writes notification rows and triggers push delivery — called by `ContractService`, `CycleService`, `EvidenceService`, `ResolutionService`, and `PesterService`.

---

**`DeviceTokenService`**  
*Repositories:* `DeviceTokenRepository`  
*External calls:* Expo Push API

Upserts a device token on app open (insert or update `last_seen_at`). Deletes a token on logout. Delivers a push notification to a user by fetching all their tokens, fanning out to the Expo Push API, and deleting any token that returns `DeviceNotRegistered`.

---

**`FileService`**  
*External calls:* `FileStorageService` (injected interface — local or S3 implementation)

Accepts a multipart upload, validates content type (`image/jpeg` / `image/png`) and size (≤ 10 MB), generates a UUID, streams the file to storage at key `evidence/{photoId}`, and returns the `photoId`. Resolves storage keys to URLs for use in API responses.

---

## Repositories

Each repository encapsulates all SQL for its primary table(s). Methods return domain models from `model/`. No business logic — no throwing typed exceptions, no calling other repositories.

**`UserRepository`** — insert/upsert, find by ID, find by `supertokens_user_id`, prefix search by `tag`

**`ContactRepository`** — insert, delete, find all for user (joined with user profile), exists check for a specific pair

**`ContractRepository`** — insert, find by ID, find all where user is a signed participant (for dashboard list views), update fields, update status

**`ParticipantRepository`** — insert, find by ID, find by contract ID, find by contract + user, update sign status, update habit/frequency, update opt-out flag, count signed participants for a contract

**`CycleRepository`** — insert, find by contract + cycle number, find all for a contract, find cycles due for transition (scheduler query), update status

**`HabitActionRepository`** — batch insert (N rows per participant at cycle start), find by participant + cycle (joined with evidence for filled/unfilled state), find by ID

**`EvidenceRepository`** — insert, find by ID, find all for a cycle (joined with participant and vote data), find by habit action ID (duplicate check), update status (auto-approve on settlement)

**`VoteRepository`** — upsert (insert or update on `UNIQUE (evidence_id, voter_participant_id)` conflict), find all for an evidence item, find by evidence + voter

**`ResolutionRepository`** — insert, find by ID (joined with winner/loser user data and acknowledgment timestamps), find by cycle ID, insert acknowledgment row, find acknowledgment by resolution + user

**`PesterRepository`** — insert, count recent pesters for a winner–loser pair (rate limit query)

**`NotificationRepository`** — insert, find all unread for a user (with entity joins for enrichment), update `read_at`

**`DeviceTokenRepository`** — upsert (insert or update `last_seen_at` on token conflict), delete by token string, find all tokens for a user

---

## Exceptions & Response Codes

### Exceptions

All are `RuntimeException` subclasses. `AppRouter` registers one `app.exception(...)` per type mapping to a consistent `{ "error": "..." }` response body.

**`BadRequestException(String message)`** → `400`. Input passes deserialisation but fails structural or business validation. Message is included in the response body.

**`ForbiddenException`** → `403`. Caller is authenticated but not authorised for this action (e.g. non-creator attempting a creator-only operation).

**`NotFoundException`** → `404`. Resource doesn't exist or the caller isn't permitted to know it exists (e.g. resolution ID for a cycle the caller wasn't part of).

**`ConflictException(String message)`** → `409`. Wrong state for the requested action, duplicate resource, or rate limit hit. Message is included in the response body.

Unhandled exceptions → `500` with a generic error body (registered as a catch-all in `AppRouter`).

`401 Unauthorized` is returned by SuperTokens middleware before any handler code runs — no application exception needed.

### 2XX Response Codes

Handlers are responsible for setting the correct success code:

**`201 Created`** — a new resource was created and is returned in the body. Used by: `POST /users`, `POST /contacts`, `POST /contracts`, `POST .../participants`, `POST .../evidence`, `POST /files/upload`.

**`204 No Content`** — action succeeded with no resource to return. Used by: `DELETE /contacts/{id}`, `DELETE /contracts/{id}`, `DELETE .../participants/{id}`, `POST .../participants/me/decline`, `POST .../participants/me/opt-out`, `POST .../acknowledge`, `POST .../settle`, `POST .../pesters`, `POST /notifications/{id}/read`, `POST /device-tokens`, `DELETE /device-tokens/{token}`.

**`200 OK`** — everything else: reads, updates, and action endpoints that return the updated resource.
