package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.Contract;
import com.ethos.model.ContractDetail;
import com.ethos.model.Participant;
import com.ethos.model.Period;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ContractStoreTest extends IntegrationTestBase {

    private ContractStore contractStore;
    private ParticipantStore participantStore;

    @BeforeEach
    void setUp() {
        contractStore = new ContractStore(JDBI);
        participantStore = new ParticipantStore(JDBI);
    }

    @Nested
    class Insert {

        @Test
        void givenValidRequest_createsContractWithDefaults() {
            UUID user = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");

            ContractDetail detail = contractStore.insert(user, "", "", Period.weekly, LocalDate.now().plusDays(1));

            assertNotNull(detail.contract().id());
            assertEquals("", detail.contract().name());
            assertEquals("", detail.contract().forfeit());
            assertEquals(Period.weekly, detail.contract().period());
            assertEquals("draft", detail.contract().status());
            assertNotNull(detail.contract().createdAt());
            assertEquals(1, detail.participants().size());
            assertEquals(user, detail.participants().get(0).userId());
            assertEquals("drafting", detail.participants().get(0).signStatus());
            assertNull(detail.participants().get(0).habit());
            assertNull(detail.participants().get(0).frequency());
            assertFalse(detail.participants().get(0).optedOutOfNextCycle());
            assertNull(detail.currentCycleNumber());
        }

        @Test
        void givenMultipleCalls_createsIndependentContracts() {
            UUID user1 = ContractStoreTestHelper.insertUserRaw(JDBI, "user1", "user1@example.com");
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");

            ContractDetail detail1 = contractStore.insert(user1, "Contract 1", "Forfeit 1", Period.monthly, LocalDate.now().plusDays(1));
            ContractDetail detail2 = contractStore.insert(user2, "Contract 2", "Forfeit 2", Period.biweekly, LocalDate.now().plusDays(2));

            assertNotEquals(detail1.contract().id(), detail2.contract().id());
            assertEquals("Contract 1", detail1.contract().name());
            assertEquals("Contract 2", detail2.contract().name());
        }
    }

    @Nested
    class FindById {

        @Test
        void givenExistingContract_returnsContractAndParticipants() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            participantStore.insertParticipant(detail.contract().id(), user2);

            Optional<ContractDetail> result = contractStore.findById(detail.contract().id());

            assertTrue(result.isPresent());
            assertEquals("Test", result.get().contract().name());
            assertEquals(2, result.get().participants().size());
            assertNull(result.get().currentCycleNumber());
        }

        @Test
        void givenContractWithRemovedParticipant_excludesRemoved() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant participant2 = participantStore.insertParticipant(detail.contract().id(), user2);
            participantStore.updateParticipantSignStatus(participant2.id(), "removed", null);

            Optional<ContractDetail> result = contractStore.findById(detail.contract().id());

            assertEquals(1, result.get().participants().size());
            assertEquals(creator, result.get().participants().get(0).userId());
        }

        @Test
        void givenContractWithDeclinedParticipant_includesDeclined() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant participant2 = participantStore.insertParticipant(detail.contract().id(), user2);
            participantStore.updateParticipantSignStatus(participant2.id(), "declined", null);

            Optional<ContractDetail> result = contractStore.findById(detail.contract().id());

            assertEquals(2, result.get().participants().size());
        }

        @Test
        void givenContractWithActiveCycle_setsCurrentCycleNumber() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));
            ContractStoreTestHelper.signParticipant(detail.participants().get(0).id(), participantStore);
            ContractStoreTestHelper.setFrequency(detail.participants().get(0).id(), 3, participantStore);
            UUID user2 = ContractStoreTestHelper.insertUserRaw(JDBI, "user2", "user2@example.com");
            Participant p2 = participantStore.insertParticipant(detail.contract().id(), user2);
            ContractStoreTestHelper.signParticipant(p2.id(), participantStore);
            ContractStoreTestHelper.setFrequency(p2.id(), 2, participantStore);
            contractStore.activateContract(detail.contract().id(), LocalDate.now().plusDays(1), LocalDate.now().plusDays(8), LocalDate.now().plusDays(11), java.util.List.of(detail.participants().get(0).id(), p2.id()));

            Optional<ContractDetail> result = contractStore.findById(detail.contract().id());

            assertEquals(1, result.get().currentCycleNumber());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            Optional<ContractDetail> result = contractStore.findById(UUID.randomUUID());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class UpdateFields {

        @Test
        void givenValidFields_updatesAll() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Old", "Old Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Contract> result = contractStore.updateFields(detail.contract().id(), "New", "New Forfeit", Period.monthly, LocalDate.now().plusDays(5));

            assertTrue(result.isPresent());
            assertEquals("New", result.get().name());
            assertEquals("New Forfeit", result.get().forfeit());
            assertEquals(Period.monthly, result.get().period());
            assertEquals(LocalDate.now().plusDays(5), result.get().startDate());
        }

        @Test
        void givenPartialUpdate_onlyChangedFieldsReflected() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Old", "Old Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Contract> result = contractStore.updateFields(detail.contract().id(), "New", detail.contract().forfeit(), detail.contract().period(), detail.contract().startDate());

            assertTrue(result.isPresent());
            assertEquals("New", result.get().name());
            assertEquals("Old Forfeit", result.get().forfeit());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            Optional<Contract> result = contractStore.updateFields(UUID.randomUUID(), "New", "Forfeit", Period.weekly, LocalDate.now());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class UpdateStatus {

        @Test
        void givenDraftContract_cancelsSuccessfully() {
            UUID creator = ContractStoreTestHelper.insertUserRaw(JDBI, "creator1", "creator1@example.com");
            ContractDetail detail = contractStore.insert(creator, "Test", "Forfeit", Period.weekly, LocalDate.now().plusDays(1));

            Optional<Contract> result = contractStore.updateStatus(detail.contract().id(), "cancelled");

            assertTrue(result.isPresent());
            assertEquals("cancelled", result.get().status());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            Optional<Contract> result = contractStore.updateStatus(UUID.randomUUID(), "cancelled");

            assertTrue(result.isEmpty());
        }
    }
}
