package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.ActiveContractRow;
import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import com.ethos.model.Participant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ContractStoreDashboardTest extends IntegrationTestBase {

    private ContractStore contractStore;
    private ParticipantStore participantStore;
    private CycleStore cycleStore;

    @BeforeEach
    void setUp() {
        contractStore = new ContractStore(JDBI);
        participantStore = new ParticipantStore(JDBI);
        cycleStore = new CycleStore(JDBI);
    }

    @Nested
    class GetActiveContracts {

        @Test
        void givenSignedParticipant_returnsContract() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant p2 = participantStore.insertParticipant(detail.contract().id(), user2);
            ContractStoreTestHelper.signParticipant(p2.id(), participantStore);
            ContractStoreTestHelper.setFrequency(p2.id(), 2, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id(), p2.id()));

            List<ActiveContractRow> result = contractStore.getActiveContracts(creator);

            assertEquals(1, result.size());
            assertEquals(detail.contract().id(), result.get(0).contract().id());
            assertEquals(2, result.get(0).participants().size());
        }

        @Test
        void givenNonSignedParticipant_doesNotReturnContract() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            participantStore.insertParticipant(detail.contract().id(), user2);

            List<ActiveContractRow> result = contractStore.getActiveContracts(creator);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenMultipleContracts_returnsAll() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail1 = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail1.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail1.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates1 = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail1.contract().id(), dates1.startDate(), dates1.endDate(), dates1.votingDeadline(), List.of(detail1.participants().get(0).id()));

            ContractDetail detail2 = contractStore.insert(creator, "Contract 2", "Forfeit 2", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail2.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail2.participants().get(0).id(), 2, participantStore);
            ContractStoreTestHelper.CycleDates dates2 = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail2.contract().id(), dates2.startDate(), dates2.endDate(), dates2.votingDeadline(), List.of(detail2.participants().get(0).id()));

            List<ActiveContractRow> result = contractStore.getActiveContracts(creator);

            assertEquals(2, result.size());
        }

        @Test
        void givenUserHasNoContracts_returnsEmpty() {
            UUID user = ContractStoreTestHelper.insertUserRaw(JDBI, "user1", "user1@example.com");

            List<ActiveContractRow> result = contractStore.getActiveContracts(user);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenActiveContract_participantsAreSignedOnly() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            participantStore.insertParticipant(detail.contract().id(), user2); // waiting, not signed
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<ActiveContractRow> result = contractStore.getActiveContracts(creator);

            assertEquals(1, result.get(0).participants().size());
            assertEquals(creator, result.get(0).participants().get(0).userId());
        }
    }

    @Nested
    class GetPendingResolutionContracts {

        @Test
        void givenPendingResolutionCycle_returnsContract() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates activateDates = ContractStoreTestHelper.validCycleDates(LocalDate.now().minusDays(8), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), activateDates.startDate(), activateDates.endDate(), activateDates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(activateDates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(cycle.id(), detail.contract().id(), 2, advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<ActiveContractRow> result = contractStore.getPendingResolutionContracts(creator);

            assertEquals(1, result.size());
            assertEquals(detail.contract().id(), result.get(0).contract().id());
        }

        @Test
        void givenNoPendingResolutionCycle_doesNotReturnContract() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<ActiveContractRow> result = contractStore.getPendingResolutionContracts(creator);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenBothActiveAndPending_contractAppearsInBoth() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates activateDates = ContractStoreTestHelper.validCycleDates(LocalDate.now().minusDays(8), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), activateDates.startDate(), activateDates.endDate(), activateDates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle1 = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(activateDates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(cycle1.id(), detail.contract().id(), 2, advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<ActiveContractRow> active = contractStore.getActiveContracts(creator);
            List<ActiveContractRow> pending = contractStore.getPendingResolutionContracts(creator);

            assertEquals(1, active.size());
            assertEquals(1, pending.size());
            assertEquals(detail.contract().id(), active.get(0).contract().id());
            assertEquals(detail.contract().id(), pending.get(0).contract().id());
        }
    }
}
