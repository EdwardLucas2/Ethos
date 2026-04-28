package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import com.ethos.model.Participant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ContractStoreCycleTest extends IntegrationTestBase {

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
    class ActivateContract {

        @Test
        void givenDraftContract_transitionsToActive() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);

            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            boolean result = contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            assertTrue(result);
            ContractDetail updated = contractStore.findById(detail.contract().id()).orElseThrow();
            assertEquals("active", updated.contract().status());
        }

        @Test
        void givenActivated_createsCycleWithNumberOne() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);

            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            Optional<Cycle> cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1);
            assertTrue(cycle.isPresent());
            assertEquals(1, cycle.get().cycleNumber());
        }

        @Test
        void givenActivated_createsHabitActionsForAllParticipants() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant p2 = participantStore.insertParticipant(detail.contract().id(), user2);
            ContractStoreTestHelper.signParticipant(p2.id(), participantStore);
            ContractStoreTestHelper.setFrequency(p2.id(), 2, participantStore);

            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id(), p2.id()));

            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            int habitActionCount = JDBI.withHandle(h ->
                    h.createQuery("SELECT COUNT(*) FROM habit_actions WHERE cycle_id = :cycleId")
                            .bind("cycleId", cycle.id())
                            .mapTo(Integer.class)
                            .one());
            assertEquals(5, habitActionCount); // 3 + 2
        }

        @Test
        void givenParticipantWithFrequency3_createsThreeHabitActions() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);

            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            List<Integer> actionNumbers = JDBI.withHandle(h ->
                    h.createQuery("SELECT action_number FROM habit_actions WHERE cycle_id = :cycleId ORDER BY action_number")
                            .bind("cycleId", cycle.id())
                            .mapTo(Integer.class)
                            .list());
            assertEquals(List.of(1, 2, 3), actionNumbers);
        }

        @Test
        void givenCalledTwice_returnsFalse() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", com.ethos.model.Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);

            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            boolean result = contractStore.activateContract(
                    detail.contract().id(),
                    dates.startDate(),
                    dates.endDate(),
                    dates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            assertFalse(result);
        }
    }

    @Nested
    class AdvanceCycleToResolution {

        @Test
        void givenActiveCycle_setsToPendingResolution() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(dates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(
                    cycle.id(), detail.contract().id(), 2,
                    advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            Cycle updatedCycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            assertEquals("pending_resolution", updatedCycle.status());
        }

        @Test
        void givenActiveCycle_createsNextCycle() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(dates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(
                    cycle.id(), detail.contract().id(), 2,
                    advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(),
                    List.of(detail.participants().get(0).id()));

            Cycle nextCycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 2).orElseThrow();
            assertEquals(2, nextCycle.cycleNumber());
            assertEquals("active", nextCycle.status());
        }

        @Test
        void givenActiveParticipants_createsHabitActionsOnlyForThem() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 2, participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant p2 = participantStore.insertParticipant(detail.contract().id(), user2);
            ContractStoreTestHelper.signParticipant(p2.id(), participantStore);
            ContractStoreTestHelper.setFrequency(p2.id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id(), p2.id()));
            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            participantStore.updateParticipantOptOut(p2.id());

            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(dates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(
                    cycle.id(), detail.contract().id(), 2,
                    advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(),
                    List.of(detail.participants().get(0).id())); // only creator

            Cycle nextCycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 2).orElseThrow();
            int habitActionCount = JDBI.withHandle(h ->
                    h.createQuery("SELECT COUNT(*) FROM habit_actions WHERE cycle_id = :cycleId")
                            .bind("cycleId", nextCycle.id())
                            .mapTo(Integer.class)
                            .one());
            assertEquals(2, habitActionCount); // only creator's 2 actions
        }

        @Test
        void givenWrongCycleId_returnsEmpty() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);

            Optional<Cycle> result = contractStore.advanceCycleToResolution(
                    UUID.randomUUID(), detail.contract().id(), 2,
                    LocalDate.now().plusDays(8), LocalDate.now().plusDays(15), LocalDate.now().plusDays(18),
                    List.of(detail.participants().get(0).id()));

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class EndContractIfEmpty {

        @Test
        void givenSignedParticipantsRemain_noOp() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            contractStore.endContractIfEmpty(detail.contract().id());

            ContractDetail updated = contractStore.findById(detail.contract().id()).orElseThrow();
            assertEquals("active", updated.contract().status());
        }

        @Test
        void givenAllSignedOptedOut_transitionsToEnded() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            participantStore.updateParticipantOptOut(detail.participants().get(0).id());

            contractStore.endContractIfEmpty(detail.contract().id());

            ContractDetail updated = contractStore.findById(detail.contract().id()).orElseThrow();
            assertEquals("ended", updated.contract().status());
        }

        @Test
        void givenAlreadyEnded_noOp() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            contractStore.updateStatus(detail.contract().id(), "ended");

            contractStore.endContractIfEmpty(detail.contract().id());

            ContractDetail updated = contractStore.findById(detail.contract().id()).orElseThrow();
            assertEquals("ended", updated.contract().status());
        }
    }
}
