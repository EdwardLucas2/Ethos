package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@DiscriminatorMappingName("resolution_winner")
public record ResolutionWinnerNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID resolutionId,
        String contractName,
        String forfeit,
        List<String> loserNames)
        implements NotificationResponse {

    public ResolutionWinnerNotification(
            UUID id,
            Instant createdAt,
            UUID resolutionId,
            String contractName,
            String forfeit,
            List<String> loserNames) {
        this(id, createdAt, "resolution_winner", resolutionId, contractName, forfeit, loserNames);
    }
}
