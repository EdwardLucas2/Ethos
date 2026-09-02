package com.ethos.dto;

import java.util.UUID;

public record PendingParticipantResponse(UUID userId, String displayName, int completed, int total, boolean isSelf) {}
