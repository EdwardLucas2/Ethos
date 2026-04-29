package com.ethos.fuzz;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.code_intelligence.jazzer.api.FuzzedDataProvider;
import com.code_intelligence.jazzer.junit.FuzzTest;
import com.ethos.exception.ConflictException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.service.UserService;
import com.ethos.store.UserStore;

public class ApiFuzzer {

    // Fuzz the tag-prefix generation logic in UserService with arbitrary display names.
    // Exercises the trim/split/replaceAll/substring chain with Unicode, nulls, and
    // pathological whitespace strings.
    @FuzzTest
    void fuzzTagPrefixGeneration(FuzzedDataProvider data) {
        String displayName = data.consumeRemainingAsString();
        UserStore mockStore = mock(UserStore.class);
        when(mockStore.insert(any())).thenThrow(new DuplicateTagException());
        UserService service = new UserService(mockStore);
        try {
            service.registerUser("supertokens-id", "test@example.com", displayName);
        } catch (ConflictException ignored) {
        }
    }
}
