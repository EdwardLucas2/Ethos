# Pay Up — Loser

A confrontational, unavoidable screen informing the loser they owe a forfeit. Designed to be impossible to dismiss quickly.

**Route:** `/pay-up/[resolutionId]`
**PRD:** Section 5.12
**Stitch:** `screen.png` — uses Space Mono font (use Public Sans); TopBar shows "Ethos Resolution" title text (use `back` variant with standard "ETHOS" wordmark only).

## States
- Active debt — full layout with "I KNOW" button
- Acknowledged — same layout but "I KNOW" replaced with "ACKNOWLEDGED" (muted, non-interactive); debt remains until winner settles

## Data
- Cycle resolution — winner_ids, loser_ids, forfeit
- Resolution acknowledgment — acknowledged_at for current user (if exists)
- Winner participant(s) — name, avatar
- Cycle — cycle_number
- Contract — name, forfeit
- Winner's verified evidence items (thumbnails)
- Current user's final habit_action counts

## Sections

### TopBar
`back` variant. Back navigates to `/dashboard`.

### Hero Stamp
`HeroStamp` component, `defeat` variant — "PAY UP", large red stamp, rotated ~−10°, centred. `shadow-lg`. This is the first thing visible; it dominates the screen.

### Payout Card
`PayoutCard` component, `perspective="loser"` — "YOU OWE [WINNER]: [FORFEIT]". Black variant. Large forfeit text, font-black, italic, ALL CAPS.

### Resolution Context Card
`ResolutionContextCard` component — the current user's habit summary and the winner(s) as an `opponents` array. "VIEW CYCLE DETAILS" link navigates to `/contract/[contractId]/[cycleNumber]/settled`.

### Winner's Evidence
Section header "THEIR PROOF" — rubbing it in. Horizontal row of `EvidenceThumbnail` components showing the winner's verified evidence. Max 4 thumbnails; no "view all" needed here.

### Acknowledgment CTA
"I KNOW" — full-width, `ink` background, white text, font-black, italic, ALL CAPS, 3px border, `shadow-sm`. Tapping records `acknowledged_at`, dismisses alert, and navigates to `/dashboard`. In acknowledged state, replaced with a muted "ACKNOWLEDGED" label.
