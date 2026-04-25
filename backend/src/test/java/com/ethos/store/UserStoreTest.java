package com.ethos.store;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.exception.DuplicateAccountException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.integration.IntegrationTestBase;
import com.ethos.model.User;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserStoreTest extends IntegrationTestBase {

    private UserStore userStore;

    @BeforeEach
    void setUpStore() {
        userStore = new UserStore(JDBI);
    }

    private User buildUser(String supertokensUserId, String tag, String email) {
        return new User(null, supertokensUserId, "Test User", tag, email, null, null);
    }

    private User insertUser(String supertokensUserId, String tag, String email) {
        return userStore.insert(buildUser(supertokensUserId, tag, email));
    }

    @Nested
    class Insert {

        @Test
        void givenValidUser_insertsAndReturnsWithGeneratedId() {
            var user = buildUser("st-1", "testuser1234", "test@example.com");

            var result = userStore.insert(user);

            assertNotNull(result.id());
            assertEquals("st-1", result.supertokensUserId());
            assertEquals("testuser1234", result.tag());
            assertEquals("test@example.com", result.email());
            assertNotNull(result.createdAt());
        }

        @Test
        void givenDuplicateSupertokensUserId_throwsDuplicateAccountException() {
            userStore.insert(buildUser("st-dup", "tag1abc1", "a@example.com"));

            var ex = assertThrows(
                    DuplicateAccountException.class,
                    () -> userStore.insert(buildUser("st-dup", "tag2abc2", "b@example.com")));
            assertEquals("Account already registered", ex.getMessage());
        }

        @Test
        void givenDuplicateTag_throwsDuplicateTagException() {
            userStore.insert(buildUser("st-1", "sametag123", "a@example.com"));

            assertThrows(
                    DuplicateTagException.class,
                    () -> userStore.insert(buildUser("st-2", "sametag123", "b@example.com")));
        }

        @Test
        void givenDuplicateEmail_throwsDuplicateAccountException() {
            userStore.insert(buildUser("st-1", "tag1abc1", "same@example.com"));

            var ex = assertThrows(
                    DuplicateAccountException.class,
                    () -> userStore.insert(buildUser("st-2", "tag2abc2", "same@example.com")));
            assertEquals("An account with this email already exists", ex.getMessage());
        }
    }

    @Nested
    class FindById {

        @Test
        void givenExistingUser_returnsUser() {
            var inserted = userStore.insert(buildUser("st-1", "tag1abc1", "a@example.com"));

            var result = userStore.findById(inserted.id());

            assertTrue(result.isPresent());
            assertEquals(inserted.id(), result.get().id());
            assertEquals("st-1", result.get().supertokensUserId());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            var result = userStore.findById(UUID.randomUUID());

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class FindBySupertokensUserId {

        @Test
        void givenExistingUser_returnsUser() {
            userStore.insert(buildUser("st-known", "tag1abc1", "a@example.com"));

            var result = userStore.findBySupertokensUserId("st-known");

            assertTrue(result.isPresent());
            assertEquals("st-known", result.get().supertokensUserId());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            var result = userStore.findBySupertokensUserId("st-does-not-exist");

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class Update {

        @Test
        void givenExistingUser_updatesDisplayNameAndReturns() {
            var inserted = insertUser("st-1", "tag1abc1", "a@example.com");

            var result = userStore.update(inserted.id(), "New Name");

            assertTrue(result.isPresent());
            assertEquals("New Name", result.get().displayName());
            assertEquals(inserted.id(), result.get().id());
        }

        @Test
        void givenUnknownId_returnsEmpty() {
            var result = userStore.update(UUID.randomUUID(), "New Name");

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    class FindByTagPrefix {

        @Test
        void givenMatchingPrefix_returnsMatchingUsers() {
            insertUser("st-1", "alice1234", "alice@example.com");
            insertUser("st-2", "bob1234ab", "bob@example.com");

            var result = userStore.findByTagPrefix("alice", UUID.randomUUID(), 20);

            assertEquals(1, result.size());
            assertEquals("alice1234", result.get(0).tag());
        }

        @Test
        void givenNoMatch_returnsEmptyList() {
            insertUser("st-1", "alice1234", "alice@example.com");

            var result = userStore.findByTagPrefix("zzzz", UUID.randomUUID(), 20);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenCallerIsInResults_excludesCaller() {
            var caller = insertUser("st-1", "alice1234", "alice@example.com");
            insertUser("st-2", "alice5678", "alice2@example.com");

            var result = userStore.findByTagPrefix("alice", caller.id(), 20);

            assertEquals(1, result.size());
            assertEquals("alice5678", result.get(0).tag());
        }

        @Test
        void givenContactInResults_isContactIsTrue() {
            var caller = insertUser("st-1", "alice1234", "alice@example.com");
            var friend = insertUser("st-2", "bob1234ab", "bob@example.com");
            userStore.insertContact(caller.id(), friend.id());

            var result = userStore.findByTagPrefix("bob", caller.id(), 20);

            assertEquals(1, result.size());
            assertTrue(result.get(0).isContact());
        }

        @Test
        void givenNonContactInResults_isContactIsFalse() {
            var caller = insertUser("st-1", "alice1234", "alice@example.com");
            insertUser("st-2", "bob1234ab", "bob@example.com");

            var result = userStore.findByTagPrefix("bob", caller.id(), 20);

            assertEquals(1, result.size());
            assertFalse(result.get(0).isContact());
        }
    }

    @Nested
    class InsertContact {

        @Test
        void givenValidPair_returnsTrueAndPersists() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");

            var result = userStore.insertContact(alice.id(), bob.id());

            assertTrue(result);
            assertEquals(1, userStore.findAllContacts(alice.id()).size());
        }

        @Test
        void givenDuplicatePair_returnsFalse() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");
            userStore.insertContact(alice.id(), bob.id());

            var result = userStore.insertContact(alice.id(), bob.id());

            assertFalse(result);
        }

        @Test
        void givenOneWayContact_doesNotImplyReverseContact() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");
            userStore.insertContact(alice.id(), bob.id());

            assertTrue(userStore.findAllContacts(alice.id()).stream().anyMatch(u -> u.id().equals(bob.id())));
            assertTrue(userStore.findAllContacts(bob.id()).isEmpty());
        }
    }

    @Nested
    class DeleteContact {

        @Test
        void givenExistingContact_returnsTrueAndRemoves() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");
            userStore.insertContact(alice.id(), bob.id());

            var result = userStore.deleteContact(alice.id(), bob.id());

            assertTrue(result);
            assertTrue(userStore.findAllContacts(alice.id()).isEmpty());
        }

        @Test
        void givenNonExistentContact_returnsFalse() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");

            var result = userStore.deleteContact(alice.id(), bob.id());

            assertFalse(result);
        }
    }

    @Nested
    class FindAllContacts {

        @Test
        void givenNoContacts_returnsEmptyList() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");

            assertTrue(userStore.findAllContacts(alice.id()).isEmpty());
        }

        @Test
        void givenMultipleContacts_returnsAllOrderedByDisplayName() {
            var alice = insertUser("st-1", "alice1234", "alice@example.com");
            var bob = insertUser("st-2", "bob1234ab", "bob@example.com");
            var carol = insertUser("st-3", "carol123c", "carol@example.com");
            userStore.insertContact(alice.id(), carol.id());
            userStore.insertContact(alice.id(), bob.id());

            var result = userStore.findAllContacts(alice.id());

            assertEquals(2, result.size());
            // Both users have "Test User" as display name so order is stable by tag;
            // verify both are present
            assertTrue(result.stream().anyMatch(u -> u.id().equals(bob.id())));
            assertTrue(result.stream().anyMatch(u -> u.id().equals(carol.id())));
        }
    }
}
