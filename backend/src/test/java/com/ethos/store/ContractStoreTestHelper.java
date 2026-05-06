package com.ethos.store;

import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import com.ethos.model.SignStatus;
import com.ethos.util.CycleDateCalculator;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;

class ContractStoreTestHelper {

    record CycleDates(LocalDate startDate, LocalDate endDate, LocalDate votingDeadline) {}

    record ActiveContractFixture(ContractDetail detail, Cycle cycle) {}

    static CycleDates validCycleDates(LocalDate startDate, com.ethos.model.Period period) {
        CycleDateCalculator.CycleDates dates = CycleDateCalculator.compute(startDate, period);
        return new CycleDates(dates.startDate(), dates.endDate(), dates.votingDeadline());
    }

    static UUID insertUserRaw(Jdbi jdbi, String tag, String email) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        INSERT INTO users (supertokens_user_id, display_name, tag, email)
                        VALUES (:st, :name, :tag, :email)
                        RETURNING id
                        """)
                .bind("st", "st-" + tag)
                .bind("name", "Test User")
                .bind("tag", tag)
                .bind("email", email)
                .mapTo(UUID.class)
                .one());
    }

    static void signParticipant(UUID participantId, ParticipantStore store) {
        store.updateParticipantSignStatus(participantId, SignStatus.SIGNED, Instant.now());
    }

    static void setFrequency(UUID participantId, int frequency, ParticipantStore store) {
        store.updateParticipantCommitment(participantId, null, frequency);
    }

    /** Creates a contract and optionally adds extra participants beyond the creator. */
    static ContractDetail insertContractWithParticipants(
            ContractStore contractStore,
            ParticipantStore participantStore,
            UUID creatorId,
            UUID... participantUserIds) {
        ContractDetail detail = contractStore.insert(
                creatorId,
                "",
                "",
                com.ethos.model.Period.weekly,
                LocalDate.now().plusDays(1));
        for (UUID userId : participantUserIds) {
            participantStore.insertParticipant(detail.contract().id(), userId);
        }
        return detail;
    }

    /**
     * Creates an active contract with a single signed participant (frequency=3, weekly, starting
     * tomorrow) and returns the detail and first cycle.
     */
    static ActiveContractFixture givenActiveContract(
            ContractStore contractStore, ParticipantStore participantStore, Jdbi jdbi, UUID creatorId) {
        ContractDetail detail = insertContractWithParticipants(contractStore, participantStore, creatorId);
        signParticipant(detail.participants().get(0).id(), participantStore);
        setFrequency(detail.participants().get(0).id(), 3, participantStore);
        CycleDates dates = validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
        contractStore.activateContract(
                detail.contract().id(),
                dates.startDate(),
                dates.endDate(),
                dates.votingDeadline(),
                List.of(detail.participants().get(0).id()));
        Cycle cycle = new CycleStore(jdbi)
                .findCycleByContractAndNumber(detail.contract().id(), 1)
                .orElseThrow();
        return new ActiveContractFixture(detail, cycle);
    }
}
