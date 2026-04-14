# Login

Authenticate an existing user via email + password.

**Route:** `/login`
**PRD:** Section 5.2
**Stitch:** `screen.png` — font is Plus Jakarta Sans (use Public Sans); input focus state inverts to white-on-blue (use 10% blue tint per FormField spec instead); colour palette uses Material Design tokens (use DESIGN.md palette).

## States
- Default — empty form
- Validation error — inline error below the relevant field
- Loading — "CONTINUE" button shows spinner, disabled

## Data
None — unauthenticated screen.

## Sections

### TopBar
`auth` variant — white background, gavel icon + "ETHOS" wordmark left, "SIGN UP" text link right.

### Hero
Centred gavel icon (large, `ink` colour) above the "ETHOS" wordmark. Establishes brand identity before the form.

### Social Buttons
Google and Apple sign-in buttons, full-width, stacked. Visually present but **disabled** for MVP — tap shows "Coming Soon" toast. 3px border, `shadow-sm`. Logos + label text (`CONTINUE WITH GOOGLE` / `CONTINUE WITH APPLE`).

### Divider
"OR" separator between social buttons and the email form. Horizontal rules either side, thin (`ink-secondary` colour).

### Form
Two `FormField` components stacked:
- Email — `type="email"`, label "EMAIL"
- Password — `type="password"`, label "PASSWORD", with a "Forgot?" text link flush right on the label row (links to password reset — MVP: simple email-based flow)

### Primary CTA
"CONTINUE" — full-width, `ink` background, white text, 3px border, `shadow-sm`. Press-shift interaction. Triggers auth; on success navigates to `/dashboard`.

### Secondary Action
"SEND EMAIL OTP" — text button, centre-aligned, `blue` colour. Secondary auth path.

### Sign-up Link
Centre-aligned body text: "New here? [SIGN UP]" — "SIGN UP" is a `blue` inline link to `/sign-up`.
