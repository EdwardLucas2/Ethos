package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName(CyclePendingResolutionNotification.TYPE)
public record CyclePendingResolutionNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        @OpenApiRequired UUID contractId,
        String contractName,
        int cycleNumber)
        implements NotificationResponse {

    static final String TYPE = "cycle_pending_resolution";

    public CyclePendingResolutionNotification {
        if (!TYPE.equals(type)) {
            throw new IllegalArgumentException("type must be \"" + TYPE + "\", was: " + type);
        }
    }

    public CyclePendingResolutionNotification(
            UUID id, Instant createdAt, UUID contractId, String contractName, int cycleNumber) {
        this(id, createdAt, TYPE, contractId, contractName, cycleNumber);
    }
}
