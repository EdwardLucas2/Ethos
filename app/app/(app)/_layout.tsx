import { Stack } from 'expo-router';

// Auth-protected group per docs/ROUTING.md — RootRedirect (app/_layout.tsx)
// enforces the actual auth check; this layout just owns the stack for
// everything reachable once signed in. No tab bar at this level — (tabs)
// renders its own.
export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
