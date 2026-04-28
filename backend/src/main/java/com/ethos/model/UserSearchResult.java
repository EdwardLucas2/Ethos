package com.ethos.model;

import java.util.UUID;

public record UserSearchResult(UUID id, String displayName, String tag, UUID avatarId, boolean isContact) {}
