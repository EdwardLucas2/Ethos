package com.ethos.dto;

import java.util.UUID;

public record ContractParticipantResponse(
        UUID id, UUID userId, String habit, Integer frequency, String signStatus, boolean optedOutOfNextCycle) {}
