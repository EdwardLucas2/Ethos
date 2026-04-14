# Evidence Approval

Vote on a single piece of evidence. Large photo, clear context, binary decision.

**Route:** `/contract/[contractId]/[cycleNumber]/evidence/[evidenceId]`
**PRD:** Section 5.9
**Stitch:** `screen.png` — uses `#4361EE` for blue (use `#3B82F6`). TopBar uses white background (use `stack` variant with yellow background).

## States
- Unvoted — both APPROVE and REJECT buttons neutral; no selection highlighted
- Voted — current user's choice highlighted; other button available to change vote
- Resolved — cycle has settled; `ApproveRejectBar` is in `disabled` mode; shows final outcome only

## Data
- Evidence item — photo_id, note, submitted_at
- Submitter participant — name, habit, avatar
- Votes — all decisions cast (to show consensus summary)
- Current user's existing vote for this evidence (if any)
- Cycle status — to determine resolved state

## Sections

### TopBar
`stack` variant. Back navigates to `/contract/[contractId]/[cycleNumber]/evidence/review`.

### Context Banner
"VERIFY [NAME]'S PROOF" — font-black, uppercase, `text-xl`. Below: the participant's commitment rendered as a highlighted chip: e.g. "GYM 3X/WEEK" — `yellow` background, 3px border, font-black, italic, ALL CAPS. This establishes what the evidence is supposed to prove.

### Evidence Display
Full-width photo (if present), 3px border, `shadow-md`. Below the photo: timestamp badge (e.g. "WED 7AM") — small `ink` bordered chip. Note (if present) — body text, sentence case, `ink-secondary` colour. Consensus summary beneath: "APPROVED BY [NAME], [NAME]" or "AWAITING: [NAME]" — `text-xs`, `ink-secondary`.

If no photo (note-only evidence), the photo area renders a placeholder with a `edit_note` icon and "TEXT NOTE" label.

### Approve/Reject Bar
`ApproveRejectBar` component, fixed to bottom. On vote: records vote, navigates back to `/contract/[contractId]/[cycleNumber]/evidence/review`.
