package com.ethos.model;

import java.time.LocalDate;
import java.util.UUID;

public record Cycle(
        UUID id,
        UUID contractId,
        int cycleNumber,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate votingDeadline,
        String status) {}
