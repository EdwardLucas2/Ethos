package com.ethos.handler;

import com.ethos.dto.AddContactRequest;
import com.ethos.dto.ContactResponse;
import com.ethos.dto.CreateUserRequest;
import com.ethos.dto.ErrorResponse;
import com.ethos.dto.UpdateUserRequest;
import com.ethos.dto.UserResponse;
import com.ethos.dto.UserSearchResponse;
import com.ethos.exception.BadRequestException;
import com.ethos.service.UserService;
import io.javalin.http.Context;
import io.javalin.openapi.HttpMethod;
import io.javalin.openapi.OpenApi;
import io.javalin.openapi.OpenApiContent;
import io.javalin.openapi.OpenApiParam;
import io.javalin.openapi.OpenApiRequestBody;
import io.javalin.openapi.OpenApiResponse;
import java.util.UUID;

public class UserHandler {

    private final UserService userService;

    public UserHandler(UserService userService) {
        this.userService = userService;
    }

    @OpenApi(
            path = "/users",
            methods = {HttpMethod.POST},
            summary = "Register a new user",
            description =
                    "Creates the users row after SuperTokens has created the auth account. Called once per signup."
                            + " supertokens_user_id and email are derived from the verified JWT."
                            + " Returns 409 if a users row already exists for this account.",
            tags = {"users"},
            requestBody =
                    @OpenApiRequestBody(required = true, content = @OpenApiContent(from = CreateUserRequest.class)),
            responses = {
                @OpenApiResponse(
                        status = "201",
                        content = @OpenApiContent(from = UserResponse.class),
                        description = "User created"),
                @OpenApiResponse(
                        status = "400",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "displayName is missing or blank"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid"),
                @OpenApiResponse(
                        status = "409",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "A users row already exists for this SuperTokens account")
            })
    public void register(Context ctx) {
        var body = ctx.bodyAsClass(CreateUserRequest.class);
        if (body.displayName() == null || body.displayName().isBlank()) {
            throw new BadRequestException("displayName is required");
        }

        String supertokensUserId = ctx.attribute("supertokensUserId");
        String email = ctx.attribute("email");

        var response = userService.registerUser(supertokensUserId, email, body.displayName());
        ctx.status(201).json(response);
    }

    @OpenApi(
            path = "/users/me",
            methods = {HttpMethod.GET},
            summary = "Get current user",
            description = "Returns the authenticated user's profile.",
            tags = {"users"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = UserResponse.class),
                        description = "Current user profile"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void getMe(Context ctx) {
        UUID userId = ctx.attribute("userId");
        ctx.json(userService.getUser(userId));
    }

    @OpenApi(
            path = "/users/me",
            methods = {HttpMethod.PATCH},
            summary = "Update current user's profile",
            description = "Updates the authenticated user's display name. At least one field required."
                    + " MVP: displayName only; avatar upload is out of scope.",
            tags = {"users"},
            requestBody =
                    @OpenApiRequestBody(required = true, content = @OpenApiContent(from = UpdateUserRequest.class)),
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = UserResponse.class),
                        description = "Updated user profile"),
                @OpenApiResponse(
                        status = "400",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "Body is empty or displayName is blank"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void updateMe(Context ctx) {
        var body = ctx.bodyAsClass(UpdateUserRequest.class);
        if (body.displayName() == null || body.displayName().isBlank()) {
            throw new BadRequestException("displayName is required");
        }
        UUID userId = ctx.attribute("userId");
        ctx.json(userService.updateUser(userId, body.displayName()));
    }

    @OpenApi(
            path = "/users/search",
            methods = {HttpMethod.GET},
            summary = "Search users by tag prefix",
            description = "Prefix-matches against users.tag. Excludes the calling user."
                    + " isContact is true if the result user is already in the caller's contacts."
                    + " Returns up to 20 results ordered by tag ascending.",
            tags = {"users"},
            queryParams = {
                @OpenApiParam(
                        name = "tag",
                        description = "Tag prefix to search. Minimum 2 characters.",
                        required = true)
            },
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = UserSearchResponse[].class),
                        description = "Matching users"),
                @OpenApiResponse(
                        status = "400",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "tag param missing or fewer than 2 characters"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void searchUsers(Context ctx) {
        var tag = ctx.queryParam("tag");
        if (tag == null || tag.length() < 2) {
            throw new BadRequestException("tag param must be at least 2 characters");
        }
        UUID userId = ctx.attribute("userId");
        ctx.json(userService.searchUsers(userId, tag));
    }

    @OpenApi(
            path = "/contacts",
            methods = {HttpMethod.GET},
            summary = "List contacts",
            description = "Returns the calling user's contacts ordered alphabetically by display name.",
            tags = {"users"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = ContactResponse[].class),
                        description = "Contacts list"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void listContacts(Context ctx) {
        UUID userId = ctx.attribute("userId");
        ctx.json(userService.listContacts(userId));
    }

    @OpenApi(
            path = "/contacts",
            methods = {HttpMethod.POST},
            summary = "Add a contact",
            description = "Adds a user to the caller's contacts list. userId comes from a prior tag search result."
                    + " Returns 400 if userId is the caller's own ID, 404 if the user does not exist,"
                    + " 409 if they are already a contact.",
            tags = {"users"},
            requestBody =
                    @OpenApiRequestBody(required = true, content = @OpenApiContent(from = AddContactRequest.class)),
            responses = {
                @OpenApiResponse(
                        status = "201",
                        content = @OpenApiContent(from = ContactResponse.class),
                        description = "Contact added"),
                @OpenApiResponse(
                        status = "400",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "userId is the caller's own ID"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid"),
                @OpenApiResponse(
                        status = "404",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "User not found"),
                @OpenApiResponse(
                        status = "409",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "Already a contact")
            })
    public void addContact(Context ctx) {
        var body = ctx.bodyAsClass(AddContactRequest.class);
        if (body.targetUserId() == null) {
            throw new BadRequestException("targetUserId is required");
        }
        UUID callerId = ctx.attribute("userId");
        ctx.status(201).json(userService.addContact(callerId, body.targetUserId()));
    }

    @OpenApi(
            path = "/contacts/{targetUserId}",
            methods = {HttpMethod.DELETE},
            summary = "Remove a contact",
            description =
                    "Removes a user from the caller's contacts. Path param is the target user's ID, not the contact row ID."
                            + " Returns 404 if the user is not in the caller's contacts.",
            tags = {"users"},
            pathParams = {@OpenApiParam(name = "targetUserId", description = "The target user's ID", required = true)},
            responses = {
                @OpenApiResponse(status = "204", description = "Contact removed"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid"),
                @OpenApiResponse(
                        status = "404",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "Not in contacts")
            })
    public void removeContact(Context ctx) {
        var targetUserId = UUID.fromString(ctx.pathParam("targetUserId"));
        UUID callerId = ctx.attribute("userId");
        userService.removeContact(callerId, targetUserId);
        ctx.status(204);
    }
}
