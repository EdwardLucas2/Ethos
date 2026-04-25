package com.ethos.dto;

import java.util.UUID;

public record UserSearchResponse(UUID id, String displayName, String tag, String avatarUrl, boolean isContact) {}
