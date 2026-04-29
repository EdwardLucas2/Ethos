import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.ts"],
    globalSetup: "./tests/jest.globalSetup.ts",
    setupFilesAfterEnv: ["./tests/jest.setup.ts"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    },
    testTimeout: 60000,
    collectCoverage: false,
    coverageDirectory: "coverage",
    coverageReporters: ["lcov", "text-summary"],
};

export default config;
