package com.ethos.service;

import com.ethos.dto.NotificationResponse;
import com.ethos.dto.NotificationType;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class NotificationService {

    public void sendContractInvited(UUID recipientUserId, UUID contractId) {}

    public void sendEvidenceUploaded(UUID recipientUserId, UUID evidenceId) {}

    public void sendCyclePendingResolution(UUID recipientUserId, UUID cycleId) {}

    public void sendResolutionWinner(UUID recipientUserId, UUID resolutionId) {}

    public void sendResolutionLoser(UUID recipientUserId, UUID resolutionId) {}

    public void sendPester(UUID recipientUserId, UUID pesterId) {}

    /**
     * Dummy data — notifications are not yet persisted or written by trigger points.
     * Shape matches docs/API.md GET /notifications so the frontend can be built against it now.
     */
    public List<NotificationResponse> listUnread(UUID recipientUserId) {
        UUID contractId = UUID.randomUUID();
        return List.of(
                new NotificationResponse(
                        UUID.randomUUID(),
                        NotificationType.EVIDENCE_UPLOADED.name().toLowerCase(Locale.ROOT),
                        Instant.now().minusSeconds(3600),
                        "Alex",
                        contractId,
                        "Gym 3x/Week",
                        3,
                        UUID.randomUUID(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null),
                new NotificationResponse(
                        UUID.randomUUID(),
                        NotificationType.CONTRACT_INVITED.name().toLowerCase(Locale.ROOT),
                        Instant.now().minusSeconds(7200),
                        null,
                        UUID.randomUUID(),
                        "No Sugar",
                        null,
                        null,
                        "Sarah",
                        null,
                        null,
                        null,
                        null,
                        null),
                new NotificationResponse(
                        UUID.randomUUID(),
                        NotificationType.CYCLE_PENDING_RESOLUTION.name().toLowerCase(Locale.ROOT),
                        Instant.now().minusSeconds(86400),
                        null,
                        UUID.randomUUID(),
                        "Morning Run",
                        2,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null));
    }
}
