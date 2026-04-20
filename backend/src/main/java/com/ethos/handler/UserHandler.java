package com.ethos.handler;

import com.ethos.dto.CreateUserRequest;
import com.ethos.dto.ErrorResponse;
import com.ethos.dto.UserResponse;
import com.ethos.exception.BadRequestException;
import com.ethos.service.UserService;
import io.javalin.http.Context;
import io.javalin.openapi.HttpMethod;
import io.javalin.openapi.OpenApi;
import io.javalin.openapi.OpenApiContent;
import io.javalin.openapi.OpenApiRequestBody;
import io.javalin.openapi.OpenApiResponse;

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
                    @OpenApiRequestBody(
                            required = true,
                            content = @OpenApiContent(from = CreateUserRequest.class)),
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
}
