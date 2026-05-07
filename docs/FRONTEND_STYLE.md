# Frontend Style Guide

Conventions for all React Native / Expo code. Follow these rules in every feature — they exist to keep agent-generated and human-written code consistent.

---

## File & Directory Naming

- Screen files under `app/` use **kebab-case** — Expo Router derives the URL from the filename, so this is required.
- Component files under `components/` use **PascalCase** matching the exported component name (`ContractCard.tsx`, not `contract-card.tsx`).
- Hook files use **camelCase** with a `use` prefix (`useContractStatus.ts`).
- All TypeScript source files use `.tsx` when they contain JSX, `.ts` otherwise.

---

## Exports

- **Screens** (`app/` files) must use **default exports** — Expo Router requires this.
- **Everything else** uses **named exports** — components, hooks, constants, utilities.

```tsx
// components/ContractCard.tsx — named export
export function ContractCard({ contract }: ContractCardProps) { ... }

// app/(tabs)/dashboard.tsx — default export
export default function DashboardScreen() { ... }
```

Never re-export a named component as a default in the same file. If Expo Router requires a default export for a screen, the screen function is itself the default — don't wrap a named component.

---

## Component Structure

Every component file follows this order:

1. Imports
2. Props interface (always named `<ComponentName>Props`)
3. Component function
4. `StyleSheet.create(...)` call at the bottom

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ContractCardProps {
    title: string;
    isActive: boolean;
}

export function ContractCard({ title, isActive }: ContractCardProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 3,
        borderColor: theme.colors.ink,
        backgroundColor: theme.colors.surfaceRaised,
        ...theme.shadows.md,
    },
    title: {
        fontFamily: 'PublicSans_700Bold',
        color: theme.colors.ink,
    },
});
```

---

## Styling

React Native has no CSS. Styles are JavaScript objects validated and serialized at startup by `StyleSheet.create`.

**Always use `StyleSheet.create`** — never inline style objects (`style={{ margin: 8 }}`), except for truly dynamic values that cannot be expressed in a static stylesheet (e.g. a width derived from a prop).

**Always use theme constants** from `constants/theme.ts` — never hardcode colors, shadow values, or spacing. The design system is defined there.

```tsx
// Wrong — hardcoded values
style={{ borderWidth: 3, borderColor: '#000000', shadowOffset: { width: 4, height: 4 } }}

// Right — theme constants
style={[styles.card, isActive && styles.cardActive]}
```

**Shadow syntax in React Native** uses separate props, not CSS shorthand:

```tsx
// In StyleSheet.create:
container: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,  // Android
}
```

The theme exports these as pre-built objects (`theme.shadows.sm`, `.md`, `.lg`) — spread them in.

---

## State Management

Three layers — never skip a level or use the wrong one:

| What | How |
|---|---|
| Server data (contracts, users, evidence) | TanStack Query via Orval-generated hooks |
| Global client state (auth token, current user) | React Context in `src/context/` |
| Local UI state (modal open, selected tab) | `useState` |

Do not introduce any other state library (Zustand, Redux, Jotai, etc.).

---

## TanStack Query

Never call `fetch` directly. All server communication goes through Orval-generated hooks in `src/api/`.

**Always handle loading and error states:**

```tsx
const { data, isLoading, isError } = useGetContract(contractId);

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
```

**Polling** for near-real-time updates (lobby screens, active contract):

```tsx
const { data } = useGetContract(contractId, {
    refetchInterval: 500,
});
```

**Mutations** always invalidate affected queries on success:

```tsx
const queryClient = useQueryClient();
const { mutate: signContract } = usePostContractSign({
    mutation: {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(contractId) });
        },
    },
});
```

Never store server data in `useState` — TanStack Query is the cache.

---

## TypeScript

All strict mode flags are on. Rules:

- **No `any`** — use `unknown` and narrow, or fix the type properly.
- **No manual API types** — all shapes come from Orval. Never define an interface that mirrors an API response.
- **Route params** are always strings from the router; parse/validate them explicitly:

```tsx
const { contractId } = useLocalSearchParams<{ contractId: string }>();
// contractId is string | string[] — handle accordingly
```

- **Non-null assertions (`!`)** are banned except when the TypeScript type is wrong and you can't fix it (e.g. a third-party type). Leave a comment explaining why.

---

## Navigation

Use `useRouter()` for programmatic navigation and `useLocalSearchParams()` for reading route params. Both are from `expo-router`.

```tsx
import { useRouter, useLocalSearchParams } from 'expo-router';

const router = useRouter();
router.push(`/contract/${contractId}/build`);
router.replace('/dashboard');
router.back();
```

Never use `React Navigation` APIs directly — Expo Router wraps them. Never hardcode route strings in multiple places; derive them from params.

---

## Orval-Generated Code

`src/api/` is auto-generated. **Never edit it manually.**

Regenerate after any backend `@OpenApi` annotation change:

```bash
# With backend running on :8080
cd app && npx orval
```

The generated file exports:
- TypeScript interfaces for all request/response shapes
- TanStack Query hooks (`useGetContract`, `usePostEvidence`, etc.)
- Query key factories (`getGetContractQueryKey(contractId)`)

Import only from `src/api/` — never from a sub-path within it.

---

## Expo SDK

Use Expo SDK modules for all native device capabilities. Never use bare React Native APIs when an Expo equivalent exists.

| Need | Use |
|---|---|
| Secure token storage | `expo-secure-store` |
| Haptic feedback | `expo-haptics` |
| Images | `expo-image` |
| Camera / media picker | `expo-image-picker` |
| Deep links | `expo-linking` |

---

## Comments

Same policy as the backend:

- Do not comment what the code does — well-named functions and variables do that.
- Only add a comment when the **why** is non-obvious: a hidden constraint, a workaround, a non-obvious invariant.

---

## Tests

Use React Native Testing Library (RNTL). Test files are **co-located** with the component: `ContractCard.test.tsx` sits next to `ContractCard.tsx`.

**Mock Orval hooks, not `fetch`:**

```tsx
jest.mock('@/src/api', () => ({
    useGetContract: jest.fn(),
}));

(useGetContract as jest.Mock).mockReturnValue({
    data: mockContract,
    isLoading: false,
    isError: false,
});
```

Test user-visible behaviour, not implementation details. Assert on rendered text, accessible labels, and navigation calls — not on which hooks were called or how many times.

Only test components with non-trivial logic (conditional rendering, computed display values, interaction sequences). Don't test components that are pure layout wrappers.
