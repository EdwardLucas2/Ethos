package com.ethos.model;

import java.time.Instant;
import java.util.UUID;

public record Participant(
        UUID id,
        UUID contractId,
        UUID userId,
        String habit,
        Integer frequency,
        String signStatus,
        boolean optedOutOfNextCycle,
        Instant invitedAt,
        Instant signedAt) {}
