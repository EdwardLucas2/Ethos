import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

const queryClient = new QueryClient();

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Ethos is light-only — see app/hooks/use-theme-color.ts */}
            <ThemeProvider value={DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="modal"
                        options={{ presentation: 'modal', title: 'Modal' }}
                    />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
