package com.ethos.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ContractResponse(
        UUID id,
        String name,
        String forfeit,
        String period,
        LocalDate startDate,
        String status,
        Integer currentCycleNumber,
        UUID creatorId,
        Instant createdAt,
        List<ContractParticipantResponse> participants) {}
