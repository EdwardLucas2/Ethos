# Ethos MVP - Product Requirements Document

Ethos is a social accountability app where friends create habit contracts, stake real-world forfeits, and hold each other accountable through evidence-based verification. Think "bet with your mates that you'll actually go to the gym" — but structured and tracked.

## 1. Core Concepts

### Contract
The top-level agreement between 2–10 friends. Defines who's in, what's at stake, and how long each cycle lasts. A contract lives indefinitely through auto-renewing cycles until all but one participants opt out.

### Cycle
A single time-bound period within a contract (e.g., Week 1, Week 2). Each cycle has its own progress tracking, evidence, votes, and resolution outcome. When one cycle ends, the next begins immediately.

### Participant
A user within a contract. Each participant sets their own habit (free text) and frequency (X times per cycle period). These are locked once signed and fixed for the life of the contract.

### Evidence
Proof that a participant completed their habit. Can be a photo, text, or both — but at least one must be provided. Evidence is submitted during the active cycle and voted on by other participants.

### Vote
A binary approve/reject decision on a piece of evidence. Only other participants can vote (you can't vote on your own evidence). Majority rules. Voters can change their vote before resolution.

### Forfeit
The real-world stake everyone agrees to at contract creation (e.g., "A Pint", "$50"). Ethos does not handle payments — this is pure honour system. The forfeit is fixed for the life of the contract.

### Rough Data Relationships
Contract
  ├── name, forfeit, period (weekly/bi-weekly/monthly), startDate, status
  ├── Participants[] (2–10)
  │     ├── user, habit (free text), frequency (int), signedStatus
  │     └── optedOutOfNextCycle (bool)
  └── Cycles[]
        ├── startDate, endDate, status (active/pending_resolution/settled)
        ├── Evidence[]
        │     ├── participant, photo?, text?, timestamp
        │     └── Votes[] (approve/reject, voterId)
        └── Resolution
              ├── winners[], losers[]
              └── debts[] (who owes whom)

## 2. Contract Lifecycle

                    ┌─────────────────────────────────┐
                    │                                  │
                    ▼                                  │
DRAFT/LOBBY ──→ ACTIVE (Cycle N) ──→ PENDING RESOLUTION (Cycle N)
                    │                        │
                    │                        ▼
                    │                    SETTLED (Cycle N)
                    │                        │
                    │          ┌─────────────┤
                    │          │             │
                    │          ▼             ▼
                    │   AUTO-RENEW      CONTRACT ENDS
                    │   (Cycle N+1)    (all opted out)
                    │          │
                    └──────────┘

### State Transitions

| From | To | Trigger |
|---|---|---|
| **Draft/Lobby** | **Active** | Creator taps "Start Contract" AND at least 2 participants (creator + 1) have signed AND start date reached |
| **Draft/Lobby** | **Cancelled** | Start date reached but fewer than 2 participants signed |
| **Active** | **Pending Resolution** | Cycle end date reached. Evidence submission locks. New cycle starts in parallel |
| **Pending Resolution** | **Settled** | All evidence has majority votes OR next cycle's end date is reached (remaining pending evidence auto-approves) |
| **Settled** | **Active (next cycle)** | Auto-renewal. Participants who opted out on the last day of the previous cycle are removed |
| **Settled** | **Contract Ends** | All participants have opted out |

### The Overlap Period
When a cycle ends, two things happen simultaneously:
1. **Cycle N** enters Pending Resolution — no new uploads, voting begins
2. **Cycle N+1** enters Active — progress resets, new evidence can be uploaded

Users toggle between these views on the Contract Overview screen.

## 3. Resolution Logic

At the end of a cycle, once all evidence is resolved (voted on or auto-approved), the system evaluates:

| Scenario | Outcome |
|---|---|
| **Everyone hit their target** | Nobody owes anything |
| **Some hit, some didn't** | Those who missed owe the forfeit to those who hit. Distributed as evenly as possible among winners |
| **Nobody hit their target** | The person(s) with the least verified progress owe the forfeit to the person(s) with the most verified progress |
| **Exact tie at the bottom and top** | Nobody owes anything |

**Clarifications:**
- Only **verified** evidence (majority-approved) counts toward the final tally
- In the "total failure" scenario, only the bottom-ranked person(s) owe, and only to the top-ranked person(s) — not a cascading debt
- If the bottom is tied, all tied losers owe. If the top is tied, all tied winners are owed
- The forfeit is the same label for everyone (e.g., "A Pint") — there's no splitting of monetary amounts

## 4. Navigation Structure

### Bottom Tab Bar (persistent, all screens except auth)
| Tab | Icon | Destination |
|---|---|---|
| **Home** | grid_view | Home Dashboard — alerts, active contracts, pending resolutions |
| **Contracts** | gavel | Full contract list — active, pending, settled history |
| **Friends** | group | Friend management — add/remove in-app friends |
| **Profile** | person | Placeholder for MVP — name, email, logout |

### Global Action
- Floating Action Button (FAB) on Home screen to create a new contract

### Screen Map
```
Auth Flow:
  Sign Up → Home Dashboard
  Login → Home Dashboard

Main Flow:
  Home Dashboard
    ├── [tap contract card] → Contract Overview (Active Cycle)
    ├── [tap verification alert] → Evidence Approval
    ├── [tap settle alert] → Contract Overview (Unsettled)
    ├── [tap invite alert] → Challenge Received (Invitee)
    └── [tap FAB "+"] → Contract Builder (Creator)

  Contract Overview (Active Cycle)
    ├── [tap "Snap Proof"] → Evidence Upload
    ├── [tap proof feed / "Review"] → Evidence Review
    ├── [tap period switcher "Last Week"] → Contract Overview (Unsettled)
    └── [tap "Opt Out"] → Confirmation → removes user at cycle end

  Contract Overview (Unsettled / Last Week)
    ├── [tap "Review Now"] → Evidence Review
    ├── [all votes in → auto-resolves] → Contract Settled
    └── [tap period switcher "This Week"] → Contract Overview (Active Cycle)

  Contract Settled
    ├── [if you lost] → Pay Up (Loser)
    ├── [if you won] → You're Owed (Winner)
    └── [tap "Share Results"] → native share sheet

  Evidence Upload → [submit] → back to Contract Overview
  Evidence Review → [tap unreviewed card] → Evidence Approval
  Evidence Approval → [approve/reject] → back to Evidence Review

  Pay Up (Loser) → [tap "I Know"] → dismisses, returns to dashboard
  You're Owed (Winner)
    ├── [tap "Pester"] → sends notification to loser
    └── [tap "Mark as Settled"] → archives the debt
```

## 5. Screens

### 5.1 Sign Up

**Purpose:** Create a new Ethos account.

**Entry points:** "Request Access" link on Login screen, or fresh app open with no session.

**User Stories:**
- "As a new user, I want to create an account quickly so I can start challenging my friends."

**Features:**
- Google sign-in button (placeholder for MVP — not functional)
- Apple sign-in button (placeholder for MVP — not functional)
- Email address input
- Password input
- "Create Account" primary CTA
- Link to Login for existing users

**States:**
- **Default:** Empty form
- **Validation error:** Inline errors on invalid email format or weak password
- **Loading:** Button shows spinner on submit
- **Error:** Server error displayed as banner

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Submit valid form | Home Dashboard |
| Tap "Login" link | Login screen |

**MVP Auth Note:** Email + password only. Google/Apple buttons are visible but disabled or show "Coming Soon" on tap.

### 5.2 Login

**Purpose:** Authenticate an existing user.

**Entry points:** App open with no active session, or "Login" link from Sign Up.

**User Stories:**
- "As a returning user, I want to log in quickly to check my contracts."

**Features:**
- Email address input
- Password input with "Forgot?" link
- "Continue" primary CTA
- "Send Email OTP" secondary action
- Google/Apple sign-in buttons (placeholders — not functional for MVP)
- Link to Sign Up for new users

**States:**
- **Default:** Empty form
- **Validation error:** Inline error on bad credentials
- **Loading:** Button shows spinner

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Submit valid credentials | Home Dashboard |
| Tap "Sign Up" link | Sign Up screen |
| Tap "Forgot?" | Password reset flow (MVP: can be email-based simple flow) |

### 5.3 Home Dashboard

**Purpose:** The nerve centre. Shows the most urgent actions and a summary of all active and pending contracts. This is where users spend most of their time.

**Entry points:** App open (authenticated), bottom tab "Home", back-navigation from most screens.

**User Stories:**
- "As a user, I want to see if anyone has uploaded proof I need to verify so I can keep the game moving."
- "As a user, I want to see which contract has the least time remaining so I know what to prioritise today."
- "As a user with multiple contracts, I want a summary of my overall progress."
- "As a user, I want to see if a past cycle is still unsettled so I can nudge my friends to vote."
- "As a user, I want to see incoming contract invites immediately."

**Sections:**

**A. Alert Stack (top of scroll)**
A stack of high-contrast banners, ordered by urgency:
- **Verification Needed:** "[Name] uploaded proof. [VERIFY]" — taps through to Evidence Approval
- **New Invite:** "[Name] challenged you to '[Contract Name]'. [VIEW]" — taps through to Challenge Received
- **Settle Up:** "Last week's results are in! [SETTLE]" — taps through to Contract Overview (Unsettled)

**B. Active Contracts (main list)**
Vertical list of cards for every contract the user is currently in:
- Contract name and participant names/avatars
- Multi-tone progress bar: solid fill = verified, patterned fill = pending, empty = remaining
- Dynamic CTA: "SNAP PROOF" button if the user hasn't completed enough this cycle
- Time remaining badge (e.g., "2 DAYS LEFT")
- Tapping the card navigates to Contract Overview (Active Cycle)

**C. Pending Resolution (secondary section)**
Slightly muted section for cycles that have ended but aren't settled:
- Shows contract name, final progress summary, and "X reviews needed"
- Tapping navigates to Contract Overview (Unsettled)

**D. FAB (Floating Action Button)**
Persistent "+" button to create a new contract. Navigates to Contract Builder (Creator).

**States:**
- **Empty (new user):** No contracts. Show onboarding prompt: "No active contracts. Challenge your friends!" with prominent create CTA
- **Populated:** Full alert stack + contract cards
- **All caught up:** No alerts, contracts show "Waiting on others" or progress summaries

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap contract card | Contract Overview (Active Cycle) |
| Tap verification alert | Evidence Approval |
| Tap invite alert | Challenge Received (Invitee) |
| Tap settle alert | Contract Overview (Unsettled) |
| Tap FAB "+" | Contract Builder (Creator) |

---

### 5.4 Contract Builder (Creator)

**Purpose:** Create a new contract and invite friends. The creator sets the ground rules and makes their own commitment before inviting others.

**Entry points:** FAB on Home Dashboard.

**User Stories:**
- "As a creator, I want to name the contract so we have a shared identity."
- "As a creator, I want to set the forfeit so everyone knows what's at stake."
- "As a creator, I want to pick the cycle period and start date."
- "As a creator, I want to invite friends from my in-app friend list."
- "As a creator, I want to set my own habit and frequency before sending invites so my friends see my commitment."

**Sections:**

**A. Ground Rules**
- Contract name (free text input)
- Cycle period selector: Weekly / Bi-Weekly / Monthly
- Forfeit input (free text, e.g., "A Pint", "$20")
- Start date picker (today or a future date)

**B. Invite Friends**
- Search and select from in-app friends list
- Up to 9 invitees (10 total including creator)
- Shows selected friends with remove option

**C. Your Commitment**
- Habit input (free text, e.g., "Gym", "Cold Plunge")
- Frequency selector (number input, label adapts to period: "X times per week" / "X times per 2 weeks" / "X times per month")

**D. Actions**
- "Sign Contract" primary CTA — locks the creator's commitment and sends invites
- "Decline" / cancel — discards the draft

**Lobby View (after invites sent):**
Once invites go out, this screen transitions to a live lobby showing:
- All participants with status badges: `WAITING` (hasn't responded), `DRAFTING` (joined, editing habit), `SIGNED` (locked in and ready)
- Each participant's habit and frequency (visible to all, updates in real-time)
- "Start Contract" button — enabled only when at least 1 invitee has signed

**Creator Powers (while in lobby):**
- Can continue editing contract rules (name, forfeit, period, start date) — changes visible to all participants in real-time
- Can remove a participant or cancel an unresponded invite
- Can start the contract once conditions are met

**States:**
- **Building:** Form inputs, no invites sent yet
- **Lobby (waiting):** Invites sent, waiting for responses. Shows participant status list
- **Lobby (ready):** At least 1 invitee signed — "Start Contract" becomes active
- **Started:** Contract transitions to Active, screen redirects to Contract Overview

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Sign & send invites | Same screen transitions to Lobby view |
| Start Contract | Contract Overview (Active Cycle) |
| Cancel/Decline | Home Dashboard |

---

### 5.5 Challenge Received (Invitee)

**Purpose:** Review a contract invitation, see what others have committed to, set your own habit, and sign.

**Entry points:** Invite alert on Home Dashboard, or push notification.

**User Stories:**
- "As an invitee, I want to see who invited me, what's at stake, and when it starts before I decide."
- "As an invitee, I want to see what my friends committed to so I can set an appropriately challenging goal."
- "As an invitee, I want to be able to change my mind and unsign before the contract starts."

**Sections:**

**A. Invitation Header**
- "CHALLENGE RECEIVED" banner
- Creator name and contract name

**B. Ground Rules**
- Contract name, cycle period, forfeit, start date — read-only display
- Updates in real-time if the creator edits them

**C. Squad Intel**
- List of all participants with their habit, frequency, and status (SIGNED / WAITING / DRAFTING)
- Updates in real-time as others join and set their commitments

**D. Your Commitment**
- Habit input (free text)
- Frequency selector (adapts to the contract's cycle period)

**E. Actions**
- "Sign Contract" — locks commitment, sets status to SIGNED
- "Decline" — opts out of the invitation

**Post-Sign State:**
- Commitment fields become read-only
- "Sign Contract" button changes to show SIGNED status
- An "Edit" option appears that unsigns (reverts to DRAFTING) so the user can modify their commitment — only available while the contract hasn't started

**States:**
- **Viewing:** Reading the invitation details, hasn't set a commitment yet
- **Drafting:** Has entered a habit/frequency but hasn't signed
- **Signed:** Commitment locked, waiting for the contract to start
- **Contract started:** Redirects to Contract Overview (Active Cycle)

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Sign Contract | Same screen, updated to SIGNED state |
| Edit (unsign) | Same screen, reverts to DRAFTING |
| Decline | Home Dashboard |
| Contract starts (creator triggered) | Contract Overview (Active Cycle) |

---

### 5.6 Contract Overview — Active Cycle

**Purpose:** The operational hub for a specific contract during an active cycle. See everyone's progress, upload proof, review evidence, and stay aware of the stakes.

**Entry points:** Tap contract card on Home Dashboard, or navigate from Contracts tab.

**User Stories:**
- "As a participant, I want to see my progress vs. my friends' progress in real-time."
- "As a participant, I want to see what's at stake to keep the pressure on."
- "As a participant, I want to know how much time is left so I can plan my remaining actions."
- "As a participant, I want to quickly snap proof when I complete my habit."
- "As a group member, I want to see if there's evidence I need to review."

**Sections:**

**A. Period Switcher**
- Segmented control at the top: "THIS WEEK" (active, selected) / "LAST WEEK"
- "LAST WEEK" navigates to Contract Overview — Unsettled (if previous cycle exists and is unresolved)

**B. Stakes Card**
- Forfeit displayed prominently (e.g., "ON THE LINE: A PINT")
- Cycle timeline: start date → "today" marker → end date

**C. Progress Arena**
- Vertical list of all participants, each showing:
  - Name, habit, and frequency label (e.g., "GYM 3X/WEEK")
  - Fractional progress (e.g., "2/3")
  - Multi-tone progress bar: solid = verified, patterned = pending, empty = remaining

**D. Proof Feed Preview**
- Horizontal carousel or grid of the latest evidence uploads
- Timestamp on each (e.g., "MON 7AM")
- "VIEW ALL EVIDENCE" link → Evidence Review
- Cards with unreviewed evidence show "REVIEW NEEDED" badge

**E. Primary Action**
- Dynamic CTA that changes based on state:
  - **"SNAP PROOF"** — user hasn't hit their frequency target yet → opens Evidence Upload
  - **"REVIEW [NAME]'S PROOF"** — there's unreviewed evidence from others → opens Evidence Approval
  - **"ALL CAUGHT UP"** — nothing to do, muted state

**F. Footer Actions**
- "Opt Out of Next Cycle" — only visible on the last day of the cycle. Confirmation dialog. Takes effect at cycle end

**States:**
- **Active (behind):** User hasn't hit target, "SNAP PROOF" prominent
- **Active (on track):** User has hit target, focus shifts to reviewing others' evidence
- **Active (all caught up):** No actions needed, waiting on others
- **No previous cycle:** Period switcher hides "LAST WEEK" or shows it as disabled

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap "Snap Proof" | Evidence Upload |
| Tap proof feed item / "Review" | Evidence Review |
| Tap "View All Evidence" | Evidence Review |
| Tap period switcher "Last Week" | Contract Overview — Unsettled |
| Tap "Opt Out" (last day only) | Confirmation → stays on screen, user marked as opting out |

---

### 5.7 Evidence Upload

**Purpose:** Capture and submit proof of habit completion. Should be fast and low-friction.

**Entry points:** "Snap Proof" CTA on Contract Overview or Home Dashboard.

**User Stories:**
- "As a participant, I want a fast way to capture and submit proof so it doesn't interrupt my routine."
- "As a participant, I want to add an optional note for context."
- "As a participant, I want to confirm my photo looks good before uploading."

**Sections:**

**A. Camera Viewport**
- Live camera view with viewfinder overlay
- Capture button to take photo
- "Retake" button to clear and try again

**B. Note Input**
- Optional text area: "Add a note..."
- Free text for context (e.g., "Crushed legs today!")

**C. Metadata Display (read-only)**
- Timestamp (auto-captured)
- Location: not shown for MVP (GPS is aspirational, not in scope)

**D. Upload CTA**
- "UPLOAD PROOF" primary button — submits evidence to the contract

**Validation:**
- At least one of photo or text must be provided
- If only text: that's fine
- If only photo: that's fine

**States:**
- **Camera active:** Viewfinder live, no photo taken
- **Photo captured:** Preview shown, retake available
- **Submitting:** Upload button shows progress
- **Error:** Upload failed, retry option

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Upload proof | Back to Contract Overview (Active Cycle), new evidence appears in feed |
| Back/Cancel | Contract Overview (Active Cycle) |

---

### 5.8 Evidence Review

**Purpose:** Browse all evidence uploaded by the group. See what's been verified and what still needs your vote.

**Entry points:** "View All Evidence" on Contract Overview, verification alert on Dashboard, or proof feed tap.

**User Stories:**
- "As a participant, I want to see a feed of all evidence so I can stay motivated."
- "As a voter, I want to clearly see which evidence I haven't reviewed yet."
- "As a participant, I want to see the time and context of each upload."

**Sections:**

**A. Participant Filter**
- Segmented control / tabs to switch between participants (e.g., "YOU" / "ALEX" / "SARAH")
- Defaults to showing all, or the participant with unreviewed evidence

**B. Evidence Cards**
Each card shows:
- Photo (if uploaded) — large, prominent
- Timestamp badge (e.g., "WED 7AM")
- Text note (if provided)
- Review status:
  - **"REVIEW NEEDED"** (red border, urgent) — you haven't voted yet
  - **"VERIFIED"** (green checkmark) — majority approved
  - **"REJECTED"** — majority rejected
  - **"PENDING"** — not enough votes yet, but you've already voted
- Consensus summary: who has approved/rejected

**C. Navigation**
- Tapping an unreviewed card opens Evidence Approval
- Tapping a reviewed card shows detail view (read-only)

**States:**
- **Has unreviewed items:** Cards with red "REVIEW NEEDED" badges sorted to top
- **All reviewed:** All cards show verified/rejected/pending status
- **Empty (no evidence yet):** "No evidence uploaded yet" message

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap unreviewed evidence card | Evidence Approval |
| Tap reviewed evidence card | Detail view (read-only, same screen or modal) |
| Back | Contract Overview |

---

### 5.9 Evidence Approval

**Purpose:** Vote on a single piece of evidence. Large photo, clear context, binary decision.

**Entry points:** Tap unreviewed card in Evidence Review, or verification alert on Dashboard.

**User Stories:**
- "As a voter, I want to see a large, clear photo so I can make an informed decision."
- "As a voter, I want to see what commitment this proof relates to."
- "As a voter, I want simple approve/reject buttons."

**Sections:**

**A. Context Banner**
- "VERIFY [NAME]'S PROOF" header
- The participant's commitment highlighted (e.g., "Alex went to the gym")

**B. Evidence Display**
- Large-format photo
- Timestamp and metadata badges
- Optional note from the uploader

**C. Action Zone (fixed to bottom)**
- Two large buttons side by side:
  - **REJECT** (red)
  - **APPROVE** (blue)

**Changing Your Vote:**
- If you return to an evidence item you already voted on, your previous vote is shown. You can change it (tap the other button) as long as the cycle hasn't been resolved.

**States:**
- **Unvoted:** Both buttons active, no selection
- **Voted:** Your choice highlighted, other button available to change vote
- **Resolved:** Read-only, shows final outcome

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Approve or Reject | Back to Evidence Review (vote recorded) |
| Back/Close | Evidence Review |

---

### 5.10 Contract Overview — Unsettled (Last Week)

**Purpose:** View the previous cycle's final standings while they're still being resolved. Shows who hit their targets and how many reviews are still needed.

**Entry points:** Period switcher "Last Week" on Contract Overview, or "Settle" alert on Dashboard.

**User Stories:**
- "As a participant, I want to see the final standings from last week while it's still being resolved."
- "As a voter, I want to know exactly how many items I need to review to finalise the stakes."
- "As a user, I want to see a summary of everyone's final progress."

**Sections:**

**A. Period Switcher**
- "LAST WEEK" selected, "THIS WEEK" available to toggle back

**B. Final Standings**
- Ranked list of participants with:
  - Final verified count (e.g., "3/3 VERIFIED")
  - Success/fail badges
  - Pending count if evidence still unresolved

**C. Verification CTA**
- Prominent card: "VERIFICATION PENDING — X items to review"
- "REVIEW NOW" button → Evidence Review (filtered to unreviewed items from this cycle)

**D. Contract Summary**
- Recap of each participant's habit and the cycle's end date

**E. Upload Lock Notice**
- Footer clarifying "Submission window closed for this cycle"

**Auto-Resolution:**
- If votes aren't all in by the time the *next* cycle ends, all remaining pending evidence auto-approves and the cycle resolves

**States:**
- **Pending (reviews needed):** Verification CTA prominent, standings show estimated outcome
- **Resolved:** Transitions to Contract Settled view

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap "Review Now" | Evidence Review (filtered to this cycle's unreviewed items) |
| Tap period switcher "This Week" | Contract Overview — Active Cycle |
| All votes in (auto-transition) | Contract Settled |

---

### 5.11 Contract Settled

**Purpose:** Show the final, resolved outcome of a completed cycle. Celebrate winners, call out losers, and show the payout.

**Entry points:** Auto-transition from Unsettled view when all votes are in. Also accessible from contract history.

**User Stories:**
- "As a winner, I want to celebrate and see who owes me."
- "As a loser, I want to understand why I lost."
- "As a participant, I want to share the results with others."

**Sections:**

**A. Resolution Banner**
- "CYCLE COMPLETE" header with checkmark

**B. Final Standings Leaderboard**
- Ranked list showing each participant:
  - Rank number
  - Name and final verified count (e.g., "3/3 DAYS")
  - "CLEARED" badge for winners, "OWES" badge for losers

**C. Payout Card**
- High-contrast card stating the specific debt: "[LOSER] OWES [WINNER]: [FORFEIT]"
- If multiple debts, listed individually

**D. Share Action**
- "SHARE RESULTS" button — opens native share sheet with a summary graphic

**States:**
- **All cleared:** Everyone hit their target — celebration state, no debts
- **Mixed results:** Winners and losers shown, payout card visible
- **Total failure:** Bottom owes top, "Relative Failure" explanation shown

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap "Share Results" | Native share sheet |
| Navigate away | Home Dashboard or Contracts tab |
| (Loser taps their debt) | Pay Up screen |
| (Winner taps their credit) | You're Owed screen |

---

### 5.12 Pay Up (Loser)

**Purpose:** A dedicated, unavoidable notification that you lost and owe a forfeit. Designed to be confrontational and motivating.

**Entry points:** Tap debt from Contract Settled, or alert on Dashboard.

**User Stories:**
- "As a loser, I want a clear notification of what I owe and to whom."
- "As a loser, I want to see why I lost."
- "As a loser, I want to acknowledge the debt so the notification goes away."

**Sections:**

**A. Defeat Stamp**
- Massive "PAY UP" graphic — impossible to miss

**B. Settlement Block**
- "YOU OWE [WINNER]: [FORFEIT]" (e.g., "YOU OWE ALEX: A PINT AT THE PUB")

**C. Contract Recap**
- The habit you committed to and your final count
- The opponent who won

**D. Proof Context**
- Thumbnails of the winner's successful evidence (rubbing it in)

**E. Acknowledgment**
- "I KNOW" button — dismisses the alert. Does not settle the debt; it just removes the in-your-face notification. The winner must mark it as settled from their side.

**States:**
- **Active debt:** Full display with acknowledgment button
- **Acknowledged:** Alert dismissed, but debt remains visible in contract history until winner settles

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap "I Know" | Dismiss alert, return to Home Dashboard |
| Tap "View Cycle Details" | Contract Settled (full standings) |

---

### 5.13 You're Owed (Winner)

**Purpose:** A dedicated screen reminding the winner they are owed a forfeit, with tools to chase the loser and mark the debt as settled.

**Entry points:** Tap credit from Contract Settled, or alert on Dashboard.

**User Stories:**
- "As a winner, I want a dedicated reminder that I'm owed a reward."
- "As a winner, I want to pester my friend if they haven't paid up."
- "As a winner, I want to officially clear the debt once it's settled in real life."

**Sections:**

**A. Victory Stamp**
- Massive "YOU'RE OWED" graphic

**B. Contract Detail Card**
- The habit and the opponent involved

**C. Debt Block**
- "[LOSER] OWES YOU: [FORFEIT]" (e.g., "ALEX OWES YOU: A PINT AT THE PUB")

**D. Actions**
- "PESTER [NAME]" — sends a push notification to the loser reminding them of the debt. Can be sent repeatedly until settled
- "MARK AS SETTLED" — archives the debt. Only the winner needs to confirm; no acknowledgment needed from the loser

**States:**
- **Active debt:** Pester and settle actions available
- **Settled:** Debt archived, screen shows "SETTLED" state (accessible from history)

**Actions → Destinations:**
| Action | Destination |
|---|---|
| Tap "Pester" | Sends notification, stays on screen (maybe a confirmation toast) |
| Tap "Mark as Settled" | Debt archived, return to Home Dashboard or Contract Settled |
| Tap "View Cycle Details" | Contract Settled (full standings) |

---

### 5.14 Friends

**Purpose:** Manage in-app friends. This is required because contract invitations are limited to in-app friends.

**Entry points:** Bottom tab "Friends".

**User Stories:**
- "As a user, I want to add friends so I can invite them to contracts."
- "As a user, I want to remove friends I no longer want to challenge."
- "As a user, I want to see incoming friend requests."

**Features:**
- Friend list with names and avatars
- Search to find users and send friend requests
- Incoming friend requests with accept/decline
- Remove friend option (with confirmation)

**States:**
- **Empty:** No friends yet — prompt to search and add
- **Populated:** List of friends, search bar at top
- **Pending requests:** Badge on tab, requests shown at top of list

**Note:** This screen has no mockup in the current design package. It needs to be designed consistent with the established visual style.

---

### 5.15 Profile (Placeholder)

**Purpose:** Basic account management for MVP.

**Entry points:** Bottom tab "Profile".

**Features (MVP minimal):**
- Display name
- Email address
- Logout button

**Note:** This is a placeholder. Future versions may include stats, settings, notification preferences, etc. No mockup exists — design to match the established style.

---

## 6. Cross-Cutting Concerns

### Notifications (MVP)
Notifications are surfaced as banners in the Dashboard Alert Stack. No dedicated notifications/inbox screen for MVP.

Notification triggers:
- Someone uploads evidence to a contract you're in → "VERIFY" alert
- You receive a contract invitation → "CHALLENGE" alert
- A cycle completes and is ready for resolution → "SETTLE" alert
- A winner pesters you for a forfeit → "PAY UP" reminder
- Push notifications for the above (if the user has granted permission)

### Auto-Renewal
- Contracts automatically renew into the next cycle when a cycle settles
- Participants can opt out only on the last day of a cycle
- Opt-out takes effect at cycle end — the participant completes the current cycle normally
- If all participants opt out, the contract ends after the current cycle
- Habits, frequencies, and forfeits are fixed for the life of the contract. To change terms, create a new contract
- New participants cannot join an existing contract — only the original (non-opted-out) members continue

### Real-Time Updates
- The Lobby/Contract Builder screens should update in real-time as participants join, set habits, and sign
- If the creator edits contract rules while participants are viewing, changes should appear immediately
- Progress bars on Contract Overview should reflect new evidence and votes without requiring a manual refresh

### Evidence Voting Deadlines
- There is no explicit deadline for voting within a cycle
- If evidence remains unvoted when the *next* cycle ends, it auto-approves
- This means a cycle can remain in "Pending Resolution" for up to one full cycle period before auto-resolving

---

## 7. Out of Scope for MVP

These are mentioned in the original design materials but explicitly excluded from MVP:

- **Streak tracking** ("12 weeks undefeated") — future feature
- **GPS verification** on evidence — aspirational, not MVP
- **Changing forfeit/habits between cycles** — everything is fixed for the life of the contract
- **In-app payments** — forfeits are honour system only
- **Google/Apple sign-in** — buttons visible as placeholders, not functional
- **Dedicated notifications inbox** — alerts live on the Dashboard only
- **Adjusting commitment mid-cycle** — locked at sign
- **Adding new participants to an existing contract** — create a new contract instead

---

## 8. Open Questions

These are edge cases or decisions that may need resolution during development:

1. **Forfeit distribution in groups > 2:** If 3 people win and 2 lose, does each loser owe each winner a full forfeit, or is it split? (Current assumption: each loser owes each winner the forfeit — e.g., 2 losers × 3 winners = 6 forfeits of "A Pint")
2. **What happens if a participant is removed from the lobby after they've already signed?** Do they get a notification?
3. **Can a creator cancel a contract that's already active?** Or only before it starts?
4. **Friend request flow:** How do users find each other? By username, email, phone number?
5. **What's the minimum evidence for "progress"?** If someone uploads a text-only note saying "I went to the gym", does that count the same as a photo? (Current answer: yes, the group votes on it regardless)
6. **Opt-out confirmation:** Should other participants be notified when someone opts out of the next cycle?
7. **Empty contract:** If everyone opts out except one person, does the last person "win" the final cycle by default?
