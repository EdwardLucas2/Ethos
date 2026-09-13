package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName(EvidenceUploadedNotification.TYPE)
public record EvidenceUploadedNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        String submitterName,
        @OpenApiRequired UUID contractId,
        String contractName,
        int cycleNumber,
        @OpenApiRequired UUID evidenceId)
        implements NotificationResponse {

    static final String TYPE = "evidence_uploaded";

    public EvidenceUploadedNotification {
        if (!TYPE.equals(type)) {
            throw new IllegalArgumentException("type must be \"" + TYPE + "\", was: " + type);
        }
    }

    public EvidenceUploadedNotification(
            UUID id,
            Instant createdAt,
            String submitterName,
            UUID contractId,
            String contractName,
            int cycleNumber,
            UUID evidenceId) {
        this(id, createdAt, TYPE, submitterName, contractId, contractName, cycleNumber, evidenceId);
    }
}
