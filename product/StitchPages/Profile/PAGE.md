# Profile

Basic account information and logout. MVP placeholder — minimal functionality.

**Route:** `/profile`
**PRD:** Section 5.15
**Stitch:** None — no mockup exists. Design consistent with established visual style.

## States
- Loading — skeleton for user info fields
- Populated — display name, tag, email visible

## Data
- Current user — display_name, tag, email, avatar_id

## Sections

### TopBar
`default` variant.

### User Card
White card, 3px border, `shadow-md`. Centred layout:
- Square avatar (80×80, 3px border, `shadow-sm`). Placeholder initials if no avatar_id.
- Display name — font-black, uppercase, `text-2xl`, below avatar.
- Tag — `text-sm`, `ink-secondary`, e.g. "@edward4f2a".

### Info Fields
Read-only labelled fields (same visual style as `FormField` but non-interactive):
- "DISPLAY NAME" — display_name value
- "EMAIL" — email value

For MVP these are display-only. No edit functionality.

### Logout
"LOG OUT" — full-width, outlined button (white background, 3px `red` border, `red` text, `shadow-sm`). Tap shows confirmation dialog: "You'll need to log in again. Continue?". On confirm: clears session, navigates to `/login`.

### BottomTabBar
`profile` tab active.
