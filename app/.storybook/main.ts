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
                alias: [
                    // App-specific mocks — must appear before vite-tsconfig-paths resolves
                    // @/* from tsconfig, so the real modules are never imported here.
                    // Exact-match regexes (not plain strings) — a plain string key does
                    // prefix-boundary matching in Vite/rollup-plugin-alias, so e.g. a
                    // '@/src/api' string key would also swallow '@/src/api/unwrap' and
                    // redirect it under the mock file (which isn't a directory), breaking
                    // that import entirely.
                    {
                        find: /^@\/src\/services\/auth$/,
                        replacement: path.resolve(__dirname, 'mocks/auth-api.ts'),
                    },
                    {
                        find: /^@\/src\/context\/AuthContext$/,
                        replacement: path.resolve(__dirname, 'mocks/auth-context.tsx'),
                    },
                    {
                        find: /^@\/src\/api$/,
                        replacement: path.resolve(__dirname, 'mocks/api.tsx'),
                    },
                    // expo-router has no standalone web context
                    {
                        find: /^expo-router$/,
                        replacement: path.resolve(__dirname, 'mocks/expo-router.tsx'),
                    },
                    // expo-haptics has no web implementation
                    {
                        find: /^expo-haptics$/,
                        replacement: path.resolve(__dirname, 'mocks/expo-haptics.ts'),
                    },
                    // AntDesign from @expo/vector-icons has no web build — stub with a text-based mock
                    {
                        find: /^@expo\/vector-icons\/AntDesign$/,
                        replacement: path.resolve(
                            __dirname,
                            'mocks/expo-vector-icons-antdesign.tsx'
                        ),
                    },
                ],
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
