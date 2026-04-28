package com.ethos.model;

public enum Period {
    WEEKLY,
    BIWEEKLY,
    MONTHLY;

    public static Period fromValue(String value) {
        return switch (value) {
            case "weekly" -> WEEKLY;
            case "biweekly" -> BIWEEKLY;
            case "monthly" -> MONTHLY;
            default -> throw new IllegalArgumentException("Unknown period: " + value);
        };
    }
}
