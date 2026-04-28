package com.ethos.dto;

import java.util.UUID;

public record ContactResponse(UUID id, String displayName, String tag, String avatarUrl) {}
