package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@DiscriminatorMappingName(ResolutionLoserNotification.TYPE)
public record ResolutionLoserNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID resolutionId,
        String contractName,
        String forfeit,
        List<String> winnerNames)
        implements NotificationResponse {

    static final String TYPE = "resolution_loser";

    public ResolutionLoserNotification {
        if (!TYPE.equals(type)) {
            throw new IllegalArgumentException("type must be \"" + TYPE + "\", was: " + type);
        }
    }

    public ResolutionLoserNotification(
            UUID id,
            Instant createdAt,
            UUID resolutionId,
            String contractName,
            String forfeit,
            List<String> winnerNames) {
        this(id, createdAt, TYPE, resolutionId, contractName, forfeit, winnerNames);
    }
}
