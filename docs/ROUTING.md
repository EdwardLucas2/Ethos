# Routing

Expo Router — file-based routing under `app/`. The file path is the URL.

## Structure

```
app/
  _layout.tsx                              ← Root stack. Checks auth state — redirects
                                             to /login if no session, /dashboard if valid.

  (auth)/
    _layout.tsx                            ← Stack. No tab bar.
    login.tsx                              → /login
    sign-up.tsx                            → /sign-up

  (app)/
    _layout.tsx                            ← Stack. Auth-protected. No tab bar at this level.

    (tabs)/
      _layout.tsx                          ← Tab navigator. Renders the tab bar.
      dashboard.tsx                        → /dashboard
      friends.tsx                          → /friends
      profile.tsx                          → /profile

    contract/
      new/
        build.tsx                          → /contract/new/build
        lobby.tsx                          → /contract/new/lobby

      [contractId]/
        join.tsx                           → /contract/[contractId]/join

        cycle/
          [cycleNumber]/
            active.tsx                     → /contract/[contractId]/cycle/[cycleNumber]/active
            unsettled.tsx                  → /contract/[contractId]/cycle/[cycleNumber]/unsettled
            settled.tsx                    → /contract/[contractId]/cycle/[cycleNumber]/settled

            evidence/
              review.tsx                   → /contract/[contractId]/cycle/[cycleNumber]/evidence/review
              upload.tsx                   → /contract/[contractId]/cycle/[cycleNumber]/evidence/upload
              [evidenceId].tsx             → /contract/[contractId]/cycle/[cycleNumber]/evidence/[evidenceId]

    pay-up/
      [resolutionId].tsx                   → /pay-up/[resolutionId]

    owed/
      [resolutionId].tsx                   → /owed/[resolutionId]
```

## Key decisions

- **Tab bar** renders only inside `(tabs)/`. Contract, evidence, and settlement screens are plain stack screens — no tab bar.
- **`cycleNumber`** is the integer cycle sequence number (1, 2, 3…), not the UUID. Matches `cycles.cycle_number` in the database.
- **`resolutionId`** maps to `cycle_resolutions.id`. No separate debts table — the resolution is the settlement entity.
- **Settlement screens at root** — `pay-up/` and `owed/` sit directly under `(app)/` because they are reached from both dashboard alerts and the settled contract screen, not exclusively from within a contract.
- **`join.tsx` under `[contractId]`** — the contract ID is in the URL so the invitee screen has the contract context it needs without an extra lookup.

## Route params

- `contractId` — `contracts.id` (UUID)
- `cycleNumber` — `cycles.cycle_number` (integer)
- `evidenceId` — `evidence.id` (UUID)
- `resolutionId` — `cycle_resolutions.id` (UUID)

## Navigation flows

```
Auth
  /login         → /dashboard  (on success)
  /sign-up       → /dashboard  (on success)

Dashboard
  tap contract card          → /contract/[contractId]/cycle/[cycleNumber]/active
  tap verification alert     → /contract/[contractId]/cycle/[cycleNumber]/evidence/[evidenceId]
  tap invite alert           → /contract/[contractId]/join
  tap settle alert           → /contract/[contractId]/cycle/[cycleNumber]/unsettled
  tap pay-up alert           → /pay-up/[resolutionId]
  tap FAB                    → /contract/new/build

Contract Builder
  /contract/new/build        → /contract/new/lobby  (on sign)
  /contract/new/lobby        → /contract/[contractId]/cycle/[cycleNumber]/active  (on start)

Contract Overview
  /…/active                  → /…/unsettled  (period switcher)
  /…/active                  → /…/evidence/upload  (snap proof)
  /…/active                  → /…/evidence/review  (proof feed)
  /…/unsettled               → /…/active  (period switcher)
  /…/unsettled               → /…/evidence/review  (review now)
  /…/unsettled               → /…/settled  (auto on resolution)
  /…/settled                 → /pay-up/[resolutionId]  (if loser)
  /…/settled                 → /owed/[resolutionId]  (if winner)

Evidence
  /…/evidence/review         → /…/evidence/[evidenceId]  (tap unreviewed card)
  /…/evidence/[evidenceId]   → /…/evidence/review  (on vote)
  /…/evidence/upload         → /…/active  (on submit)

Settlement
  /pay-up/[resolutionId]     → /dashboard  (tap "I Know")
  /owed/[resolutionId]       → /dashboard  (tap "Mark as Settled")
```
