package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.exception.ConflictException;
import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import com.ethos.model.Participant;
import com.ethos.model.Period;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ParticipantStoreTest extends IntegrationTestBase {

    private ContractStore contractStore;
    private ParticipantStore participantStore;

    @BeforeEach
    void setUp() {
        contractStore = new ContractStore(JDBI);
        participantStore = new ParticipantStore(JDBI);
    }

    @Nested
    class InsertParticipant {

        @Test
        void givenValidContractAndUser_createsWithWaitingStatus() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");

            Participant participant = participantStore.insertParticipant(detail.contract().id(), user2);

            assertEquals(user2, participant.userId());
            assertEquals("waiting", participant.signStatus());
            assertNull(participant.habit());
            assertNull(participant.frequency());
            assertFalse(participant.optedOutOfNextCycle());
        }

        @Test
        void givenDuplicateUserAndContract_throwsConflictException() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            participantStore.insertParticipant(detail.contract().id(), user2);

            assertThrows(ConflictException.class, () -> participantStore.insertParticipant(detail.contract().id(), user2));
        }
    }

    @Nested
    class FindParticipantById {

        @Test
        void givenExistingId_returnsParticipant() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.findParticipantById(detail.participants().get(0).id());

            assertTrue(result.isPresent());
            assertEquals(creator, result.get().userId());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            Optional<Participant> result = participantStore.findParticipantById(UUID.randomUUID());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class FindParticipantByContractAndUser {

        @Test
        void givenExistingPair_returnsParticipant() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.findParticipantByContractAndUser(detail.contract().id(), creator);

            assertTrue(result.isPresent());
            assertEquals(creator, result.get().userId());
        }

        @Test
        void givenUnknownPair_returnsEmpty() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.findParticipantByContractAndUser(detail.contract().id(), UUID.randomUUID());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class FindAllParticipantsByCycleId {

        @Test
        void givenCycleWithHabitActions_returnsParticipants() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = new CycleStore(JDBI).findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            List<Participant> participants = participantStore.findAllParticipantsByCycleId(cycle.id());

            assertEquals(1, participants.size());
            assertEquals(creator, participants.get(0).userId());
        }

        @Test
        void givenCycleWithNoHabitActions_returnsEmpty() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = new CycleStore(JDBI).findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            JDBI.useHandle(h -> h.execute("DELETE FROM habit_actions WHERE cycle_id = ?", cycle.id()));

            List<Participant> participants = participantStore.findAllParticipantsByCycleId(cycle.id());

            assertTrue(participants.isEmpty());
        }

        @Test
        void givenMultipleParticipants_returnsAll() {
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
            Cycle cycle = new CycleStore(JDBI).findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            List<Participant> participants = participantStore.findAllParticipantsByCycleId(cycle.id());

            assertEquals(2, participants.size());
        }
    }

    @Nested
    class UpdateParticipantSignStatus {

        @Test
        void givenValidTransition_updatesStatus() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant participant = participantStore.insertParticipant(detail.contract().id(), user2);

            Optional<Participant> result = participantStore.updateParticipantSignStatus(participant.id(), "signed", Instant.now());

            assertTrue(result.isPresent());
            assertEquals("signed", result.get().signStatus());
            assertNotNull(result.get().signedAt());
        }

        @Test
        void givenNonSignedStatus_signedAtIsNull() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant participant = participantStore.insertParticipant(detail.contract().id(), user2);

            Optional<Participant> result = participantStore.updateParticipantSignStatus(participant.id(), "declined", null);

            assertTrue(result.isPresent());
            assertEquals("declined", result.get().signStatus());
            assertNull(result.get().signedAt());
        }

        @Test
        void givenUnknownParticipant_returnsEmpty() {
            Optional<Participant> result = participantStore.updateParticipantSignStatus(UUID.randomUUID(), "signed", Instant.now());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class UpdateParticipantCommitment {

        @Test
        void givenHabitOnly_updatesHabit() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.updateParticipantCommitment(detail.participants().get(0).id(), "Gym", null);

            assertTrue(result.isPresent());
            assertEquals("Gym", result.get().habit());
            assertNull(result.get().frequency());
        }

        @Test
        void givenFrequencyOnly_updatesFrequency() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.updateParticipantCommitment(detail.participants().get(0).id(), null, 3);

            assertTrue(result.isPresent());
            assertEquals(3, result.get().frequency());
        }

        @Test
        void givenBoth_updatesBoth() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Participant> result = participantStore.updateParticipantCommitment(detail.participants().get(0).id(), "Gym", 3);

            assertTrue(result.isPresent());
            assertEquals("Gym", result.get().habit());
            assertEquals(3, result.get().frequency());
        }
    }

    @Nested
    class UpdateParticipantOptOut {

        @Test
        void givenParticipant_setsOptedOut() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            participantStore.updateParticipantOptOut(detail.participants().get(0).id());

            Participant result = participantStore.findParticipantById(detail.participants().get(0).id()).orElseThrow();
            assertTrue(result.optedOutOfNextCycle());
        }

        @Test
        void givenCalledTwice_stillTrue() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            participantStore.updateParticipantOptOut(detail.participants().get(0).id());
            participantStore.updateParticipantOptOut(detail.participants().get(0).id());

            Participant result = participantStore.findParticipantById(detail.participants().get(0).id()).orElseThrow();
            assertTrue(result.optedOutOfNextCycle());
        }
    }

    @Nested
    class CountSignedParticipants {

        @Test
        void givenContractWithSignedParticipants_countsOnlySigned() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant p2 = participantStore.insertParticipant(detail.contract().id(), user2);
            ContractStoreTestHelper.signParticipant(p2.id(), participantStore);
            UUID user3 = ContractStoreTestHelper.insertUserRaw(JDBI, "user3", "user3@example.com");
            participantStore.insertParticipant(detail.contract().id(), user3); // waiting

            int count = participantStore.countSignedParticipants(detail.contract().id());

            assertEquals(2, count);
        }

        @Test
        void givenEmptyContract_returnsZero() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            int count = participantStore.countSignedParticipants(detail.contract().id());

            assertEquals(0, count);
        }
    }
}
