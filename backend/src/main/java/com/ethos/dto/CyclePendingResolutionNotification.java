package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName("cycle_pending_resolution")
public record CyclePendingResolutionNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID contractId,
        String contractName,
        int cycleNumber)
        implements NotificationResponse {

    public CyclePendingResolutionNotification(
            UUID id, Instant createdAt, UUID contractId, String contractName, int cycleNumber) {
        this(id, createdAt, "cycle_pending_resolution", contractId, contractName, cycleNumber);
    }
}
