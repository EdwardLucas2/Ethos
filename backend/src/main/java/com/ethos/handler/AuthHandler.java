package com.ethos.handler;

import com.ethos.auth.SuperTokensCoreClient;
import com.ethos.dto.AuthResponse;
import com.ethos.dto.ErrorResponse;
import com.ethos.dto.SignupRequest;
import com.ethos.exception.BadRequestException;
import io.javalin.http.Context;
import io.javalin.openapi.HttpMethod;
import io.javalin.openapi.OpenApi;
import io.javalin.openapi.OpenApiContent;
import io.javalin.openapi.OpenApiRequestBody;
import io.javalin.openapi.OpenApiResponse;

public class AuthHandler {

    private final SuperTokensCoreClient superTokensCoreClient;

    public AuthHandler(SuperTokensCoreClient superTokensCoreClient) {
        this.superTokensCoreClient = superTokensCoreClient;
    }

    @OpenApi(
            path = "/auth/signup",
            methods = {HttpMethod.POST},
            summary = "Sign up with email and password",
            tags = {"auth"},
            requestBody =
                    @OpenApiRequestBody(required = true, content = @OpenApiContent(from = SignupRequest.class)),
            responses = {
                @OpenApiResponse(
                        status = "201",
                        content = @OpenApiContent(from = AuthResponse.class),
                        description = "Signed up successfully, returns access token"),
                @OpenApiResponse(
                        status = "400",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "Missing or invalid fields"),
                @OpenApiResponse(
                        status = "409",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "Email already registered")
            })
    public void signup(Context ctx) {
        var body = ctx.bodyAsClass(SignupRequest.class);
        if (body.email() == null || body.email().isBlank()) {
            throw new BadRequestException("email is required");
        }
        if (body.password() == null || body.password().isBlank()) {
            throw new BadRequestException("password is required");
        }
        var userId = superTokensCoreClient.signUp(body.email(), body.password());
        var token = superTokensCoreClient.createSession(userId, body.email());
        ctx.status(201).json(new AuthResponse(token));
    }
}
