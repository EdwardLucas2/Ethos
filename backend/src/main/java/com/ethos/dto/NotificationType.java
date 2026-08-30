package com.ethos.dto;

/**
 * Not used as a DTO field type directly — the javalin-openapi annotation processor generates
 * enum schemas from the Java constant names at compile time and ignores {@code @JsonValue}, so a
 * typed field here would desync the generated OpenAPI enum (and Orval's TS union) from the actual
 * lowercase JSON this app emits. Callers use {@code .name().toLowerCase()} to build the
 * {@code String} field on {@link NotificationResponse}, matching the pattern used for
 * {@link ContractResponse}'s {@code period}/{@code status} fields.
 */
public enum NotificationType {
    EVIDENCE_UPLOADED,
    CONTRACT_INVITED,
    CYCLE_PENDING_RESOLUTION,
    RESOLUTION_LOSER,
    RESOLUTION_WINNER,
    PESTER
}
