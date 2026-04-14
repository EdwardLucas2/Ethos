# Shared Components

Shared UI components live in `app/components/`.
All components must follow the design system defined in [product/DESIGN.md](../product/DESIGN.md)

---

## Index

**Primitives**

- [ProgressBar](#progressbar) — multi-tone verified/pending/empty progress bar, used in 5+ places
- [PeriodSwitcher](#periodswitcher) — THIS WEEK / LAST WEEK segmented toggle
- [StatusBadge](#statusbadge) — SIGNED / WAITING / DRAFTING / CLEARED / OWES pill label
- [FormField](#formfield) — labelled text input with focus state
- [HeroStamp](#herostamp) — large rotated stamp for victory/defeat screens

**Navigation**

- [TopBar](#topbar) — sticky app header with logo and contextual actions
- [BottomTabBar](#bottomtabbar) — fixed bottom navigation bar

**Dashboard**

- [AlertBanner](#alertbanner) — full-width coloured action alert (verify / challenge / settle)
- [ActiveContractCard](#activecontractcard) — tappable contract tile with progress and CTA button
- [FAB](#fab) — floating action button to create a contract

**Contract Building**

- [GroundRulesCard](#groundrulescard) — contract name, period, forfeit, start date (edit or read-only)
- [YourCommitmentSection](#yourcommitmentsection) — habit text input + frequency selector
- [ParticipantRow](#participantrow) — avatar + name + habit label + status badge, with optional rank and progress

**Evidence**

- [EvidenceThumbnail](#evidencethumbnail) — square cropped photo with participant name label
- [EvidenceCard](#evidencecard) — full evidence detail with photo, timestamp, status, and vote summary
- [ApproveRejectBar](#approverejectbar) — fixed-bottom REJECT / APPROVE button pair

**Settlement**

- [PayoutCard](#payoutcard) — high-contrast debt statement ("[LOSER] OWES [WINNER]: [FORFEIT]")
- [ContractDetailsCard](#contractdetailscard) — habit + opponent summary for resolution screens

---

## ProgressBar

**Purpose** — Shows a participant's verified, pending, and remaining progress within a cycle. The three-tone fill is central to the app's visual language and must be consistent everywhere it appears.

**Variants**

- _Active_ — solid fill (verified) + hatched fill (pending) + empty
- _Complete_ — fully solid, used when cycle is resolved
- _Failed_ — grey or empty fill, used in settled/failed state

**Props**

- `verified` — count of verified submissions
- `pending` — count of pending submissions
- `total` — total required frequency (determines bar width proportions)
- `size` — compact (dashboard cards) or standard (contract overview rows)

**Design notes** — 3px border, `ink` colour. Verified fill is `yellow`. Pending fill is `yellow` with a 45° diagonal hatch pattern at 10% opacity. Hard drop shadow `shadow-sm` on the bar container.

**File** — `app/components/ProgressBar.tsx`

---

## PeriodSwitcher

**Purpose** — Lets the user toggle between the current active cycle ("THIS WEEK") and the previous cycle ("LAST WEEK") on contract overview and settled screens.

**Variants**

- _This week active_ — left segment filled, right inert
- _Last week active_ — right segment filled, left inert

**Props**

- `activePeriod` — `"current"` or `"previous"`
- `onSelect` — callback with the selected period
- `previousDisabled` — hides or disables the "LAST WEEK" option when no previous cycle exists

**Design notes** — Full-width container, 4px border, hard offset shadow. Active segment uses `yellow` fill. Both segments are ALL CAPS, font-black, tracked wide.

**File** — `app/components/PeriodSwitcher.tsx`

---

## StatusBadge

**Purpose** — Communicates the current state of a participant (in the lobby) or the outcome of a cycle (in settlement). One component covers all statuses; the mapping from status to colour is centralised here.

**Variants** — driven by `status` prop:

- `SIGNED` — black background, white text
- `WAITING` — yellow background, black text
- `DRAFTING` — blue background, white text, italic
- `CLEARED` — white background, black border
- `OWES` — black background, yellow text

**Props**

- `status` — one of the values above

**Design notes** — Small, inline. 2px border. Pill shape is acceptable here (DESIGN.md exception for status badges). ALL CAPS, font-black, tight tracking.

**File** — `app/components/StatusBadge.tsx`

---

## FormField

**Purpose** — A labelled text input used across auth screens (email, password) and the contract builder (contract name, habit, forfeit). The consistent input primitive for the whole app.

**Variants**

- _Default_ — empty, unfocused
- _Focused_ — background shifts to a light blue tint
- _Error_ — red border, inline error message below

**Props**

- `label` — ALL CAPS label text above the input
- `placeholder`
- `value` / `onChangeText`
- `type` — `text`, `email`, `password`, `number`
- `error` — optional error string shown below

**Design notes** — 3px border, white background, large font-bold placeholder. Focus state uses `#3B82F6` at 10% opacity as the background fill (no outline ring). Label is `text-xs font-black uppercase tracking-widest`.

**File** — `app/components/FormField.tsx`

---

## HeroStamp

**Purpose** — The dramatic centrepiece on resolution screens. A large, rotated text stamp that instantly communicates win or loss. Designed to be confrontational and impossible to miss.

**Variants**

- _Victory_ — neon green background, black text, "YOU'RE OWED"
- _Defeat_ — red background, white text, "PAY UP"

**Props**

- `variant` — `"victory"` or `"defeat"`
- `label` — override the default text if needed

**Design notes** — Rotated approximately −10°. 6px border. `shadow-lg` (8px offset). Very large font, Black weight, italic, ALL CAPS. The rotation gives it the feel of a physical rubber stamp.

**File** — `app/components/HeroStamp.tsx`

---

## TopBar

**Purpose** — Persistent sticky header present on every screen. Provides app identity and contextual actions.

**Canonical design** — Yellow (`#FDDC00`) background, 4px bottom border. Left: hamburger menu icon. Centre-left: "ETHOS" wordmark. Right: user avatar (square, 2px border). Reference: ContractBuilder_Invitee mockup.

**Variants**

- _Default_ — canonical yellow header described above. Used on tab screens (Dashboard, Friends, Profile).
- _Stack_ — back arrow (`arrow_back`) on the left, "ETHOS" wordmark centre-left, hamburger icon on the right (avatar dropped). Used on all stack screens navigated into from the tabs: contract lobby, contract overview, evidence, unsettled, and settled screens.
- _Back_ — back arrow (`arrow_back`) on the left, "ETHOS" wordmark centre-left, avatar on the right (no hamburger). Used on fully focused screens that sit above all navigation: PayUp, YouAreOwed.
- _Auth_ — white background, gavel icon + "ETHOS" wordmark on the left, "LOGIN" or "SIGN UP" link on the right. Used on auth screens only.

**Props**

- `variant` — `"default"` | `"stack"` | `"back"` | `"auth"`
- `onBack` — back navigation callback for `"stack"` and `"back"` variants
- `avatarUri` — user avatar image for `"default"` and `"back"` variants

**Design notes** — 4px bottom border, `shadow-sm`. Sticky, `z-50`. The "ETHOS" wordmark is italic, Black weight, tracking tighter, ALL CAPS. Avatar is square (not circular), 2px border, 40×40.

**File** — `app/components/TopBar.tsx`

---

## BottomTabBar

**Purpose** — Fixed bottom navigation bar present on all main screens. Suppressed on focused task screens (Evidence Approval, PayUp).

**Props**

- `activeTab` — which tab is currently selected (fills with `yellow` or accent colour)
- `tabs` — array of tab definitions (icon, label, destination) — configured once at the app level

**Design notes** — 4px top border, full width, height 80px. Tabs divided by vertical 4px borders. Active tab fills with `yellow`. All tab labels are ALL CAPS, font-black, `text-xs`. Tapping a tab should trigger the 2px press-shift interaction.

**File** — `app/components/BottomTabBar.tsx`

---

## AlertBanner

**Purpose** — High-urgency action prompts stacked at the top of the Dashboard. Each banner surfaces one pending action (verify proof, view challenge, settle cycle) and navigates directly to the relevant screen on tap.

**Variants** — driven by `type`:

- `verify` — blue background, white text, `verified_user` icon
- `challenge` — yellow background, black text, `mail` icon
- `settle` — red background, white text, `payments` icon

**Props**

- `type` — `"verify"` | `"challenge"` | `"settle"`
- `message` — the action text (e.g. "ALEX UPLOADED PROOF. [VERIFY]")
- `onPress` — navigation callback

**Design notes** — Full width, 4px border, `shadow-sm`. Icon + message on the left, `chevron_right` on the right. ALL CAPS, font-black. The three colours (`blue`, `yellow`, `red`) map directly to the DESIGN.md semantic colour roles.

**File** — `app/components/AlertBanner.tsx`

---

## ActiveContractCard

**Purpose** — The primary card on the Dashboard summarising one active contract: who you're up against, your progress this cycle, time remaining, and a contextual action button.

**Variants** — the CTA button at the bottom changes based on state:

- _Behind_ — "SNAP PROOF" (blue or standard)
- _Urgent_ — "SNAP PROOF" (red, time-remaining badge in red)
- _Review needed_ — "REVIEW [NAME]'S PROOF"
- _All caught up_ — "ALL CAUGHT UP" (muted)

**Props**

- `contractName`
- `opponentLabel` — e.g. "VS ALEX" or "SQUAD BATTLE"
- `verified`, `pending`, `total` — passed through to `ProgressBar`
- `timeRemaining` — string, e.g. "14H 20M" or "2H REMAINING"
- `isUrgent` — turns time badge red
- `ctaState` — `"snap"` | `"review"` | `"caught-up"`
- `onPress` — navigates to Contract Overview
- `onCta` — action for the CTA button

**Design notes** — White `surface-raised` background, 4px border, `shadow-lg`. `shadow-md` is also acceptable. The CTA button is full-width, font-black italic, ALL CAPS. Time-remaining badge is a small bordered chip top-right of the card.

**File** — `app/components/ActiveContractCard.tsx`

---

## FAB

**Purpose** — Persistent floating action button on the Dashboard to start a new contract.

**Props**

- `onPress`

**Design notes** — Fixed bottom-right, above the tab bar. Red (`#DC2626`) background, white `+` icon. 4px border, `shadow-md`. Press interaction shifts 2px and removes shadow.

**File** — `app/components/FAB.tsx`

---

## GroundRulesCard

**Purpose** — Displays or collects the core contract parameters: name, cycle period, forfeit, and start date. Used in both the Creator builder (editable) and the Invitee view (read-only).

**Variants**

- _Edit_ — `FormField` inputs for each value, period shown as a segmented selector or dropdown
- _Read-only_ — values displayed as static text; forfeit highlighted in `yellow` fill, start date in muted fill

**Props**

- `mode` — `"edit"` | `"read-only"`
- `contractName`, `period`, `forfeit`, `startDate`
- `onChange` — callback for edit mode

**Design notes** — White background card, 3px border, `shadow-md`. Section header "GROUND RULES" with a `gavel` icon, separated by a 2px bottom border. In read-only mode, forfeit gets a `yellow` background chip to draw attention to the stake.

**File** — `app/components/GroundRulesCard.tsx`

---

## YourCommitmentSection

**Purpose** — Collects the user's personal commitment to a contract: their habit (free text) and how many times per cycle they'll do it. Appears identically on both the Creator and Invitee contract builder screens.

**Props**

- `habit` / `onHabitChange`
- `frequency` / `onFrequencyChange`
- `period` — adapts the frequency label (e.g. "times per week" vs "times per 2 weeks")

**Design notes** — Blue (`#2979FF`) background, white text, 3px border, `shadow-lg`. Habit input is a full-width white-background `FormField` inset on the blue card. Frequency selector is a row of numbered square buttons (1–5 + "Other"); selected button uses `yellow` fill, 4px border. Each button has the press-shift interaction.

**File** — `app/components/YourCommitmentSection.tsx`

---

## ParticipantRow

**Purpose** — Displays one participant's status within a contract context. Used in the lobby (showing who has signed), in Squad Intel (showing what everyone committed to), and in standings (showing final results). Optional rank and progress props extend it for the standings context.

**Props**

- `name`
- `habit` — e.g. "GYM 3X/WEEK"
- `avatarUrl`
- `status` — passed to `StatusBadge`
- `rank` — optional number, shown as a bold prefix (01, 02, 03) in standings view
- `verified`, `pending`, `total` — optional, render `ProgressBar` when provided
- `isCurrentUser` — highlights the row (e.g. "YOU" label, slightly different background)

**Design notes** — White background, 2–3px bottom border between rows. Avatar is a square with 2px border (not circular, except potentially in the lobby). Name is font-black uppercase. Habit is `text-xs font-bold uppercase opacity-70`. `StatusBadge` sits flush right.

**File** — `app/components/ParticipantRow.tsx`

---

## EvidenceThumbnail

**Purpose** — A small square preview of an evidence photo used in the proof feed grids on the Contract Overview screens. Tapping navigates to the full evidence detail or review flow.

**Props**

- `imageUri`
- `participantName` — shown as a label overlay in the bottom-left corner
- `onPress`
- `isViewAll` — renders a "VIEW ALL PROOF" placeholder tile instead of an image

**Design notes** — Fixed aspect ratio (1:1). 4px border, `shadow-sm`. Participant name label is a small `yellow` banner overlaid bottom-left with 2px top and right borders. The `isViewAll` tile uses a dashed border and centred text.

**File** — `app/components/EvidenceThumbnail.tsx`

---

## EvidenceCard

**Purpose** — Full evidence submission card shown in the Evidence Review feed. Displays the photo, timestamp, review status, and vote attribution. The primary unit in the evidence browsing flow.

**Variants**

- _Review needed_ — red border, red drop shadow, rotated "REVIEW NEEDED" tag top-right. Tappable, leads to Evidence Approval.
- _Verified_ — standard black border/shadow, green check icon, "APPROVED BY [NAME]" attribution.
- _Rejected_ — standard border, red icon, rejection attribution.
- _Pending_ — standard border, orange status, "WAITING FOR [NAME]" attribution.

**Props**

- `imageUri`
- `timestamp` — e.g. "WED 7AM"
- `note` — optional text note from the uploader
- `status` — `"review-needed"` | `"verified"` | `"rejected"` | `"pending"`
- `attribution` — who approved/rejected/is waiting
- `onPress`

**Design notes** — Full-width card, photo on the left third (square aspect), metadata on the right. 4px border. Review-needed variant uses red as both the border colour and shadow colour (`shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]`). The "REVIEW NEEDED" tag is rotated ~3° and positioned overlapping the top-right corner.

**File** — `app/components/EvidenceCard.tsx`

---

## ApproveRejectBar

**Purpose** — Fixed-to-bottom action zone on the Evidence Approval screen. Two large equal-width buttons for the binary vote.

**Props**

- `onApprove`
- `onReject`
- `currentVote` — `"approved"` | `"rejected"` | `null` — highlights the previously cast vote if returning to a voted item
- `disabled` — when the cycle is resolved, renders read-only

**Design notes** — Fixed to bottom, full width, 4px top border, frosted background (`bg-white/80 backdrop-blur`). REJECT button is red, APPROVE button is blue. Both are font-black, text-xl, ALL CAPS, with thumb icons. Press-shift interaction on each.

**File** — `app/components/ApproveRejectBar.tsx`

---

## PayoutCard

**Purpose** — High-contrast card stating a specific debt outcome. Appears on the Contract Settled screen (listing all debts) and on the You're Owed screen (the winner's primary focus).

**Variants**

- _Yellow_ — used on the You're Owed screen ("ALEX OWES YOU: A PINT AT THE PUB")
- _Black_ — used on the Contract Settled screen for higher contrast against the white background

**Props**

- `loserName`
- `winnerName`
- `forfeit` — e.g. "A PINT AT THE PUB"
- `perspective` — `"winner"` | `"loser"` | `"neutral"` — adjusts the pronoun ("YOU OWE" vs "[NAME] OWES YOU" vs "[NAME] OWES [NAME]")

**Design notes** — Bold border, `shadow-sm`. Forfeit text is font-black, italic, ALL CAPS, large. An optional icon (e.g. `sports_bar`) can accompany the forfeit label.

**File** — `app/components/PayoutCard.tsx`

---

## ContractDetailsCard

**Purpose** — A compact summary of the contract context on resolution screens: what the habit was and who the opponent is. Provides the "why did this happen" context alongside the `PayoutCard`.

**Props**

- `habit` — e.g. "Gym 3x/week"
- `opponentName`
- `opponentAvatarUri`
- `onViewCycleDetails` — navigates to the full Contract Settled screen

**Design notes** — White background, 4px border, `shadow-lg`. "CONTRACT DETAILS" section header with a `verified` icon. Habit shown as italic bold text. Opponent shown as an avatar + name row. "VIEW CYCLE DETAILS" is a text link with heavy underline decoration and a forward arrow.

**File** — `app/components/ContractDetailsCard.tsx`
