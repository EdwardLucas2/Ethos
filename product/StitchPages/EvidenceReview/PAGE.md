# Evidence Review

Browse all evidence uploaded for a cycle. See what's verified and what still needs a vote.

**Route:** `/contract/[contractId]/[cycleNumber]/evidence/review`
**PRD:** Section 5.8
**Stitch:** `screen.png`

## States
- Loading — skeleton cards
- Has unreviewed items — REVIEW NEEDED cards sorted to top with red treatment
- All reviewed — all cards show verified/rejected/pending status; no red treatment
- Empty — no evidence uploaded yet; "No evidence uploaded yet" message centred in main area

## Data
- Evidence items for this cycle — photo_id, note, submitted_at, habit_action_id
- Votes per evidence item — decision, voter_participant_id
- Participants — name, avatar, habit (to attribute evidence and filter)
- Current user's participant_id (to determine which items need their vote)

## Sections

### TopBar
`stack` variant.

### Participant Filter
Horizontal scrollable tab strip. Tabs: one per participant by name + "ALL" default. Active tab uses `yellow` underline or fill. Tapping a tab filters the card list to that participant's evidence only.

Default selection: "ALL", unless there are unreviewed items — in that case default to the first participant with unreviewed evidence.

### Evidence Cards
Vertically stacked `EvidenceCard` components. Sort order: REVIEW NEEDED items first, then chronological descending.

- Tapping a REVIEW NEEDED card navigates to `/contract/[contractId]/[cycleNumber]/evidence/[evidenceId]`
- Tapping any other card opens a read-only detail view of that evidence (can be the same `[evidenceId]` route in a non-voting read-only state)
