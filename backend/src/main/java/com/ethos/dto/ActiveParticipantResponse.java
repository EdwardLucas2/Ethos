package com.ethos.dto;

import io.javalin.openapi.OpenApiRequired;
import java.util.Objects;
import java.util.UUID;

public record ActiveParticipantResponse(
        @OpenApiRequired UUID userId, String displayName, String avatarUrl, int completed, int pending, int total) {
    public ActiveParticipantResponse {
        Objects.requireNonNull(userId, "userId must not be null");
    }
}
