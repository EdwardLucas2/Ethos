# You're Owed — Winner

A victory screen reminding the winner they are owed a forfeit, with tools to pester the loser and mark the debt settled.

**Route:** `/owed/[resolutionId]`
**PRD:** Section 5.13
**Stitch:** `screen.png`

## States
- Active debt — "PESTER" and "MARK AS SETTLED" both available
- Settled — debt archived; layout shows "SETTLED" confirmation; actions replaced with "VIEW CYCLE DETAILS" only

## Data
- Cycle resolution — winner_ids, loser_ids, forfeit
- Resolution acknowledgment — settled_at for current user (if exists)
- Loser participant(s) — name, avatar
- Pesters — recent pester records for rate-limit display (e.g. "Pestered 2h ago")
- Contract — name
- Cycle — cycle_number

## Sections

### TopBar
`back` variant. Back navigates to `/dashboard`.

### Hero Stamp
`HeroStamp` component, `victory` variant — "YOU'RE OWED", large neon-green stamp, rotated ~−10°, centred. `shadow-lg`.

### Resolution Context Card
`ResolutionContextCard` component — the current user's habit summary and the loser(s) as an `opponents` array. "VIEW CYCLE DETAILS" link navigates to `/contract/[contractId]/[cycleNumber]/settled`.

### Payout Card
`PayoutCard` component, `yellow` variant, `perspective="winner"` — "[LOSER] OWES YOU: [FORFEIT]".

### Pester CTA
"PESTER [NAME]" — full-width, `red` background, white text, font-black, italic, ALL CAPS, 3px border, `shadow-sm`. Press-shift interaction. Sends push notification to the loser; stays on screen after tap. If a pester was sent in the last 24 hours, show a muted "PESTERED [X]H AGO" label below the button instead of enabling it.

### Settle CTA
"MARK AS SETTLED" — full-width, outlined button (white background, 3px `ink` border, `shadow-sm`). Tap records `settled_at`, archives the debt, and navigates to `/dashboard`. Confirmation dialog: "Once marked as settled, this debt is archived. Continue?".
