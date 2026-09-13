package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName("evidence_uploaded")
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

    public EvidenceUploadedNotification(
            UUID id,
            Instant createdAt,
            String submitterName,
            UUID contractId,
            String contractName,
            int cycleNumber,
            UUID evidenceId) {
        this(id, createdAt, "evidence_uploaded", submitterName, contractId, contractName, cycleNumber, evidenceId);
    }
}
