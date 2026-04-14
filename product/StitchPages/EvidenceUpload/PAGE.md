# Evidence Upload

Capture and submit proof of habit completion. Fast and low-friction.

**Route:** `/contract/[contractId]/[cycleNumber]/evidence/upload`
**PRD:** Section 5.7
**Stitch:** `screen.png` — static HTML cannot represent a live camera; implement as a native camera component (Expo Camera).

## States
- Camera active — live viewfinder, no photo taken yet; "UPLOAD PROOF" disabled
- Photo captured — still preview shown in place of viewfinder; "RETAKE" and "UPLOAD PROOF" both active
- Note only — user dismissed camera / opted for text only; photo area shows a placeholder; "UPLOAD PROOF" active
- Submitting — button shows upload progress indicator, inputs disabled
- Error — upload failed; banner with retry option

## Data
- Contract — name (for context header)
- Current cycle — cycle_number, status (must be `active`; screen should be unreachable otherwise)
- Current user's incomplete habit_actions for this cycle (service auto-assigns submitted evidence to the next incomplete action)

## Sections

### TopBar
`stack` variant. Back navigates to `/contract/[contractId]/[cycleNumber]/active`.

### Context Header
Small label above the camera: "PROOF FOR: [HABIT]" — the current user's habit text, uppercase, `ink-secondary` colour. Reminds the user what they're proving.

### Camera / Preview Area
Full-width square (1:1 aspect ratio), 3px border, `shadow-md`. In camera-active state: live `expo-camera` viewfinder with a capture button centred at the bottom of the frame (large circle, white, 3px `ink` border). In photo-captured state: still image preview. "RETAKE" text button below the frame, centred, `red` colour.

If the user has no camera permission or taps a "text only" affordance, this area shows a dashed-border placeholder with "TAP TO ADD PHOTO" label.

### Note Input
Full-width `FormField` with label "ADD A NOTE" and placeholder "e.g. Crushed legs today!". Optional — submission is valid with photo only, note only, or both.

### Upload CTA
"UPLOAD PROOF" — full-width, `blue` background, white text, font-black, italic, ALL CAPS, 3px border, `shadow-sm`. Disabled until at least one of photo or note is present. On success navigates back to `/contract/[contractId]/[cycleNumber]/active`.
