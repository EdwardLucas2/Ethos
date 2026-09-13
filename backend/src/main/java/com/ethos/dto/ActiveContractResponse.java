package com.ethos.dto;

import io.javalin.openapi.OpenApiRequired;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record ActiveContractResponse(
        @OpenApiRequired UUID contractId,
        @OpenApiRequired String name,
        int cycleNumber,
        @OpenApiRequired LocalDate startDate,
        @OpenApiRequired LocalDate endDate,
        int unreviewedEvidenceCount,
        @OpenApiRequired List<ActiveParticipantResponse> participants) {
    public ActiveContractResponse {
        Objects.requireNonNull(contractId, "contractId must not be null");
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(startDate, "startDate must not be null");
        Objects.requireNonNull(endDate, "endDate must not be null");
        Objects.requireNonNull(participants, "participants must not be null");
    }
}
