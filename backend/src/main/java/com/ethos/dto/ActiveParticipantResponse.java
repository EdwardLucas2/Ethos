package com.ethos.dto;

import java.util.UUID;

public record ActiveParticipantResponse(
        UUID userId, String displayName, String avatarUrl, int completed, int pending, int total) {}
