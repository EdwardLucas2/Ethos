package com.ethos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.ethos.exception.BadRequestException;
import com.ethos.exception.ConflictException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.exception.NotFoundException;
import com.ethos.model.User;
import com.ethos.store.UserStore;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserServiceTest {

    private UserStore userStore;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userStore = mock(UserStore.class);
        userService = new UserService(userStore);
    }

    private User user(String supertokensUserId, String displayName, String tag, String email) {
        return new User(UUID.randomUUID(), supertokensUserId, displayName, tag, email, null, Instant.now());
    }

    @Nested
    class RegisterUser {

        @Test
        void givenValidInput_returnsCreatedUser() {
            when(userStore.findBySupertokensUserId("st-id-1")).thenReturn(Optional.empty());
            var savedUser = user("st-id-1", "Edward", "edward4f2a", "edward@example.com");
            when(userStore.insert(any())).thenReturn(savedUser);

            var result = userService.registerUser("st-id-1", "edward@example.com", "Edward");

            assertEquals(savedUser.id(), result.id());
            assertEquals("Edward", result.displayName());
            assertEquals("edward4f2a", result.tag());
            assertEquals("edward@example.com", result.email());
            assertNull(result.avatarUrl());
        }

        @Test
        void givenExistingSupertokensAccount_throwsConflict() {
            when(userStore.findBySupertokensUserId("st-id-1"))
                    .thenReturn(Optional.of(user("st-id-1", "Edward", "edward4f2a", "edward@example.com")));

            assertThrows(
                    ConflictException.class, () -> userService.registerUser("st-id-1", "edward@example.com", "Edward"));

            verify(userStore, never()).insert(any());
        }

        @Test
        void givenTagCollision_retriesWithNewSuffix() {
            when(userStore.findBySupertokensUserId("st-id-1")).thenReturn(Optional.empty());
            var savedUser = user("st-id-1", "Edward", "edward9z8y", "edward@example.com");
            when(userStore.insert(any())).thenThrow(new DuplicateTagException()).thenReturn(savedUser);

            var result = userService.registerUser("st-id-1", "edward@example.com", "Edward");

            verify(userStore, times(2)).insert(any());
            assertEquals(savedUser.id(), result.id());
        }

        @Test
        void givenDisplayNameWithSpecialChars_stripsToAlphanumeric() {
            when(userStore.findBySupertokensUserId(any())).thenReturn(Optional.empty());
            when(userStore.insert(any())).thenAnswer(inv -> inv.getArgument(0, User.class));

            var result = userService.registerUser("st-id", "e@test.com", "El!ias Smith");

            assertTrue(result.tag().startsWith("elias"), "tag should start with 'elias' but was: " + result.tag());
        }

        @Test
        void givenFirstWordExceedsEightChars_truncatesPrefix() {
            when(userStore.findBySupertokensUserId(any())).thenReturn(Optional.empty());
            when(userStore.insert(any())).thenAnswer(inv -> inv.getArgument(0, User.class));

            var result = userService.registerUser("st-id", "e@test.com", "Bartholomew Jones");

            assertEquals(12, result.tag().length());
            assertTrue(
                    result.tag().startsWith("bartholo"), "tag should start with 'bartholo' but was: " + result.tag());
        }
    }

    @Nested
    class GetUser {

        @Test
        void givenExistingUser_returnsUserResponse() {
            var id = UUID.randomUUID();
            var u = user("st-1", "Alice", "alice1234", "alice@example.com");
            when(userStore.findById(id)).thenReturn(Optional.of(u));

            var result = userService.getUser(id);

            assertEquals(u.displayName(), result.displayName());
            assertEquals(u.email(), result.email());
        }

        @Test
        void givenUnknownId_throwsNotFoundException() {
            when(userStore.findById(any())).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () -> userService.getUser(UUID.randomUUID()));
        }
    }

    @Nested
    class UpdateUser {

        @Test
        void givenValidDisplayName_returnsUpdatedResponse() {
            var id = UUID.randomUUID();
            var updated = user("st-1", "New Name", "alice1234", "alice@example.com");
            when(userStore.update(id, "New Name")).thenReturn(Optional.of(updated));

            var result = userService.updateUser(id, "New Name");

            assertEquals("New Name", result.displayName());
        }

        @Test
        void givenUnknownId_throwsNotFoundException() {
            when(userStore.update(any(), any())).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () -> userService.updateUser(UUID.randomUUID(), "Name"));
        }
    }

    @Nested
    class SearchUsers {

        @Test
        void givenResults_mapsToSearchResponse() {
            var callerId = UUID.randomUUID();
            when(userStore.findByTagPrefix(eq("ali"), eq(callerId), eq(20))).thenReturn(List.of());

            var result = userService.searchUsers(callerId, "ali");

            assertTrue(result.isEmpty());
            verify(userStore).findByTagPrefix("ali", callerId, 20);
        }
    }

    @Nested
    class AddContact {

        @Test
        void givenValidTarget_returnsContactResponse() {
            var callerId = UUID.randomUUID();
            var targetId = UUID.randomUUID();
            var target = user("st-2", "Bob", "bob1234ab", "bob@example.com");
            when(userStore.findById(targetId)).thenReturn(Optional.of(target));
            when(userStore.insertContact(callerId, targetId)).thenReturn(true);

            var result = userService.addContact(callerId, targetId);

            assertEquals(target.displayName(), result.displayName());
            assertEquals(target.tag(), result.tag());
        }

        @Test
        void givenSelfAdd_throwsBadRequest() {
            var id = UUID.randomUUID();

            assertThrows(BadRequestException.class, () -> userService.addContact(id, id));

            verify(userStore, never()).insertContact(any(), any());
        }

        @Test
        void givenUnknownTarget_throwsNotFoundException() {
            var callerId = UUID.randomUUID();
            var targetId = UUID.randomUUID();
            when(userStore.findById(targetId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () -> userService.addContact(callerId, targetId));
        }

        @Test
        void givenAlreadyContact_throwsConflict() {
            var callerId = UUID.randomUUID();
            var targetId = UUID.randomUUID();
            var target = user("st-2", "Bob", "bob1234ab", "bob@example.com");
            when(userStore.findById(targetId)).thenReturn(Optional.of(target));
            when(userStore.insertContact(callerId, targetId)).thenReturn(false);

            assertThrows(ConflictException.class, () -> userService.addContact(callerId, targetId));
        }
    }

    @Nested
    class RemoveContact {

        @Test
        void givenExistingContact_completes() {
            var callerId = UUID.randomUUID();
            var targetId = UUID.randomUUID();
            when(userStore.deleteContact(callerId, targetId)).thenReturn(true);

            assertDoesNotThrow(() -> userService.removeContact(callerId, targetId));
        }

        @Test
        void givenNonExistentContact_throwsNotFoundException() {
            var callerId = UUID.randomUUID();
            var targetId = UUID.randomUUID();
            when(userStore.deleteContact(callerId, targetId)).thenReturn(false);

            assertThrows(NotFoundException.class, () -> userService.removeContact(callerId, targetId));
        }
    }
}
