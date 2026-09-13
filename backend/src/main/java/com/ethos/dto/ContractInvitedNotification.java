package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName("contract_invited")
public record ContractInvitedNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        String inviterName,
        @OpenApiRequired UUID contractId,
        String contractName)
        implements NotificationResponse {

    public ContractInvitedNotification(
            UUID id, Instant createdAt, String inviterName, UUID contractId, String contractName) {
        this(id, createdAt, "contract_invited", inviterName, contractId, contractName);
    }
}
