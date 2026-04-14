# Contract Overview — Active Cycle

The operational hub for a contract during an active cycle. Track progress, upload evidence, and review others' proof.

**Route:** `/contract/[contractId]/[cycleNumber]/active`
**PRD:** Section 5.6
**Stitch:** `screen.png` — TopBar uses white background + gavel icon (use `stack` variant with yellow background instead); header has a wallet icon on the right (ignore — `stack` variant uses hamburger right).

## States
- Loading — skeleton for progress rows and proof feed
- Behind — user hasn't hit frequency target; "SNAP PROOF" CTA prominent
- On track — user hit target; focus shifts to reviewing others; "REVIEW [NAME]'S PROOF" CTA
- All caught up — no actions needed; muted "ALL CAUGHT UP" CTA
- No previous cycle — `PeriodSwitcher` hides or disables "LAST WEEK"

## Data
- Contract — name, forfeit, period
- Current cycle — cycle_number, start_date, end_date, status
- Participants — name, habit, frequency, avatar
- Habit actions + evidence aggregate per participant (verified count, pending count)
- Latest evidence items for proof feed preview
- Current user's unreviewed evidence items

## Sections

### TopBar
`stack` variant.

### Period Switcher
`PeriodSwitcher` component, full-width. "THIS WEEK" active (left segment filled `yellow`). "LAST WEEK" navigates to `/contract/[contractId]/[cycleNumber - 1]/unsettled`. Disabled if no previous cycle exists.

### Stakes Card
White card, 3px border, `shadow-md`. Forfeit displayed as "ON THE LINE: [FORFEIT]" — forfeit text in `yellow` background chip, font-black, italic, ALL CAPS. Below: cycle timeline bar showing start date → today marker → end date. Time remaining badge top-right: e.g. "14H 20M" or "2 DAYS LEFT" in a small bordered chip; red if urgent (≤ 24h).

### Progress Arena
Section header "PROGRESS ARENA" or contract name. Vertical stack of `ParticipantRow` components with `verified`, `pending`, `total` props — one per participant. Current user's row rendered first. Each row shows name, habit label (e.g. "GYM 3X/WEEK"), fractional count (e.g. "2/3"), and `ProgressBar`.

### Proof Feed Preview
Section header "PROOF FEED". Horizontal scrollable row of `EvidenceThumbnail` components — latest 4–6 uploads across all participants. Final tile is always an `isViewAll` placeholder: "VIEW ALL PROOF" → navigates to `/contract/[contractId]/[cycleNumber]/evidence/review`. Unreviewed thumbnails show a small "REVIEW" badge overlay.

### Primary CTA
Full-width button, font-black, italic, ALL CAPS, 3px border, `shadow-sm`. Press-shift interaction.
- "SNAP PROOF" — `blue` background, white text → navigates to `/contract/[contractId]/[cycleNumber]/evidence/upload`
- "REVIEW [NAME]'S PROOF" — `ink` background, white text → navigates to `/contract/[contractId]/[cycleNumber]/evidence/[evidenceId]` (the specific unreviewed item)
- "ALL CAUGHT UP" — `surface` background, `ink-secondary` text, no shadow (muted; not tappable)

### Opt-Out Footer
Rendered **only on the last day of the cycle**. Text link: "Opt out of next cycle →". Tap shows a confirmation bottom sheet. On confirm, participant is flagged `opted_out_of_next_cycle = true`; footer updates to "You're opted out of the next cycle" (non-interactive).
