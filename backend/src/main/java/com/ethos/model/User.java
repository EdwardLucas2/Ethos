package com.ethos.model;

import java.time.Instant;
import java.util.UUID;

public record User(
        UUID id,
        String supertokensUserId,
        String displayName,
        String tag,
        String email,
        UUID avatarId,
        Instant createdAt) {}
