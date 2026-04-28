package com.ethos.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Contract(
        UUID id,
        UUID creatorId,
        String name,
        String forfeit,
        Period period,
        LocalDate startDate,
        String status,
        Instant createdAt) {}
