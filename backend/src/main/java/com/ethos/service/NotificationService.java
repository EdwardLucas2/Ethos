package com.ethos.service;

import java.util.UUID;

public class NotificationService {

    public void sendContractInvited(UUID recipientUserId, UUID contractId) {}

    public void sendEvidenceUploaded(UUID recipientUserId, UUID evidenceId) {}

    public void sendCyclePendingResolution(UUID recipientUserId, UUID cycleId) {}

    public void sendResolutionWinner(UUID recipientUserId, UUID resolutionId) {}

    public void sendResolutionLoser(UUID recipientUserId, UUID resolutionId) {}

    public void sendPester(UUID recipientUserId, UUID pesterId) {}
}
