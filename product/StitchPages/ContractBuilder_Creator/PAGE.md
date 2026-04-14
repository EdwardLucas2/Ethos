# Contract Builder — Creator

Create a new contract, invite friends, set your commitment, and manage the lobby until the contract starts.

**Route:** `/contract/[contractId]/build`
**PRD:** Section 5.4
**Stitch:** `screen.png` — font uses Plus Jakarta Sans, Inter, and Clash Display (use Public Sans throughout); forfeit is shown as a binary `$ USD / PINT` selector (PRD specifies free-text input); avatar in TopBar is circular (use square); background is white (use `surface` `#F4F4F0`).

## States

- Building — ground rules form + invite section + commitment section; no participants yet besides creator
- Lobby (waiting) — invites sent; participant list visible with status badges; "START CONTRACT" disabled
- Lobby (ready) — all invitees have signed; "START CONTRACT" enabled
- Starting — optimistic transition; navigates to `/contract/[contractId]/[cycleNumber]/active`

## Data

- Contract (draft) — name, forfeit, period, start_date
- Participants — habit, frequency, sign_status (real-time updates)
- Users — for friend search (contacts list + tag search)

## Sections

### TopBar

`stack` variant. Back navigates to `/dashboard` with a discard-draft confirmation dialog.

### Ground Rules Card

`GroundRulesCard` in `edit` mode. Fields: contract name, period (segmented selector: WEEKLY / BI-WEEKLY / MONTHLY), forfeit (free text, e.g. "A Pint"), start date (date picker, today or future). Card is 3px border, `shadow-md`, white background.

Creator can continue editing these in the lobby state — changes propagate to all participants in real-time.

### Invite Friends

Section header "INVITE FRIENDS" with a `group` icon. Search input (tag search) + list of in-app contacts as quick-add chips. Selected invitees shown as a row of avatar chips with a remove (×) button. Max 9 invitees (10 total including creator). 3px border on the container, `shadow-sm`.

Invite action: sends invites and transitions screen to lobby state. In lobby state this section shows the live participant list instead.

### Your Commitment

`YourCommitmentSection` component. Blue background card with white habit input and frequency selector.

In lobby state, the creator's commitment becomes read-only (they already signed at creation). An "EDIT" affordance unsigns and re-enables inputs — only available while the contract hasn't started.

### Participant List (lobby state only)

Appears once invites are sent. Vertical stack of `ParticipantRow` components — one per participant including creator. Shows name, habit, frequency, and `StatusBadge` (SIGNED / DRAFTING / WAITING). Updates in real-time via polling or WebSocket.

Creator-only affordances per row: remove participant button (×) for participants in WAITING or DRAFTING status.

### Action Bar (fixed bottom)

Two buttons, full width, side by side:

- "DECLINE" — outlined, white background, 3px border. Discards draft, navigates to `/dashboard`. Confirmation dialog required.
- "SIGN CONTRACT" (building state) / "START CONTRACT" (lobby state) — filled, `ink` background, white text, 3px border, `shadow-sm`. "START CONTRACT" is visually muted (opacity) until at least one invitee has signed.
