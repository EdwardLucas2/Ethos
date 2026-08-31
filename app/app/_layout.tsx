import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import {
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
    PublicSans_900Black,
} from '@expo-google-fonts/public-sans';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// ─── Auth guard ───────────────────────────────────────────────────────────────

// Top-level route groups reachable without a session. Everything else is
// treated as protected — list new public groups here explicitly (e.g. an
// onboarding or public marketing flow) rather than inferring "protected"
// from "not (auth)", which would silently misclassify them as protected.
const PUBLIC_ROUTE_GROUPS: ReadonlySet<string> = new Set(['(auth)']);

function RootRedirect() {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    const inPublicGroup = PUBLIC_ROUTE_GROUPS.has(segments[0] ?? '');
    // The bare root ("/", app/index.tsx) has no group segment at all — it's
    // neither public nor protected by the check above, it's just a landing
    // spot Expo Router needs to resolve the initial deep link (see
    // app/index.tsx). A signed-in user landing there needs the same
    // redirect-to-dashboard treatment as one who lands in the public group,
    // otherwise they're stuck: !session-branch doesn't match (there IS a
    // session) and the original session-branch only fired for inPublicGroup.
    const atRoot = segments[0] === undefined;

    useEffect(() => {
        if (isLoading) return;

        if (!session && !inPublicGroup) {
            router.replace('/login');
        } else if (session && (inPublicGroup || atRoot)) {
            router.replace('/dashboard');
        }
        // useRouter() returns a stable instance; depending on it would re-run on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, isLoading, inPublicGroup, atRoot]);

    return null;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        PublicSans_400Regular,
        PublicSans_500Medium,
        PublicSans_700Bold,
        PublicSans_800ExtraBold,
        PublicSans_900Black,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    const fontsReady = fontsLoaded || fontError;

    return (
        <QueryClientProvider client={queryClient}>
            {/* AuthProvider mounts unconditionally so its session read (SecureStore)
                runs concurrently with font loading instead of starting only after
                the splash screen hides — otherwise a slow session check can flash
                the wrong screen before RootRedirect fires. */}
            <AuthProvider>
                {fontsReady ? (
                    <>
                        <RootRedirect />
                        {/* Ethos is light-only — no dark-mode theme is defined */}
                        <ThemeProvider value={DefaultTheme}>
                            <Stack>
                                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen name="profile" options={{ headerShown: false }} />
                            </Stack>
                            <StatusBar style="dark" />
                        </ThemeProvider>
                    </>
                ) : null}
            </AuthProvider>
        </QueryClientProvider>
    );
}
