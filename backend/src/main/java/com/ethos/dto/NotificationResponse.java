package com.ethos.dto;

import io.javalin.openapi.Discriminator;
import io.javalin.openapi.DiscriminatorProperty;
import io.javalin.openapi.OneOf;

/**
 * One variant per notification kind, discriminated by {@code type}. Each variant only carries the
 * fields that notification actually needs — see docs/API.md's Dashboard section for the JSON shape
 * per type. {@code type}'s value always matches the variant's {@code @DiscriminatorMappingName}
 * annotation; every variant's compact constructor rejects any other value, and the convenience
 * constructor supplies it automatically rather than trusting callers to spell it correctly.
 */
@OneOf(
        value = {},
        discriminator =
                @Discriminator(
                        property = @DiscriminatorProperty(name = "type", type = String.class, injectInMappings = true)))
public sealed interface NotificationResponse
        permits EvidenceUploadedNotification,
                ContractInvitedNotification,
                CyclePendingResolutionNotification,
                ResolutionWinnerNotification,
                ResolutionLoserNotification,
                PesterNotification {}
