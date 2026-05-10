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
};
