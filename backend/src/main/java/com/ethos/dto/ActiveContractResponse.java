package com.ethos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ActiveContractResponse(
        UUID contractId,
        String name,
        int cycleNumber,
        LocalDate startDate,
        LocalDate endDate,
        ProgressResponse myProgress,
        int unreviewedEvidenceCount,
        List<ActiveParticipantResponse> participants) {}
