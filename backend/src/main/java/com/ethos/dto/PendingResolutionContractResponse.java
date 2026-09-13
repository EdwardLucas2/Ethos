package com.ethos.dto;

import io.javalin.openapi.OpenApiRequired;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record PendingResolutionContractResponse(
        @OpenApiRequired UUID contractId,
        @OpenApiRequired String contractName,
        int cycleNumber,
        int unreviewedEvidenceCount,
        @OpenApiRequired List<PendingParticipantResponse> participants) {
    public PendingResolutionContractResponse {
        Objects.requireNonNull(contractId, "contractId must not be null");
        Objects.requireNonNull(contractName, "contractName must not be null");
        Objects.requireNonNull(participants, "participants must not be null");
    }
}
