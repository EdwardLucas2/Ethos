package com.ethos.dto;

public record ActiveParticipantResponse(String displayName, String avatarUrl, int completed, int pending, int total) {}
