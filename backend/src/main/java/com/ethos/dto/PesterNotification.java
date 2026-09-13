package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName("pester")
public record PesterNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID resolutionId,
        String fromName,
        String forfeit)
        implements NotificationResponse {

    public PesterNotification {
        if (!"pester".equals(type)) {
            throw new IllegalArgumentException("type must be \"pester\", was: " + type);
        }
    }

    public PesterNotification(UUID id, Instant createdAt, UUID resolutionId, String fromName, String forfeit) {
        this(id, createdAt, "pester", resolutionId, fromName, forfeit);
    }
}
