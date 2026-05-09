# Ethos Tone of Voice

## The Personality

Ethos sounds like the competitive mate who keeps the group honest. It's a friend that keeps score — there's warmth underneath, but the edge is real. Think group chat energy: banter, friendly heat, genuine stakes. Not a coach barking orders, not a cold scoreboard. Someone in the game with you who notices when you show up and when you don't.

**Not a platform. Not a wellness app. A competition with stakes.**

---

## Terminology

These are the canonical customer-facing names for core concepts. Use them consistently everywhere — UI copy, notifications, onboarding, and error messages.

| Concept                                | Customer name  | Usage example                                         |
| -------------------------------------- | -------------- | ----------------------------------------------------- |
| The top-level agreement                | **Contract**   | "Start a contract", "Your contracts"                  |
| One time period within a contract      | **Round**      | "Round 1", "Round 2 starts Monday"                    |
| Proof submitted for a round            | **Evidence**   | "Submit your evidence", "No evidence, no pass"        |
| What the loser owes                    | **Stake**      | "The stake: a pint", "Pay your stake"                 |
| The group of participants              | **Group**      | "Your group", "4 people in this contract"             |
| Each person's pledge within a contract | **Commitment** | "Your commitment", "Set your commitment"              |
| Approving/rejecting evidence           | **Vote**       | "Vote on their evidence", "3 votes in"                |
| An individual participant              | **Their name** | Always use the person's name — never a category label |

Don't use the internal/backend names (cycle, forfeit, participant) in any user-facing copy.

---

## Core Principles

### 1. Direct over diplomatic

Get to the point. No preamble, no softening. If something happened, say what happened. If something is needed, ask for it.

> **Yes:** "Your group is waiting on your evidence. Round ends Friday."
> **No:** "It looks like you may not have submitted your evidence yet."

### 2. Competitive without cruelty

A bit of heat is good — it's what makes accountability real. But Ethos never humiliates. It can make you feel the pressure; it shouldn't make you feel small.

> **Yes:** "Still no evidence. Your group is waiting."
> **No:** "Classic. Another week, another excuse."

### 3. Punchy, not try-hard

Short sentences. No filler. Language that lands. Avoid anything that sounds like it was A/B tested by a growth team.

> **Yes:** "Contract signed. Time to get started."
> **No:** "Congratulations! You've successfully created your accountability contract. Get started today!"

### 4. Celebrate wins without apology

When someone clears a round or wins a contract, make it feel like it. Don't undersell it. They earned it — let the copy reflect that.

### 5. Accessible, not dumbed down

The primary audience is young adults — competitive, socially motivated. The copy should feel natural to them without leaning on slang or trends.

---

## By Context

### Auth & Onboarding

Keep it functional with a small amount of personality. This isn't the place for the big voice — people are trying to log in. Friction here costs you users.

- Labels and instructions: clear, all-caps (per design system)
- CTAs: action-first, no fluff ("CREATE ACCOUNT", "CONTINUE", "SEND CODE")
- Sub-copy: one line, factual. Optionally a small edge.

> "ENTER YOUR DETAILS TO GET STARTED."
> "WELCOME BACK." / "Enter your credentials."

### Errors & Validation

Mix of punchy and clear. There should be enough personality that it feels like Ethos, but the user always knows what went wrong and what to do next.

- Always state the problem
- Optionally, one word or phrase of brand flavour
- Never mock the user for the error

> "Wrong password. Try again." _(punchy, clear)_
> "That email isn't in the system." _(matter-of-fact)_
> "Passwords don't match." _(neutral — no editorialising needed)_
> "Something went wrong. Try again." _(for server errors — keep it simple)_

### Success & Wins

Go bigger here. This is where the competitive mate voice fully shows up. These are the moments that make the app worth using.

- All-caps where the design allows
- Short, declarative, slightly boastful on behalf of the user
- Hint at what's next — momentum matters

> "CLEARED. Round 3 incoming."
> "CONTRACT WON. Make sure they pay their stake."
> "EVIDENCE APPROVED"

### Passive / Empty States

The app has a point of view even when nothing is happening. Use this sparingly — don't editorialize every empty state, but a well-placed line reinforces the personality.

> "No active contracts. Rope someone in."
> "Nothing owed."

### Push Notifications

Short, urgent, slightly loaded. Notifications are interruptions — they should earn their spot. Always state the action needed; optionally add one beat of pressure.

> "Evidence due today. Don't leave your group hanging."
> "Round's almost done. You haven't submitted evidence yet."
> "New contract invite. Your group is waiting."

---

## Avoid

| Don't                                                        | Why                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| Corporate SaaS language ("unlock", "get started", "explore") | Wrong register — reads as generic and hollow           |
| Toxic positivity ("Amazing!", "You've got this!")            | Undercuts the competitive tone and feels fake          |
| Casual internet slang ("ngl", "hits different", "slay")      | Dates quickly and feels try-hard                       |
| Overly aggressive shaming                                    | Pressure is good; humiliation isn't                    |
| Long, hedging sentences                                      | The voice is punchy — every extra word costs something |

---

## Quick Reference: Copy Principles

1. **All-caps for labels, CTAs, and status** — follow the design system
2. **Sentence case for body copy and user-generated content** — never capitalise what users typed
3. **Punctuation is active** — a period is a full stop, not decoration. Use them deliberately.
4. **Fewer words, more weight** — if it can be said in four words, don't use eight
5. **Subject + verb** — lead with action. "James voted." not "A vote has been registered."
