# Home Dashboard

The app's nerve centre — urgent actions, active contract summaries, and the entry point for creating new contracts.

**Route:** `/dashboard`
**PRD:** Section 5.3
**Stitch:** `screen.png` — TopBar has avatar left + settings icon right (Stitch layout is wrong; use default variant: hamburger left, ETHOS wordmark, avatar right). Background is `#FDFDFD` (use `surface` `#F4F4F0`).

## States
- Loading — skeleton placeholders for alert stack and contract cards
- Empty — no contracts yet; show onboarding prompt "No active contracts. Challenge your friends!" with a prominent create-contract CTA in place of the cards section
- Populated — full alert stack + contract cards
- All caught up — no alerts; cards show passive progress state

## Data
- Current user (avatar, display name)
- Unread notifications — type, entity_id, entity_type
- Active contracts + current cycle progress (contracts, cycles, participants, habit_actions, evidence aggregate)
- Pending-resolution cycles (for the secondary section)

## Sections

### TopBar
`default` variant.

### Alert Stack
Zero or more `AlertBanner` components stacked with `gap-3`, no horizontal padding (full bleed to screen edge minus global `px-4`). Ordered by urgency: verification first, invite second, settle third.

- `verify` type — "ALEX UPLOADED PROOF. [VERIFY]" — navigates to `/contract/[contractId]/[cycleNumber]/evidence/[evidenceId]`
- `challenge` type — "SARAH CHALLENGED YOU. [VIEW]" — navigates to `/contract/[contractId]/join`
- `settle` type — "LAST WEEK'S RESULTS ARE IN. [SETTLE]" — navigates to `/contract/[contractId]/[cycleNumber]/unsettled`
- `owed` type — "ALEX OWES YOU. [COLLECT]" — navigates to `/owed/[resolutionId]`
- `pay-up` type — "YOU OWE ALEX. [PAY UP]" — navigates to `/pay-up/[resolutionId]`

No alert stack section rendered when there are no unread notifications of these types.

### Active Contracts
Section header: "ACTIVE ARENA" — font-black, italic, uppercase, `text-2xl`, tracking tighter. Small badge flush right showing contract count (e.g. "2 LIVE") in a `ink` filled chip.

One `ActiveContractCard` per active contract, stacked vertically with `gap-4`. Each card navigates to `/contract/[contractId]/[cycleNumber]/active` on tap; the CTA button has its own `onCta` handler.

### Pending Resolution
Separate section below active contracts, slightly muted (reduce opacity or use `surface` background on cards instead of white). Section header: "LAST WEEK" — same typographic treatment as Active Contracts.

Cards show contract name, final progress summary, and "X REVIEWS NEEDED" label. Tap → `/contract/[contractId]/[cycleNumber]/unsettled`.

Section hidden when there are no pending-resolution cycles.

### FAB
`FAB` component, fixed bottom-right, above the BottomTabBar. On press: create contract via API, then navigate to `/contract/[contractId]/build` with the new contract's ID.

### BottomTabBar
`home` tab active.
