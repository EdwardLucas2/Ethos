import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: ['../components/**/*.stories.@(ts|tsx)', '../app/**/*.stories.@(ts|tsx)'],
    framework: {
        name: '@storybook/react-native-web-vite',
        options: {},
    },
    viteFinal(config) {
        return mergeConfig(config, {
            resolve: {
                alias: {
                    // App-specific mocks — must appear before vite-tsconfig-paths resolves
                    // @/* from tsconfig, so the real modules are never imported here.
                    '@/src/api/auth': path.resolve(__dirname, 'mocks/auth-api.ts'),
                    '@/src/context/AuthContext': path.resolve(__dirname, 'mocks/auth-context.tsx'),
                    // expo-router has no standalone web context
                    'expo-router': path.resolve(__dirname, 'mocks/expo-router.tsx'),
                    // expo-haptics has no web implementation
                    'expo-haptics': path.resolve(__dirname, 'mocks/expo-haptics.ts'),
                    // AntDesign from @expo/vector-icons has no web build — stub with a text-based mock
                    '@expo/vector-icons/AntDesign': path.resolve(
                        __dirname,
                        'mocks/expo-vector-icons-antdesign.tsx'
                    ),
                },
            },
            define: {
                // Ensures components that guard with process.env.EXPO_OS === 'ios'
                // (e.g. HapticTab) don't call native APIs in the Storybook context.
                'process.env.EXPO_OS': JSON.stringify('web'),
            },
        });
    },
};

export default config;
