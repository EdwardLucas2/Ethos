package com.ethos.dto;

import io.javalin.openapi.DiscriminatorMappingName;
import io.javalin.openapi.OpenApiRequired;
import java.time.Instant;
import java.util.UUID;

@DiscriminatorMappingName(ContractInvitedNotification.TYPE)
public record ContractInvitedNotification(
        @OpenApiRequired UUID id,
        @OpenApiRequired Instant createdAt,
        String type,
        String inviterName,
        @OpenApiRequired UUID contractId,
        String contractName)
        implements NotificationResponse {

    static final String TYPE = "contract_invited";

    public ContractInvitedNotification {
        if (!TYPE.equals(type)) {
            throw new IllegalArgumentException("type must be \"" + TYPE + "\", was: " + type);
        }
    }

    public ContractInvitedNotification(
            UUID id, Instant createdAt, String inviterName, UUID contractId, String contractName) {
        this(id, createdAt, TYPE, inviterName, contractId, contractName);
    }
}
