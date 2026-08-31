// Expo Router needs a real route matching "/" to resolve the app's initial
// deep link — without one it falls through to the internal not-found screen
// and app/_layout.tsx (and its RootRedirect) never mounts at all. This screen
// renders nothing itself: RootRedirect (in app/_layout.tsx) replaces it with
// /login or /dashboard as soon as the root layout mounts.
export default function Index() {
    return null;
}
