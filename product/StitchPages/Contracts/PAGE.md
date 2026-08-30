# Contracts

Full list/history of every contract the caller is or was a participant in. Distinct from Home Dashboard, which surfaces only what needs attention right now.

**Route:** `/contracts`
**PRD:** Section 5.17
**Stitch:** None — no mockup exists. Design consistent with established visual style.

## States
- Loading — skeleton rows
- Empty — no contracts yet; same onboarding prompt as Home Dashboard's empty state
- Populated — full list, most recent first

## Data
- All contracts the caller is a participant in — name, status, current cycle (if any), opponent(s)

## Sections

### TopBar
`tab` variant.

### Contract List
Vertical list of rows, most recent first. Each row: contract name, `StatusBadge` (active / pending resolution / settled), opponent(s). Tapping a row navigates to the contract's overview screen matching its current status (`/contract/[contractId]/[cycleNumber]/active`, `/…/unsettled`, or `/…/settled`).

### BottomTabBar
`contracts` tab active.

## Backend

Needs a new endpoint — `GET /contracts/me/active` and `GET /contracts/me/pending-resolution` (used by Home Dashboard) don't cover settled contracts. Not yet planned in `docs/API.md`.
