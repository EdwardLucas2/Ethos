package com.ethos;

import com.ethos.auth.JwtVerifier;
import com.ethos.dto.ErrorResponse;
import com.ethos.exception.BadRequestException;
import com.ethos.exception.ConflictException;
import com.ethos.exception.ForbiddenException;
import com.ethos.exception.NotFoundException;
import com.ethos.exception.RegistrationIncompleteException;
import com.ethos.handler.UserHandler;
import com.ethos.router.Role;
import com.ethos.store.UserStore;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.router.JavalinDefaultRoutingApi;
import io.jsonwebtoken.JwtException;
import org.slf4j.MDC;

public class AppRouter {

    private final JwtVerifier jwtVerifier;
    private final UserStore userStore;
    private final UserHandler userHandler;

    public AppRouter(JwtVerifier jwtVerifier, UserStore userStore, UserHandler userHandler) {
        this.jwtVerifier = jwtVerifier;
        this.userStore = userStore;
        this.userHandler = userHandler;
    }

    public void configure(JavalinDefaultRoutingApi routes) {
        registerExceptionHandlers(routes);
        registerRoutes(routes);
        registerBeforeHandlers(routes);
        registerAfterHandlers(routes);
    }

    private void registerExceptionHandlers(JavalinDefaultRoutingApi routes) {
        routes.exception(
                BadRequestException.class, (e, ctx) -> ctx.status(400).json(new ErrorResponse(e.getMessage())));
        routes.exception(BadRequestResponse.class, (e, ctx) -> ctx.status(400).json(new ErrorResponse(e.getMessage())));
        routes.exception(JwtException.class, (e, ctx) -> ctx.status(401).json(new ErrorResponse("Unauthorized")));
        routes.exception(RegistrationIncompleteException.class, (e, ctx) -> ctx.status(401)
                .json(new ErrorResponse("registration_incomplete")));
        routes.exception(ForbiddenException.class, (e, ctx) -> ctx.status(403).json(new ErrorResponse(e.getMessage())));
        routes.exception(NotFoundException.class, (e, ctx) -> ctx.status(404).json(new ErrorResponse(e.getMessage())));
        routes.exception(ConflictException.class, (e, ctx) -> ctx.status(409).json(new ErrorResponse(e.getMessage())));
        routes.exception(Exception.class, (e, ctx) -> ctx.status(500).json(new ErrorResponse("Internal server error")));
    }

    private void registerRoutes(JavalinDefaultRoutingApi routes) {
        routes.get("/health", ctx -> ctx.result("OK"), Role.ANYONE);
        routes.post("/users", userHandler::register, Role.JWT_ONLY);
    }

    private void registerBeforeHandlers(JavalinDefaultRoutingApi routes) {
        routes.beforeMatched(ctx -> {
            var roles = ctx.routeRoles();
            if (roles.contains(Role.ANYONE)) return;
            if (roles.contains(Role.JWT_ONLY)) {
                requireJwt(ctx);
            } else {
                requireAuth(ctx);
            }
        });
    }

    private void registerAfterHandlers(JavalinDefaultRoutingApi routes) {
        routes.after(ctx -> MDC.clear());
    }

    private void requireJwt(Context ctx) {
        var claims = jwtVerifier.verify(ctx.header("Authorization"));
        ctx.attribute("supertokensUserId", claims.supertokensUserId());
        ctx.attribute("email", claims.email());
    }

    private void requireAuth(Context ctx) {
        var claims = jwtVerifier.verify(ctx.header("Authorization"));
        var user = userStore
                .findBySupertokensUserId(claims.supertokensUserId())
                .orElseThrow(RegistrationIncompleteException::new);
        ctx.attribute("supertokensUserId", claims.supertokensUserId());
        ctx.attribute("email", claims.email());
        ctx.attribute("userId", user.id());
        MDC.put("userId", user.id().toString());
        MDC.put("path", ctx.path());
    }
}
