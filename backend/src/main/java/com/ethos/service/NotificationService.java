package com.ethos.service;

import com.ethos.dto.ContractInvitedNotification;
import com.ethos.dto.CyclePendingResolutionNotification;
import com.ethos.dto.EvidenceUploadedNotification;
import com.ethos.dto.NotificationResponse;
import com.ethos.dto.PesterNotification;
import com.ethos.dto.ResolutionLoserNotification;
import com.ethos.dto.ResolutionWinnerNotification;
import java.time.Instant;
import java.util.List;
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
        return List.of(
                new EvidenceUploadedNotification(
                        UUID.randomUUID(),
                        Instant.now().minusSeconds(3600),
                        "Alex",
                        UUID.randomUUID(),
                        "Gym 3x/Week",
                        3,
                        UUID.randomUUID()),
                new ContractInvitedNotification(
                        UUID.randomUUID(), Instant.now().minusSeconds(7200), "Sarah", UUID.randomUUID(), "No Sugar"),
                new CyclePendingResolutionNotification(
                        UUID.randomUUID(), Instant.now().minusSeconds(86400), UUID.randomUUID(), "Morning Run", 2),
                new ResolutionWinnerNotification(
                        UUID.randomUUID(),
                        Instant.now().minusSeconds(90000),
                        UUID.randomUUID(),
                        "Deep Work",
                        "A pint",
                        List.of("Bob")),
                new ResolutionLoserNotification(
                        UUID.randomUUID(),
                        Instant.now().minusSeconds(90000),
                        UUID.randomUUID(),
                        "Deep Work",
                        "A pint",
                        List.of("Alex", "Sarah")),
                new PesterNotification(
                        UUID.randomUUID(), Instant.now().minusSeconds(1800), UUID.randomUUID(), "Alex", "A pint"));
    }
}
