import type { Preview } from '@storybook/react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
            // Full-screen stories (screens/pages) manage their own layout and background.
            if (context.parameters['layout'] === 'fullscreen') {
                return (
                    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
                        <MockAuthProvider>
                            <Story />
                        </MockAuthProvider>
                    </SafeAreaProvider>
                );
            }
            return (
                <SafeAreaProvider>
                    <MockAuthProvider>
                        <View style={{ padding: 16, backgroundColor: colors.surface }}>
                            <Story />
                        </View>
                    </MockAuthProvider>
                </SafeAreaProvider>
            );
        },
    ],
};

export default preview;
