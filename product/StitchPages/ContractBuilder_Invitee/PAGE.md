# Contract Builder — Invitee

Review a contract invitation, see others' commitments, set your own habit, and sign — or decline.

**Route:** `/contract/[contractId]/join`
**PRD:** Section 5.5
**Stitch:** `screen.png` — same font caveats as Creator screen (use Public Sans). TopBar avatar is circular (use square).

## States
- Viewing — reading the invitation, commitment fields empty
- Drafting — has entered a habit/frequency but not yet signed
- Signed — commitment locked; fields read-only; "EDIT" affordance available while contract hasn't started
- Contract started — real-time transition; navigates to `/contract/[contractId]/[cycleNumber]/active`

## Data
- Contract — name, forfeit, period, start_date (read-only; updates in real-time if creator edits)
- Participants — habit, frequency, sign_status (real-time updates)
- Current user's participant row

## Sections

### TopBar
`stack` variant. Back navigates to `/dashboard`.

### Invitation Header
Full-width banner: "CHALLENGE RECEIVED" — large, font-black, italic, uppercase, `yellow` background, 3px border, `shadow-sm`. Creator name and contract name shown below in a subheading.

### Ground Rules Card
`GroundRulesCard` in `read-only` mode. Forfeit field highlighted with `yellow` background chip. Updates in real-time if the creator edits the contract.

### Squad Intel
Section header "SQUAD INTEL". Vertical stack of `ParticipantRow` components — one per participant. Shows name, habit, frequency, and `StatusBadge`. Current user's row highlighted with "YOU" label. Updates in real-time.

### Your Commitment
`YourCommitmentSection` component. Same blue card as Creator screen. In Signed state, inputs become read-only.

### Action Bar (fixed bottom)
- "DECLINE" — outlined, white background, 3px border. Navigates to `/dashboard`.
- "SIGN CONTRACT" (unsigned) / "SIGNED ✓" (signed, muted fill) — filled `ink` button. In signed state, an "EDIT" text link appears above the bar to unsign and re-enable the commitment fields.
