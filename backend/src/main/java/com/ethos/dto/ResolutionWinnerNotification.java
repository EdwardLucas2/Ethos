package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@DiscriminatorMappingName(ResolutionWinnerNotification.TYPE)
public record ResolutionWinnerNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID resolutionId,
        String contractName,
        String forfeit,
        List<String> loserNames)
        implements NotificationResponse {

    static final String TYPE = "resolution_winner";

    public ResolutionWinnerNotification {
        if (!TYPE.equals(type)) {
            throw new IllegalArgumentException("type must be \"" + TYPE + "\", was: " + type);
        }
    }

    public ResolutionWinnerNotification(
            UUID id,
            Instant createdAt,
            UUID resolutionId,
            String contractName,
            String forfeit,
            List<String> loserNames) {
        this(id, createdAt, TYPE, resolutionId, contractName, forfeit, loserNames);
    }
}
