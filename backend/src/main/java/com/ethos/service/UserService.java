package com.ethos.service;

import com.ethos.dto.UserResponse;
import com.ethos.exception.ConflictException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.model.User;
import com.ethos.store.UserStore;
import java.security.SecureRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final int MAX_TAG_ATTEMPTS = 5;
    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserStore userStore;

    public UserService(UserStore userStore) {
        this.userStore = userStore;
    }

    public UserResponse registerUser(String supertokensUserId, String email, String displayName) {
        if (userStore.findBySupertokensUserId(supertokensUserId).isPresent()) {
            throw new ConflictException("Account already registered");
        }

        var prefix = buildTagPrefix(displayName);

        for (int attempt = 0; attempt < MAX_TAG_ATTEMPTS; attempt++) {
            var tag = prefix + randomSuffix(4);
            try {
                var inserted = userStore.insert(new User(null, supertokensUserId, displayName, tag, email, null, null));
                log.info("user.registered userId={}", inserted.id());
                return toResponse(inserted);
            } catch (DuplicateTagException ignored) {
                // retry with a new random suffix
            }
        }
        throw new ConflictException("Could not generate a unique tag — please try again");
    }

    private static String buildTagPrefix(String displayName) {
        var firstWord = displayName.trim().split("\\s+")[0];
        var stripped = firstWord.toLowerCase().replaceAll("[^a-z0-9]", "");
        return stripped.length() > 8 ? stripped.substring(0, 8) : stripped;
    }

    private static String randomSuffix(int length) {
        var sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }

    private static UserResponse toResponse(User user) {
        return new UserResponse(user.id(), user.displayName(), user.tag(), user.email(), null);
    }
}
