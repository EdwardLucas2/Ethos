package com.ethos.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        Instant createdAt,
        String submitterName,
        UUID contractId,
        String contractName,
        Integer cycleNumber,
        UUID evidenceId,
        String inviterName,
        UUID resolutionId,
        String forfeit,
        List<String> loserNames,
        List<String> winnerNames,
        String fromName) {}
