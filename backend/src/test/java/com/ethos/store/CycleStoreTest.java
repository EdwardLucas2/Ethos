package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CycleStoreTest extends IntegrationTestBase {

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
    class FindCycleByContractAndNumber {

        @Test
        void givenExistingCycle_returnsCycle() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            Optional<Cycle> result = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1);

            assertTrue(result.isPresent());
            assertEquals(1, result.get().cycleNumber());
        }

        @Test
        void givenWrongCycleNumber_returnsEmpty() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);

            Optional<Cycle> result = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 99);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenMultipleCycles_returnsCorrectCycle() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle1 = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(dates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(cycle1.id(), detail.contract().id(), 2, advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(), List.of(detail.participants().get(0).id()));

            Optional<Cycle> result = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 2);

            assertTrue(result.isPresent());
            assertEquals(2, result.get().cycleNumber());
        }
    }

    @Nested
    class FindCyclesDueForTransition {

        @Test
        void givenActiveCycleWithPastEndDate_included() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().minusDays(8), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<Cycle> due = cycleStore.findCyclesDueForTransition();

            assertFalse(due.isEmpty());
            assertTrue(due.stream().anyMatch(c -> c.id().equals(
                    cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow().id())));
        }

        @Test
        void givenActiveCycleWithFutureEndDate_excluded() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<Cycle> due = cycleStore.findCyclesDueForTransition();

            assertTrue(due.isEmpty());
        }

        @Test
        void givenPendingResolutionCycleWithPastDeadline_included() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            // Start 12 days ago → endDate = now−6, votingDeadline = now−3 (past ✓)
            ContractStoreTestHelper.CycleDates activateDates = ContractStoreTestHelper.validCycleDates(LocalDate.now().minusDays(12), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), activateDates.startDate(), activateDates.endDate(), activateDates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle1 = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(activateDates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(cycle1.id(), detail.contract().id(), 2, advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<Cycle> due = cycleStore.findCyclesDueForTransition();

            assertTrue(due.stream().anyMatch(c -> c.status().equals("pending_resolution")));
        }

        @Test
        void givenPendingResolutionCycleWithFutureDeadline_excluded() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates activateDates = ContractStoreTestHelper.validCycleDates(LocalDate.now().minusDays(8), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), activateDates.startDate(), activateDates.endDate(), activateDates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle1 = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            ContractStoreTestHelper.CycleDates advanceDates = ContractStoreTestHelper.validCycleDates(activateDates.endDate().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.advanceCycleToResolution(cycle1.id(), detail.contract().id(), 2, advanceDates.startDate(), advanceDates.endDate(), advanceDates.votingDeadline(), List.of(detail.participants().get(0).id()));

            List<Cycle> due = cycleStore.findCyclesDueForTransition();

            assertTrue(due.stream().noneMatch(c -> c.status().equals("pending_resolution")));
        }
    }

    @Nested
    class UpdateCycleStatus {

        @Test
        void givenCycle_updatesStatus() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = ContractStoreTestHelper.insertContractWithParticipants(contractStore, participantStore, creator);
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            ContractStoreTestHelper.CycleDates dates = ContractStoreTestHelper.validCycleDates(LocalDate.now().plusDays(1), com.ethos.model.Period.weekly);
            contractStore.activateContract(detail.contract().id(), dates.startDate(), dates.endDate(), dates.votingDeadline(), List.of(detail.participants().get(0).id()));
            Cycle cycle = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();

            cycleStore.updateCycleStatus(cycle.id(), "pending_resolution");

            Cycle updated = cycleStore.findCycleByContractAndNumber(detail.contract().id(), 1).orElseThrow();
            assertEquals("pending_resolution", updated.status());
        }
    }
}
