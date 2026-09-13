package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@DiscriminatorMappingName("resolution_loser")
public record ResolutionLoserNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID resolutionId,
        String contractName,
        String forfeit,
        List<String> winnerNames)
        implements NotificationResponse {

    public ResolutionLoserNotification(
            UUID id,
            Instant createdAt,
            UUID resolutionId,
            String contractName,
            String forfeit,
            List<String> winnerNames) {
        this(id, createdAt, "resolution_loser", resolutionId, contractName, forfeit, winnerNames);
    }
}
