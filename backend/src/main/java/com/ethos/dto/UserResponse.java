package com.ethos.dto;

import java.util.UUID;

public record UserResponse(UUID id, String displayName, String tag, String email, String avatarUrl) {}
