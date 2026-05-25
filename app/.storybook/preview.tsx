import type { Preview } from '@storybook/react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { MockAuthProvider } from '@/src/context/AuthContext';

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
                    <SafeAreaProvider>
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
