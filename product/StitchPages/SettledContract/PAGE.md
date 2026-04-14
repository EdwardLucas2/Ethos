# Contract Settled

The final, resolved outcome of a completed cycle. Celebrate winners, call out losers, show the debts.

**Route:** `/contract/[contractId]/[cycleNumber]/settled`
**PRD:** Section 5.11
**Stitch:** `screen.png` — TopBar uses white background (use `stack` variant with yellow background).

## States
- Loading — skeleton
- All cleared — everyone hit their target; no PayoutCards; celebration header
- Mixed results — some winners, some losers; PayoutCards visible
- Total failure — bottom-ranked owe top-ranked; "RELATIVE FAILURE" explanation shown

## Data
- Cycle — cycle_number, status (`settled`)
- Cycle resolution — winner_ids, loser_ids, forfeit
- Participants — name, habit, frequency, avatar
- Habit actions + final verified counts per participant
- Current user's user_id (to determine if they're a winner or loser and personalise navigation)

## Sections

### TopBar
`stack` variant.

### Resolution Banner
"CYCLE COMPLETE" — full-width `yellow` background strip, 4px bottom border. `checkmark` icon left. Font-black, uppercase, large.

### Final Standings Leaderboard
Ranked `ParticipantRow` components with `rank` prop and `status` prop (`CLEARED` or `OWES`). Shows final verified count (e.g. "3/3 DAYS"). Current user's row uses `isCurrentUser` highlight. Rows are tappable:
- If current user is a **loser** and taps their own row → navigates to `/pay-up/[resolutionId]`
- If current user is a **winner** and taps their own row → navigates to `/owed/[resolutionId]`

### Payout Cards
One `PayoutCard` per debt relationship (`perspective="neutral"`), stacked. Each card states "[LOSER] OWES [WINNER]: [FORFEIT]". If there are no debts (all cleared or tie), this section is hidden.

### Share Action
"SHARE RESULTS" — full-width outlined button, `ink` border, 3px, `shadow-sm`. Opens native share sheet. Below the payout cards.
