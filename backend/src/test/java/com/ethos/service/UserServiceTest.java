package com.ethos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.ethos.exception.ConflictException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.model.User;
import com.ethos.store.UserStore;
import java.time.Instant;
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
            // Return the User that was passed to insert (the DB hasn't assigned an id yet)
            when(userStore.insert(any())).thenAnswer(inv -> inv.getArgument(0, User.class));

            var result = userService.registerUser("st-id", "e@test.com", "El!ias Smith");

            assertTrue(result.tag().startsWith("elias"), "tag should start with 'elias' but was: " + result.tag());
        }

        @Test
        void givenFirstWordExceedsEightChars_truncatesPrefix() {
            when(userStore.findBySupertokensUserId(any())).thenReturn(Optional.empty());
            when(userStore.insert(any())).thenAnswer(inv -> inv.getArgument(0, User.class));

            var result = userService.registerUser("st-id", "e@test.com", "Bartholomew Jones");

            // prefix truncated to 8 chars + 4 random suffix = 12 total
            assertEquals(12, result.tag().length());
            assertTrue(
                    result.tag().startsWith("bartholo"), "tag should start with 'bartholo' but was: " + result.tag());
        }

        private User user(String supertokensUserId, String displayName, String tag, String email) {
            return new User(UUID.randomUUID(), supertokensUserId, displayName, tag, email, null, Instant.now());
        }
    }
}
