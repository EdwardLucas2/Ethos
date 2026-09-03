import type { Preview } from '@storybook/react';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '@/constants/theme';
// Imported directly (not via the @/src/context/AuthContext alias) so this file
// type-checks and lints even when the real AuthContext module isn't present.
// The alias in main.ts still routes story-file imports to the same mock.
import { MockAuthProvider } from './mocks/auth-context';

const safeAreaMetrics = {
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    frame: { x: 0, y: 0, width: 390, height: 844 },
};

const preview: Preview = {
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'surface',
            values: [
                { name: 'surface', value: colors.surface },
                { name: 'white', value: colors.surfaceRaised },
            ],
        },
    },
    decorators: [
        (Story, context) => {
            // Screens (e.g. dashboard.tsx) call useQueryClient() directly — real
            // Orval hooks are mocked via the @/src/api alias, but the QueryClient
            // plumbing itself isn't, so it still needs a real provider in the tree.
            // Created once per story mount, not per render.
            const [queryClient] = useState(() => new QueryClient());

            // Full-screen stories (screens/pages) manage their own layout and background.
            if (context.parameters['layout'] === 'fullscreen') {
                return (
                    <QueryClientProvider client={queryClient}>
                        <SafeAreaProvider initialMetrics={safeAreaMetrics}>
                            <MockAuthProvider>
                                <Story />
                            </MockAuthProvider>
                        </SafeAreaProvider>
                    </QueryClientProvider>
                );
            }
            return (
                <QueryClientProvider client={queryClient}>
                    <SafeAreaProvider>
                        <MockAuthProvider>
                            <View style={{ padding: 16, backgroundColor: colors.surface }}>
                                <Story />
                            </View>
                        </MockAuthProvider>
                    </SafeAreaProvider>
                </QueryClientProvider>
            );
        },
    ],
};

export default preview;
