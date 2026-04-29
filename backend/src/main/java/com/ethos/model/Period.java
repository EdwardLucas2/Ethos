package com.ethos.model;

public enum Period {
    weekly,
    biweekly,
    monthly;

    public static Period fromValue(String value) {
        return switch (value) {
            case "weekly" -> weekly;
            case "biweekly" -> biweekly;
            case "monthly" -> monthly;
            default -> throw new IllegalArgumentException("Unknown period: " + value);
        };
    }
}
