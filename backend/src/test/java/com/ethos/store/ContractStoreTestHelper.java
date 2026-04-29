package com.ethos.store;

import com.ethos.model.ContractDetail;
import com.ethos.model.Participant;
import com.ethos.util.CycleDateCalculator;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;

class ContractStoreTestHelper {

    record CycleDates(LocalDate startDate, LocalDate endDate, LocalDate votingDeadline) {}

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
        store.updateParticipantSignStatus(participantId, "signed", Instant.now());
    }

    static void setFrequency(UUID participantId, int frequency, ParticipantStore store) {
        Participant participant = store.findParticipantById(participantId).orElseThrow();
        store.updateParticipantCommitment(participantId, participant.habit(), frequency);
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
}
