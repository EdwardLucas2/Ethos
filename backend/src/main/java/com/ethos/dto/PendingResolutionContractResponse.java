package com.ethos.dto;

import java.util.List;
import java.util.UUID;

public record PendingResolutionContractResponse(
        UUID contractId,
        String contractName,
        int cycleNumber,
        int unreviewedEvidenceCount,
        List<PendingParticipantResponse> participants) {}
