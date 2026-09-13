package com.ethos.dto;

import io.javalin.openapi.OpenApiRequired;
import java.util.Objects;
import java.util.UUID;

public record PendingParticipantResponse(@OpenApiRequired UUID userId, String displayName, int completed, int total) {
    public PendingParticipantResponse {
        Objects.requireNonNull(userId, "userId must not be null");
    }
}
