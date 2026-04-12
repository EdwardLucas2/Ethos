# Ethos Design Language

Ethos is a high-stakes accountability app. The design should feel like it means business — dense, direct, and a little confrontational. Think less polished SaaS dashboard, more sports scoreboard meets editorial print. Everything on screen should feel intentional and load-bearing.

## Colour

- **`surface` `#F4F4F0`** — App background. Warm off-white, not pure white.
- **`surface-raised` `#FFFFFF`** — Cards and elevated containers.
- **`ink` `#000000`** — Borders, shadows, primary text.
- **`ink-secondary` `#3F3F3F`** — Secondary text and labels.
- **`blue` `#0030BF`** — Primary actions, navigation anchors, verification.
- **`yellow` `#FDDC00`** — Highlights, secondary actions, progress, success states.
- **`red` `#DC2626`** — Alerts, destructive actions, defeat states.
- **`white` `#FFFFFF`** — Text on dark or coloured backgrounds.

`blue` drives the main user actions (sign, approve, continue). `yellow` signals momentum and progress — it's the colour of something going well. `red` signals urgency, loss, or something that needs immediate attention. Never use colour for decoration. Backgrounds should be `surface` or `surface-raised`.

## Typography

**Typeface: Public Sans**

**Weight communicates hierarchy:**
- Page titles, stamps, hero text — ExtraBold (800) or Black (900)
- Section headers, card titles — Bold (700)
- Body text, descriptions — Medium (500)
- Supporting metadata, labels — Regular (400)

**Case:**
- Headers, labels, CTAs, and status indicators are ALL CAPS
- Body text and user-generated content (habit names, notes) use sentence case
- Don't force all-caps on anything the user typed

**Scale:** Don't prescribe exact sizes for every element — use relative scale and let context breathe. The key principle is contrast through size: a hero stamp should feel dramatically larger than the text around it. A progress fraction ("2/3") should be clearly secondary to the habit name above it.

**Letter spacing:**
- All-caps text: slight tracking (+2–4%) to improve legibility
- Hero/display text: tighten tracking for impact (−1–2%)
- Body text: default tracking

## Borders

Heavy borders define structure, separate elements, and give the UI its physical, print-like quality.

- **Structural borders** (cards, containers, inputs, buttons): 3px solid `ink`
- **Accent borders** (highlighted states, active elements): 4px solid `ink`

No 1px lines. No soft dividers. If a section needs a separator, it gets a full background change or a heavy border.

## Elevation & Shadow

Depth comes from hard offset shadows, not soft ambient ones. Think of elements as physical objects bolted to a surface at different heights. Shadows always use pure black at full opacity — no colour tinting, no blur, no spread.

- **`shadow-sm`** `4px 4px 0px #000` — Buttons, inputs, small elements
- **`shadow-md`** `6px 6px 0px #000` — Standard cards and containers
- **`shadow-lg`** `8px 8px 0px #000` — Hero elements, modals, high-emphasis components

## Shape

Sharp corners everywhere. Default border radius is `0px`. The only exception is pill-shaped status badges (e.g., SIGNED, WAITING, CLEARED) where full rounding is acceptable to visually distinguish them from rectangular UI elements.

## Layout & Density

Ethos screens are dense. The goal isn't minimalism — it's organisation. Every pixel should feel placed, not floated.

- Align everything to an 8px base grid
- Prefer vertical stacks of heavy cards over horizontal carousels where content is important
- Full-width elements for primary actions — buttons and CTAs should be wide and impossible to miss
- Tight spacing within components, slightly more generous spacing between sections
- Breathing room comes from the `surface` background showing between cards, not from padding inside them

## Interaction

The design has a physical, tactile quality. Interactions should reinforce this.

**Press/active state:** When a button or interactive card is tapped, it shifts 2px down and 2px right, and the shadow shrinks to match (`2px 2px 0px #000`). This simulates the object being pressed into the surface.

**Hover (web/desktop):** Shift the background to a higher-contrast variant of the element's colour. No transparency or fade effects.

**Disabled state:** Reduce opacity to ~40%. Maintain borders and shape — a disabled element should look like the same component, just unavailable.

**Transitions:** Fast and decisive. 150ms ease is a good default. Avoid slow fades or elaborate animations.

## Tone & Voice

Ethos is direct, a little competitive, and genuinely fun. Copy should feel like it was written by a friend who takes the challenge seriously but doesn't take themselves too seriously.

- **Short and declarative.** "SIGN CONTRACT" not "Sign your contract to confirm your commitment."
- **Active voice.** "ALEX OWES YOU" not "You are owed by Alex."
- **Honest about stakes.** Don't soften loss states — "PAY UP" is better than "You didn't quite make it this time."
- **Not sarcastic or mean.** Confrontational is fine; cruel isn't.
