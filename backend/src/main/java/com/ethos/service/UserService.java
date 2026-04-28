package com.ethos.service;

import com.ethos.dto.ContactResponse;
import com.ethos.dto.UserResponse;
import com.ethos.dto.UserSearchResponse;
import com.ethos.exception.BadRequestException;
import com.ethos.exception.ConflictException;
import com.ethos.exception.DuplicateAccountException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.exception.NotFoundException;
import com.ethos.model.User;
import com.ethos.store.UserStore;
import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
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
        String prefix = buildTagPrefix(displayName);

        for (int attempt = 0; attempt < MAX_TAG_ATTEMPTS; attempt++) {
            String tag = prefix + randomSuffix(4);
            try {
                User inserted =
                        userStore.insert(new User(null, supertokensUserId, displayName, tag, email, null, null));
                log.info("user.registered userId={}", inserted.id());
                return toResponse(inserted);
            } catch (DuplicateTagException ignored) {
                // retry with a new random suffix
            } catch (DuplicateAccountException e) {
                throw new ConflictException(e.getMessage());
            }
        }
        throw new ConflictException("Could not generate a unique tag — please try again");
    }

    public UserResponse getUser(UUID userId) {
        return userStore.findById(userId).map(UserService::toResponse).orElseThrow(NotFoundException::new);
    }

    public UserResponse updateUser(UUID userId, String displayName) {
        return userStore
                .update(userId, displayName)
                .map(UserService::toResponse)
                .orElseThrow(NotFoundException::new);
    }

    public List<UserSearchResponse> searchUsers(UUID callerUserId, String tagPrefix) {
        return userStore.findByTagPrefix(tagPrefix, callerUserId, 20).stream()
                .map(r -> new UserSearchResponse(r.id(), r.displayName(), r.tag(), null, r.isContact()))
                .toList();
    }

    public List<ContactResponse> listContacts(UUID callerUserId) {
        return userStore.findAllContacts(callerUserId).stream()
                .map(UserService::toContactResponse)
                .toList();
    }

    public ContactResponse addContact(UUID callerUserId, UUID targetUserId) {
        if (callerUserId.equals(targetUserId)) {
            throw new BadRequestException("Cannot add yourself as a contact");
        }
        User target = userStore.findById(targetUserId).orElseThrow(NotFoundException::new);
        if (!userStore.insertContact(callerUserId, targetUserId)) {
            throw new ConflictException("Already a contact");
        }
        log.info("contact.added userId={} contactUserId={}", callerUserId, targetUserId);
        return toContactResponse(target);
    }

    public void removeContact(UUID callerUserId, UUID targetUserId) {
        if (!userStore.deleteContact(callerUserId, targetUserId)) {
            throw new NotFoundException();
        }
        log.info("contact.removed userId={} contactUserId={}", callerUserId, targetUserId);
    }

    private static String buildTagPrefix(String displayName) {
        String firstWord = displayName.trim().split("\\s+")[0];
        String stripped = firstWord.toLowerCase().replaceAll("[^a-z0-9]", "");
        return stripped.length() > 8 ? stripped.substring(0, 8) : stripped;
    }

    private static String randomSuffix(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }

    private static UserResponse toResponse(User user) {
        return new UserResponse(user.id(), user.displayName(), user.tag(), user.email(), null);
    }

    private static ContactResponse toContactResponse(User user) {
        return new ContactResponse(user.id(), user.displayName(), user.tag(), null);
    }
}
