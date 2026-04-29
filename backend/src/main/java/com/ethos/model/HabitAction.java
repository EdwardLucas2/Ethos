package com.ethos.model;

import java.time.Instant;
import java.util.UUID;

public record HabitAction(UUID id, UUID cycleId, UUID participantId, int actionNumber, Instant createdAt) {}
