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
    reset-password.tsx                     → /reset-password  (deep-link target from password reset email)

  (app)/
    _layout.tsx                            ← Stack. Auth-protected. No tab bar at this level.

    (tabs)/
      _layout.tsx                          ← Tab navigator. Renders the tab bar.
      dashboard.tsx                        → /dashboard
      friends.tsx                          → /friends
      profile.tsx                          → /profile

    contract/
      [contractId]/
        build.tsx                          → /contract/[contractId]/build
        join.tsx                           → /contract/[contractId]/join

        [cycleNumber]/
          active.tsx                       → /contract/[contractId]/[cycleNumber]/active
          unsettled.tsx                    → /contract/[contractId]/[cycleNumber]/unsettled
          settled.tsx                      → /contract/[contractId]/[cycleNumber]/settled

          evidence/
            review.tsx                     → /contract/[contractId]/[cycleNumber]/evidence/review
            upload.tsx                     → /contract/[contractId]/[cycleNumber]/evidence/upload
            [evidenceId].tsx               → /contract/[contractId]/[cycleNumber]/evidence/[evidenceId]

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
- **`build` and `join` are both lobby screens** — the contract is initialised when the creator lands on `build`, giving it a `contractId` immediately. `build` is the creator's lobby view (can edit ground rules, invite participants, start contract); `join` is the invitee's lobby view (read-only ground rules, set commitment, sign). Both update in real-time.
- **No `cycle/` directory** — the cycle number is a direct child of `[contractId]` to keep URLs concise.

## Route params

- `contractId` — `contracts.id` (UUID)
- `cycleNumber` — `cycles.cycle_number` (integer)
- `evidenceId` — `evidence.id` (UUID)
- `resolutionId` — `cycle_resolutions.id` (UUID)

`/reset-password` receives a SuperTokens password-reset token via deep link query param (handled by the SuperTokens React Native SDK).

## Navigation flows

```
Auth
  /login         → /dashboard  (on success)
  /sign-up       → /dashboard  (on success)
  /reset-password → /login     (on success — password updated, user redirected to log in)

Dashboard
  tap contract card          → /contract/[contractId]/[cycleNumber]/active
  tap verification alert     → /contract/[contractId]/[cycleNumber]/evidence/[evidenceId]
  tap invite alert           → /contract/[contractId]/join
  tap settle alert           → /contract/[contractId]/[cycleNumber]/unsettled
  tap pay-up alert           → /pay-up/[resolutionId]
  tap FAB                    → /contract/[contractId]/build  (contract initialised on tap)

Contract Builder
  /contract/[contractId]/build  → /contract/[contractId]/[cycleNumber]/active  (creator starts contract)
  /contract/[contractId]/join   → /contract/[contractId]/[cycleNumber]/active  (contract started by creator)

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
