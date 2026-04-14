# Contract Overview — Unsettled (Last Week)

View the previous cycle's final standings while resolution is still in progress. Prompts remaining votes to be cast.

**Route:** `/contract/[contractId]/[cycleNumber]/unsettled`
**PRD:** Section 5.10
**Stitch:** `screen.png` — TopBar uses white background + gavel (use `stack` variant with yellow background).

## States
- Loading — skeleton for standings rows
- Pending reviews — verification CTA prominent; standings show in-progress counts
- Auto-transitions to settled — when all votes resolve, screen navigates to `/contract/[contractId]/[cycleNumber]/settled`

## Data
- Cycle — cycle_number, start_date, end_date, status (`pending_resolution`)
- Participants — name, habit, frequency, avatar
- Habit actions + evidence + votes per participant (final verified/pending counts)
- Unreviewed evidence count for current user

## Sections

### TopBar
`stack` variant.

### Period Switcher
`PeriodSwitcher` component. "LAST WEEK" active (right segment filled `yellow`). "THIS WEEK" navigates to `/contract/[contractId]/[cycleNumber + 1]/active`.

### Final Standings
Section header "FINAL STANDINGS". Ranked `ParticipantRow` components with `rank` prop (01, 02…). Each row shows: rank, name, verified count (e.g. "3/3 VERIFIED"), `ProgressBar` in complete or failed variant, and success/fail badge. Pending-still evidence shown as a qualifier (e.g. "1 PENDING" in muted text beside the count).

### Verification CTA
Rendered only when the current user has unreviewed evidence. High-contrast card: `red` left border stripe or full red background, "VERIFICATION PENDING — X ITEMS TO REVIEW", "REVIEW NOW" button. 3px border, `shadow-md`. Navigates to `/contract/[contractId]/[cycleNumber]/evidence/review`.

Hidden when the current user has voted on all evidence.

### Contract Summary
Compact recap: each participant's habit name and the cycle's end date. `text-sm`, `ink-secondary`. Gives context to the standings.

### Upload Lock Notice
Footer text: "SUBMISSION WINDOW CLOSED FOR THIS CYCLE" — `text-xs`, `ink-secondary`, centred. Persistent reminder that no new evidence can be added.
