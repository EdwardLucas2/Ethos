# Sign Up

Create a new Ethos account via email + password.

**Route:** `/sign-up`
**PRD:** Section 5.1
**Stitch:** `screen.png` — same font and colour caveats as Login (Plus Jakarta Sans → Public Sans; Material Design palette → DESIGN.md palette).

## States
- Default — empty form
- Validation error — inline errors on invalid email or weak password
- Loading — "CREATE ACCOUNT" button shows spinner, disabled
- Server error — error banner below the form

## Data
None — unauthenticated screen.

## Sections

### TopBar
`auth` variant — white background, gavel icon + "ETHOS" wordmark left, "LOGIN" text link right.

### Hero
Same gavel + "ETHOS" wordmark treatment as Login.

### Social Buttons
Google and Apple sign-in buttons — same disabled/placeholder treatment as Login.

### Divider
"OR" separator, same as Login.

### Form
Two `FormField` components stacked:
- Email — `type="email"`, label "EMAIL"
- Password — `type="password"`, label "PASSWORD"

### Primary CTA
"CREATE ACCOUNT" — full-width, `ink` background, white text, 3px border, `shadow-sm`. Press-shift interaction. On success navigates to `/dashboard`.

### Login Link
Centre-aligned: "Already have an account? [LOGIN]" — "LOGIN" links to `/login`.
