import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import {
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
    PublicSans_900Black,
} from '@expo-google-fonts/public-sans';
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

function RootRedirect() {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inAuthGroup = (segments[0] as any) === '(auth)';

    useEffect(() => {
        if (isLoading) return;

        if (!session && !inAuthGroup) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.replace('/login' as any);
        } else if (session && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [session, isLoading, inAuthGroup, router]);

    return null;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        PublicSans_400Regular,
        PublicSans_500Medium,
        PublicSans_700Bold,
        PublicSans_800ExtraBold,
        PublicSans_900Black,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RootRedirect />
                <Stack>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="modal"
                        options={{ presentation: 'modal', title: 'Modal' }}
                    />
                </Stack>
                <StatusBar style="dark" />
            </AuthProvider>
        </QueryClientProvider>
    );
}
