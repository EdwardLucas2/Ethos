# Frontend Style Guide

Conventions for all React Native / Expo code. Follow these rules in every feature.

---

## File & Directory Naming

- Screen files under `app/` — **kebab-case** (Expo Router derives the URL from the filename)
- Component files under `app/components/` — **PascalCase** matching the export name
- Hook files — **camelCase** with a `use` prefix
- Use `.tsx` when the file contains JSX, `.ts` otherwise

---

## Exports

- **Screens** (`app/` files) — default exports (Expo Router requires this)
- **Everything else** — named exports (components, hooks, constants, utilities)

---

## Component Structure

Every component file follows this order: imports → props interface (named `<ComponentName>Props`) → component function → `StyleSheet.create(...)` at the bottom.

---

## Styling

React Native has no CSS — styles are JavaScript objects. Rules:

- Always use `StyleSheet.create` — never inline style objects, except for values that must be dynamic (e.g. a width derived from a prop)
- Always use theme constants from `constants/theme.ts` — never hardcode colours, shadows, or spacing
- Shadows use separate RN props (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) — the theme exports pre-built objects (`theme.shadows.sm/md/lg`), spread them in

---

## State Management

Three layers — use the right one, don't introduce others (no Zustand, Redux, etc.):

| What | How |
|---|---|
| Server data | TanStack Query via Orval-generated hooks |
| Global client state (auth, current user) | React Context in `src/context/` |
| Local UI state | `useState` |

---

## TanStack Query

- Never call `fetch` directly — all server communication goes through Orval hooks in `src/api/`
- Always handle `isLoading` and `isError` states for every query
- Use `refetchInterval: 500` for near-real-time screens (lobby, active contract)
- Mutations must invalidate affected queries on success via `queryClient.invalidateQueries`
- Never store server data in `useState` — TanStack Query is the cache

---

## TypeScript

- No `any` — use `unknown` and narrow, or fix the type properly
- No manual API types — all shapes come from Orval; never define an interface that mirrors an API response
- Route params from `useLocalSearchParams` are `string | string[]` — parse and validate explicitly
- Non-null assertions (`!`) are banned except where a third-party type is wrong; leave a comment explaining why

---

## Navigation

Use `useRouter()` for programmatic navigation and `useLocalSearchParams()` for route params — both from `expo-router`. Never use React Navigation APIs directly.

---

## Orval-Generated Code

`src/api/` is auto-generated — never edit it manually. Regenerate after any backend `@OpenApi` change:

```bash
cd app && npx orval   # backend must be running on :8080
```

Import only from `src/api/` — never from a sub-path within it.

---

## Expo SDK

Use Expo SDK modules for all native capabilities — never bare React Native APIs when an Expo equivalent exists (`expo-secure-store`, `expo-haptics`, `expo-image`, `expo-image-picker`, `expo-linking`).

---

## Comments

Only add a comment when the **why** is non-obvious. Never comment what the code does.

---

## Tests

- Use RNTL. Test files are co-located: `ContractCard.test.tsx` next to `ContractCard.tsx`
- Mock Orval hooks (`jest.mock('@/src/api', ...)`), not `fetch`
- Test user-visible behaviour — rendered text, accessible labels, navigation calls — not implementation details
- Only test components with non-trivial logic; skip pure layout wrappers
- E2E flows use Maestro — see [docs/TESTS.md](TESTS.md) for structure and naming conventions
