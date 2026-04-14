# Friends

Manage your one-way contacts list. Find users by tag, add them for quick access when building contracts.

**Route:** `/friends`
**PRD:** Section 5.14
**Stitch:** None — no mockup exists. Design consistent with established visual style.

## States
- Loading — skeleton rows
- Empty — no contacts yet; centred prompt "FIND FRIENDS BY TAG" with the search bar prominent
- Populated — contact list with search bar at top
- Searching — live results appear below the search input as user types; existing contacts shown with a "REMOVE" affordance, non-contacts with an "ADD" affordance

## Data
- Current user's contacts list (contact_user_id → user display_name, tag, avatar_id)
- Search results (users matching tag prefix query)

## Sections

### TopBar
`default` variant.

### Search Bar
Full-width input, 3px border, `shadow-sm`, white background. Placeholder: "SEARCH BY TAG (e.g. alex4f2a)". Prefix search fires on each keystroke (debounced). Results appear in a list below, replacing the contacts list while the input is focused. Each result row: avatar + display name + tag. Non-contact result: "ADD" button (small, outlined, `ink` border). Already-a-contact result: "ADDED ✓" label (muted).

### Contacts List
Section header "YOUR CONTACTS" — font-black, uppercase, `text-sm`, `ink-secondary`. Vertical list of rows, each separated by a 2px bottom border. Each row: square avatar (32×32, 2px border) + display name (font-black, uppercase) + tag (text-xs, `ink-secondary`). Remove affordance: swipe-to-reveal or a "⋯" overflow menu with "Remove Contact" option (confirmation required).

Empty state within the list (no contacts, not searching): "You haven't added any contacts yet. Search by tag to find friends." — body text, centred, `ink-secondary`.

### BottomTabBar
`friends` tab active.
