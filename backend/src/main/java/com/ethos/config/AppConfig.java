package com.ethos.config;

public record AppConfig(
        String databaseUrl, String databaseUser, String databasePassword, String supertokensUrl, int port) {

    public static AppConfig fromEnv() {
        return new AppConfig(
                requireEnv("DATABASE_URL"),
                requireEnv("DATABASE_USER"),
                requireEnv("DATABASE_PASSWORD"),
                requireEnv("SUPERTOKENS_URL"),
                Integer.parseInt(System.getenv().getOrDefault("PORT", "8080")));
    }

    private static String requireEnv(String name) {
        var val = System.getenv(name);
        if (val == null || val.isBlank()) {
            throw new IllegalStateException("Missing required environment variable: " + name);
        }
        return val;
    }
}
