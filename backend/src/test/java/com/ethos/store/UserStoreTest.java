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

            assertThrows(
                    DuplicateAccountException.class,
                    () -> userStore.insert(buildUser("st-dup", "tag2abc2", "b@example.com")));
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

            assertThrows(
                    DuplicateAccountException.class,
                    () -> userStore.insert(buildUser("st-2", "tag2abc2", "same@example.com")));
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
    class FindByTagPrefix {

        @Test
        void givenMatchingPrefix_returnsMatchingUsers() {
            userStore.insert(buildUser("st-1", "alice1234", "alice@example.com"));
            userStore.insert(buildUser("st-2", "bob1234ab", "bob@example.com"));

            var result = userStore.findByTagPrefix("alice", UUID.randomUUID(), 20);

            assertEquals(1, result.size());
            assertEquals("alice1234", result.get(0).tag());
        }

        @Test
        void givenNoMatch_returnsEmptyList() {
            userStore.insert(buildUser("st-1", "alice1234", "alice@example.com"));

            var result = userStore.findByTagPrefix("zzzz", UUID.randomUUID(), 20);

            assertTrue(result.isEmpty());
        }

        @Test
        void givenCallerIsInResults_excludesCaller() {
            var caller = userStore.insert(buildUser("st-1", "alice1234", "alice@example.com"));
            userStore.insert(buildUser("st-2", "alice5678", "alice2@example.com"));

            var result = userStore.findByTagPrefix("alice", caller.id(), 20);

            assertEquals(1, result.size());
            assertEquals("alice5678", result.get(0).tag());
        }
    }
}
