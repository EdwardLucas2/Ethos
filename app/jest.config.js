module.exports = {
    preset: 'jest-expo',
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // npm nests expo-modules-core inside expo/ due to a worklets peer-dep conflict;
        // point Jest at the nested copy so jest-expo's setup can find it (including sub-paths).
        '^expo-modules-core(.*)$': '<rootDir>/node_modules/expo/node_modules/expo-modules-core$1',
    },
    // @storybook/* packages ship as ESM; add them to the transform exception list so
    // Babel processes them alongside the react-native packages jest-expo already handles.
    transformIgnorePatterns: [
        '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@storybook|storybook))',
        '/node_modules/react-native-reanimated/plugin/',
    ],
};
