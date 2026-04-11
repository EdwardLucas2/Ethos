# Design System Specification
## Overview
This design system rejects the "softness" of modern SaaS templates in favor of an authoritative, high-stakes editorial aesthetic. It is a digital manifestation of neo-brutalism refined for a premium, mission-critical context. We move beyond "standard" UI by embracing the friction of sharp edges and the weight of heavy ink. 

The system breaks the "template" look through **intentional density**. We do not fear a busy screen; we master it. By using a "Mission Control" layout—where every pixel feels accounted for and every border is a structural load-bearing wall—we create an environment of absolute certainty.

## Colors & Surface Architecture

### The Palette
The color strategy relies on a sophisticated tension between the archival warmth of the "Bone" background and the hyper-digital intensity of the accent palette.

*   **Foundation:** `surface` (#fafaf5) provides a warm, paper-like texture that prevents the high-contrast black borders from feeling sterile.
*   **Action Blue:** `primary` (#0030bf) and `primary_container` (#2b4cda) are used for primary workflows and navigational anchors.
*   **Sunshine Yellow:** `secondary_container` (#fddc00) acts as the high-visibility highlighter for critical data points.
*   **Alert Red:** `tertiary_container` (#bc0100) is reserved strictly for high-stakes warnings and destructive actions.

### The "Heavy Ink" Rule
Unlike traditional modern systems this system mandates a **Heavy Ink** approach. 
*   **Borders:** All structural containers must use a **3px or 4px solid black** border (`on_background`). 
*   **No Fades:** Prohibit the use of 1px lines or soft dividers. If a section needs separation, it gets a heavy border or a full background shift to `surface_container`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical plates stacked on a desk.
*   **Nesting:** Use `surface_container_low` for the main layout grid, and `surface_container_highest` for nested data modules. 
*   **The Offset Principle:** Every card and button must utilize the **Hard Offset**: `4px 4px 0px #000000`. This creates a pseudo-3D effect that feels tactile and permanent, rather than "floating" via shadows.

## Typography

We utilize **Plus Jakarta Sans** for its geometric clarity and modern weight. Typography is not just for reading; it is a structural element.

*   **The All-Caps Protocol:** All `display`, `headline`, and `label` styles must be set in **ALL-CAPS** with a slight letter-spacing increase (+2% to +5%).
*   **Weight as Hierarchy:** Use `Bold` (700) or `ExtraBold` (800) for all headers. The `body` text remains `Medium` (500) to ensure legibility against the aggressive headers.
*   **Scale:** 
    *   **Display LG (3.5rem):** Reserved for hero numbers or singular high-stakes metrics.
    *   **Title SM (1rem):** Used for "Data Labels" within dense mission-control grids.

## Elevation & Depth: Structural Brutalism
We reject "Ambient Shadows" and "Glassmorphism." In this system, depth is calculated and rigid.

*   **The Layering Principle:** Depth is achieved by the **Hard Drop Shadow** (`4px 4px 0px #000000`). This is a "Physical Shadow" representing an object bolted to the surface.
*   **Active States:** On click or "active" states, the component should shift `2px` down and `2px` right, and the shadow should shrink to `2px 2px 0px #000000`.
*   **Zero Rounding:** The `Roundedness Scale` is strictly `0px` across all tokens.

## Components

### Buttons: The "Command" Units
*   **Primary:** `primary` background, `on_primary` text, 4px black border, 4px hard shadow. All-caps.
*   **Secondary:** `secondary_container` (Yellow) background, `on_secondary_fixed` text, 4px black border. Used for "Add" or "Create" actions.
*   **States:** Hover states should not use transparency. Instead, shift the background color to a higher-contrast variant (e.g., `primary` to `on_primary_fixed_variant`).

### Input Fields: The "Data Entry" Cells
*   **Default:** `surface_container_lowest` background, 3px black border, sharp corners.
*   **Focus:** Background shifts to `primary_fixed` (light blue) to indicate an active "Live" cell.
*   **Error:** 3px `error` (#ba1a1a) border with a `tertiary_fixed` (pale red) background.

### Cards & Mission Control Modules
*   **Forbid Dividers:** Do not use internal lines to separate content within a card. Use `title-sm` labels in all-caps to create a header row, then use vertical whitespace.
*   **Header Bars:** Every card should have a "Header Bar"—a top section with a 3px bottom border and a `surface_container_high` background to house the module title.

### Additional Signature Component: The "Status Ribbon"
A full-width, 32px tall bar with a 3px border, using `secondary_container` (Yellow) or `primary` (Blue) to call out the current state of a high-stakes process (e.g., "LIVE TRADING" or "SYSTEM LOCKED").

## Do's and Don'ts
### Do:
*   **Embrace Density:** Pack data tightly. Use `body-sm` for secondary metadata to create a "technical" feel.
*   **Use Asymmetry:** Place a large `display-lg` metric off-center to break the "web-template" feel.
*   **Align Everything to a Grid:** While the layout is dense, it must be perfectly aligned. Every 4px border must sit exactly on an 8px grid.

### Don't:
*   **No Gradients:** Never use gradients. Colors must be flat and unapologetic.
*   **No Softness:** Never use `0.5px` lines or soft grey text. If it’s worth putting on the screen, it’s worth making it `#1a1c19` (on_surface).

**Director's Final Note:** 
This system thrives on its uncompromising nature. When in doubt, make the border thicker and the corners sharper. You are building a cockpit for high-stakes decision-making; make every pixel feel like it has the weight of a physical machine.