package com.ethos.service;

import com.ethos.dto.ActiveContractResponse;
import com.ethos.dto.ActiveParticipantResponse;
import com.ethos.dto.ContractParticipantResponse;
import com.ethos.dto.ContractResponse;
import com.ethos.dto.ContractSummaryResponse;
import com.ethos.dto.PendingParticipantResponse;
import com.ethos.dto.PendingResolutionContractResponse;
import com.ethos.model.ContractDetail;
import com.ethos.model.Participant;
import com.ethos.model.Period;
import com.ethos.store.ContractStore;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractService.class);

    // Dummy participant names shared across the placeholder responses below — see the
    // per-method javadoc for why these exist. Named here instead of repeated inline so
    // PMD's duplicate-literal check doesn't need a bespoke suppression.
    private static final String DUMMY_EDWARD = "Edward";
    private static final String DUMMY_ALEX = "Alex";
    private static final String DUMMY_SARAH = "Sarah";
    private static final String DUMMY_MIKE = "Mike";
    private static final String DUMMY_JAMES = "James";

    private final ContractStore contractStore;

    public ContractService(ContractStore contractStore) {
        this.contractStore = contractStore;
    }

    @SuppressWarnings("PMD.GuardLogStatement")
    public ContractResponse createContract(UUID creatorId) {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        ContractDetail detail = contractStore.insert(creatorId, "", "", Period.WEEKLY, startDate);
        log.info("contract.created contractId={} userId={}", detail.contract().id(), creatorId);
        return toResponse(detail);
    }

    /**
     * Dummy data — real progress aggregation (habit_actions/evidence/votes) is not implemented yet.
     * Shape matches docs/API.md GET /contracts/me/active so the frontend can be built against it now.
     */
    public List<ActiveContractResponse> listActiveContracts(UUID userId) {
        return List.of(
                new ActiveContractResponse(
                        UUID.randomUUID(),
                        "Gym 3x/Week",
                        3,
                        LocalDate.now(ZoneOffset.UTC).minusDays(2),
                        LocalDate.now(ZoneOffset.UTC).plusDays(5),
                        0,
                        List.of(
                                new ActiveParticipantResponse(DUMMY_EDWARD, null, 2, 0, 3),
                                new ActiveParticipantResponse(DUMMY_ALEX, null, 1, 1, 3))),
                new ActiveContractResponse(
                        UUID.randomUUID(),
                        "No Sugar",
                        1,
                        LocalDate.now(ZoneOffset.UTC).minusDays(1),
                        LocalDate.now(ZoneOffset.UTC).plusDays(6),
                        2,
                        List.of(
                                new ActiveParticipantResponse(DUMMY_EDWARD, null, 0, 0, 1),
                                new ActiveParticipantResponse(DUMMY_SARAH, null, 1, 0, 1),
                                new ActiveParticipantResponse(DUMMY_MIKE, null, 1, 0, 1))));
    }

    /**
     * Dummy data — real progress aggregation is not implemented yet. Shape matches
     * docs/API.md GET /contracts/me/pending-resolution.
     */
    public List<PendingResolutionContractResponse> listPendingResolutionContracts(UUID userId) {
        return List.of(new PendingResolutionContractResponse(
                UUID.randomUUID(),
                "Morning Run",
                2,
                3,
                List.of(
                        new PendingParticipantResponse(DUMMY_EDWARD, 3, 3),
                        new PendingParticipantResponse(DUMMY_ALEX, 1, 3))));
    }

    /**
     * Dummy data — backs the Contracts tab's full list/history. Real implementation needs a
     * store query spanning all statuses (active, pending_resolution, settled), which doesn't
     * exist yet; ContractStore's dashboard methods only cover active/pending_resolution.
     */
    public List<ContractSummaryResponse> listContracts(UUID userId) {
        return List.of(
                new ContractSummaryResponse(UUID.randomUUID(), "Gym 3x/Week", "active", 3, List.of(DUMMY_ALEX)),
                new ContractSummaryResponse(
                        UUID.randomUUID(), "No Sugar", "active", 1, List.of(DUMMY_SARAH, DUMMY_MIKE)),
                new ContractSummaryResponse(
                        UUID.randomUUID(), "Morning Run", "pending_resolution", 2, List.of(DUMMY_ALEX)),
                new ContractSummaryResponse(
                        UUID.randomUUID(), "Deep Work", "settled", 41, List.of(DUMMY_SARAH, DUMMY_JAMES)));
    }

    private static ContractResponse toResponse(ContractDetail detail) {
        List<ContractParticipantResponse> participants = detail.participants().stream()
                .map(ContractService::toParticipantResponse)
                .toList();
        return new ContractResponse(
                detail.contract().id(),
                detail.contract().name(),
                detail.contract().forfeit(),
                detail.contract().period().name().toLowerCase(Locale.ROOT),
                detail.contract().startDate(),
                detail.contract().status().name().toLowerCase(Locale.ROOT),
                detail.currentCycleNumber(),
                detail.contract().creatorId(),
                detail.contract().createdAt(),
                participants);
    }

    private static ContractParticipantResponse toParticipantResponse(Participant participant) {
        return new ContractParticipantResponse(
                participant.id(),
                participant.userId(),
                participant.habit(),
                participant.frequency(),
                participant.signStatus().name().toLowerCase(Locale.ROOT),
                participant.optedOutOfNextCycle());
    }
}
